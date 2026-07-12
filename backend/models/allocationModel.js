import pool from '../config/db.js';
import { updateAssetStatus, logAssetHistory } from './assetModel.js';

// Get active allocation for an asset
export const getActiveAllocationForAsset = async (asset_id) => {
  const query = `
    SELECT al.*, 
           u.full_name AS employee_name, 
           u.email AS employee_email,
           d.name AS department_name
    FROM asset_allocations al
    LEFT JOIN users u ON al.employee_id = u.id
    LEFT JOIN departments d ON al.department_id = d.id
    WHERE al.asset_id = ? AND al.status = 'Active'
    LIMIT 1
  `;
  const [rows] = await pool.query(query, [asset_id]);
  return rows[0] || null;
};

// Create a new allocation
export const createAllocation = async ({
  asset_id,
  allocated_to_type,
  employee_id,
  department_id,
  allocated_by,
  expected_return_date
}) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Verify asset is Available
    const [assets] = await connection.query('SELECT status, name FROM assets WHERE id = ? FOR UPDATE', [asset_id]);
    if (assets.length === 0) {
      throw new Error('Asset not found.');
    }
    if (assets[0].status !== 'Available') {
      throw new Error(`Asset is not available for allocation. Current status: ${assets[0].status}`);
    }

    // 2. Insert into asset_allocations
    const allocationQuery = `
      INSERT INTO asset_allocations (asset_id, allocated_to_type, employee_id, department_id, allocated_by, allocation_date, expected_return_date, status)
      VALUES (?, ?, ?, ?, ?, CURDATE(), ?, 'Active')
    `;
    const [result] = await connection.query(allocationQuery, [
      asset_id,
      allocated_to_type,
      employee_id || null,
      department_id || null,
      allocated_by,
      expected_return_date || null
    ]);

    // 3. Update asset status to Allocated
    await connection.query("UPDATE assets SET status = 'Allocated' WHERE id = ?", [asset_id]);

    // 4. Log activity history
    const holderName = allocated_to_type === 'employee' 
      ? `employee ID ${employee_id}` 
      : `department ID ${department_id}`;
    
    await connection.query(`
      INSERT INTO asset_history (asset_id, user_id, action_type, details)
      VALUES (?, ?, 'Allocation', ?)
    `, [asset_id, allocated_by, `Asset allocated to ${holderName}.`]);

    await connection.commit();
    return result.insertId;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// Create transfer request
export const createTransferRequest = async ({
  asset_id,
  from_employee_id,
  to_employee_id,
  requested_by
}) => {
  const query = `
    INSERT INTO transfer_requests (asset_id, from_employee_id, to_employee_id, requested_by, status)
    VALUES (?, ?, ?, ?, 'Pending')
  `;
  const [result] = await pool.query(query, [
    asset_id,
    from_employee_id,
    to_employee_id,
    requested_by
  ]);
  return result.insertId;
};

// Get transfer request by ID
export const getTransferRequestById = async (id) => {
  const query = `
    SELECT tr.*, 
           a.name AS asset_name, 
           a.asset_tag, 
           u_from.full_name AS from_employee_name,
           u_from.department_id AS from_dept_id,
           u_to.full_name AS to_employee_name,
           u_to.department_id AS to_dept_id,
           u_req.full_name AS requested_by_name
    FROM transfer_requests tr
    LEFT JOIN assets a ON tr.asset_id = a.id
    LEFT JOIN users u_from ON tr.from_employee_id = u_from.id
    LEFT JOIN users u_to ON tr.to_employee_id = u_to.id
    LEFT JOIN users u_req ON tr.requested_by = u_req.id
    WHERE tr.id = ?
    LIMIT 1
  `;
  const [rows] = await pool.query(query, [id]);
  return rows[0] || null;
};

// Get transfer requests based on user scope
export const getTransferRequests = async (userId, userRole, userDeptId) => {
  let query = `
    SELECT tr.*, 
           a.name AS asset_name, 
           a.asset_tag, 
           u_from.full_name AS from_employee_name,
           u_to.full_name AS to_employee_name,
           u_req.full_name AS requested_by_name
    FROM transfer_requests tr
    LEFT JOIN assets a ON tr.asset_id = a.id
    LEFT JOIN users u_from ON tr.from_employee_id = u_from.id
    LEFT JOIN users u_to ON tr.to_employee_id = u_to.id
    LEFT JOIN users u_req ON tr.requested_by = u_req.id
    WHERE 1=1
  `;
  const params = [];

  if (userRole === 'employee') {
    query += ' AND (tr.requested_by = ? OR tr.from_employee_id = ? OR tr.to_employee_id = ?)';
    params.push(userId, userId, userId);
  } else if (userRole === 'dept_head') {
    query += ' AND (tr.requested_by = ? OR u_from.department_id = ? OR u_to.department_id = ?)';
    params.push(userId, userDeptId, userDeptId);
  } // Admins and Asset Managers see all

  query += ' ORDER BY tr.created_at DESC';
  const [rows] = await pool.query(query, params);
  return rows;
};

// Approve transfer request
export const approveTransfer = async (transferId, approvedByUserId) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Fetch transfer details
    const [transfers] = await connection.query('SELECT * FROM transfer_requests WHERE id = ? FOR UPDATE', [transferId]);
    if (transfers.length === 0) {
      throw new Error('Transfer request not found.');
    }
    const transfer = transfers[0];
    if (transfer.status !== 'Pending') {
      throw new Error('Transfer request is already resolved.');
    }

    // 2. Fetch the current active allocation for the asset
    const [allocations] = await connection.query(
      "SELECT * FROM asset_allocations WHERE asset_id = ? AND status = 'Active' FOR UPDATE",
      [transfer.asset_id]
    );

    // 3. Mark the active allocation as returned/transferred
    if (allocations.length > 0) {
      await connection.query(
        "UPDATE asset_allocations SET status = 'Returned', returned_date = CURDATE(), checkin_notes = 'Transferred to another employee' WHERE id = ?",
        [allocations[0].id]
      );
    }

    // 4. Create new allocation for target employee
    const newAllocationQuery = `
      INSERT INTO asset_allocations (asset_id, allocated_to_type, employee_id, allocated_by, allocation_date, status)
      VALUES (?, 'employee', ?, ?, CURDATE(), 'Active')
    `;
    await connection.query(newAllocationQuery, [
      transfer.asset_id,
      transfer.to_employee_id,
      approvedByUserId
    ]);

    // 5. Update transfer request status
    await connection.query(
      "UPDATE transfer_requests SET status = 'Approved', approved_by = ? WHERE id = ?",
      [approvedByUserId, transferId]
    );

    // 6. Log asset history
    await connection.query(`
      INSERT INTO asset_history (asset_id, user_id, action_type, details)
      VALUES (?, ?, 'Transfer', ?)
    `, [transfer.asset_id, approvedByUserId, `Asset transfer approved. Moved from employee ID ${transfer.from_employee_id} to employee ID ${transfer.to_employee_id}.`]);

    await connection.commit();
    return true;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// Reject transfer request
export const rejectTransfer = async (transferId, rejectedByUserId) => {
  const query = "UPDATE transfer_requests SET status = 'Rejected', approved_by = ? WHERE id = ?";
  const [result] = await pool.query(query, [rejectedByUserId, transferId]);
  return result.affectedRows > 0;
};

// Return asset
export const returnAsset = async (asset_id, returned_by, { return_condition, checkin_notes }) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Get active allocation
    const [allocations] = await connection.query(
      "SELECT * FROM asset_allocations WHERE asset_id = ? AND status = 'Active' FOR UPDATE",
      [asset_id]
    );
    if (allocations.length === 0) {
      throw new Error('No active allocation found for this asset.');
    }

    // 2. Mark allocation as returned
    const returnQuery = `
      UPDATE asset_allocations 
      SET status = 'Returned', returned_date = CURDATE(), return_condition = ?, checkin_notes = ?
      WHERE id = ?
    `;
    await connection.query(returnQuery, [
      return_condition || 'Good',
      checkin_notes || 'Returned successfully.',
      allocations[0].id
    ]);

    // 3. Mark asset as Available and update its condition status
    const assetUpdateQuery = `
      UPDATE assets 
      SET status = 'Available', condition_status = ? 
      WHERE id = ?
    `;
    await connection.query(assetUpdateQuery, [
      return_condition || 'Good',
      asset_id
    ]);

    // 4. Log asset history
    await connection.query(`
      INSERT INTO asset_history (asset_id, user_id, action_type, details)
      VALUES (?, ?, 'Return', ?)
    `, [asset_id, returned_by, `Asset returned by user. Condition: ${return_condition || 'Good'}. Notes: ${checkin_notes || 'None'}.`]);

    await connection.commit();
    return true;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// Fetch overdue allocations (expected_return_date < CURDATE() and status is 'Active')
export const getOverdueAllocations = async () => {
  const query = `
    SELECT al.*, 
           a.name AS asset_name, 
           a.asset_tag,
           u.full_name AS employee_name, 
           u.email AS employee_email,
           d.name AS department_name
    FROM asset_allocations al
    LEFT JOIN assets a ON al.asset_id = a.id
    LEFT JOIN users u ON al.employee_id = u.id
    LEFT JOIN departments d ON al.department_id = d.id
    WHERE al.expected_return_date < CURDATE() 
      AND al.status = 'Active'
    ORDER BY al.expected_return_date ASC
  `;
  const [rows] = await pool.query(query);
  return rows;
};
