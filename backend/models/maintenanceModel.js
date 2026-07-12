import pool from '../config/db.js';

// Create a maintenance request
export const createMaintenanceRequest = async ({
  asset_id,
  reported_by,
  issue_description,
  priority,
  photo_url
}) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Verify asset exists and is not retired/disposed
    const [assets] = await connection.query('SELECT status FROM assets WHERE id = ? FOR UPDATE', [asset_id]);
    if (assets.length === 0) {
      throw new Error('Asset not found.');
    }
    const assetStatus = assets[0].status;
    if (assetStatus === 'Retired' || assetStatus === 'Disposed') {
      throw new Error(`Cannot request maintenance on a ${assetStatus} asset.`);
    }

    const query = `
      INSERT INTO maintenance_requests (asset_id, reported_by, issue_description, priority, photo_url, status)
      VALUES (?, ?, ?, ?, ?, 'Pending')
    `;
    const [result] = await connection.query(query, [
      asset_id,
      reported_by,
      issue_description.trim(),
      priority || 'Medium',
      photo_url || null
    ]);

    const requestId = result.insertId;

    // Log in maintenance_updates history
    await connection.query(`
      INSERT INTO maintenance_updates (request_id, updated_by, status, notes)
      VALUES (?, ?, 'Pending', 'Request submitted.')
    `, [requestId, reported_by]);

    // Log asset activity history
    await connection.query(`
      INSERT INTO asset_history (asset_id, user_id, action_type, details)
      VALUES (?, ?, 'Maintenance', ?)
    `, [asset_id, reported_by, 'Maintenance request submitted. Status: Pending.']);

    await connection.commit();
    return requestId;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// Fetch maintenance requests with user-role filtering
export const getMaintenanceRequests = async (userId, userRole, userDeptId) => {
  let query = `
    SELECT mr.*, 
           a.name AS asset_name, 
           a.asset_tag,
           a.status AS asset_status,
           u_rep.full_name AS reported_by_name,
           u_app.full_name AS approved_by_name
    FROM maintenance_requests mr
    LEFT JOIN assets a ON mr.asset_id = a.id
    LEFT JOIN users u_rep ON mr.reported_by = u_rep.id
    LEFT JOIN users u_app ON mr.approved_by = u_app.id
    WHERE 1=1
  `;
  const params = [];

  if (userRole === 'employee') {
    query += ' AND mr.reported_by = ?';
    params.push(userId);
  } else if (userRole === 'dept_head') {
    query += ' AND (mr.reported_by = ? OR u_rep.department_id = ?)';
    params.push(userId, userDeptId);
  } // Admins and Asset Managers see all

  query += ' ORDER BY mr.created_at DESC';
  const [rows] = await pool.query(query, params);
  return rows;
};

// Get maintenance request by ID
export const getMaintenanceRequestById = async (id) => {
  const query = `
    SELECT mr.*, 
           a.name AS asset_name, 
           a.asset_tag,
           a.status AS asset_status,
           u_rep.full_name AS reported_by_name,
           u_app.full_name AS approved_by_name
    FROM maintenance_requests mr
    LEFT JOIN assets a ON mr.asset_id = a.id
    LEFT JOIN users u_rep ON mr.reported_by = u_rep.id
    LEFT JOIN users u_app ON mr.approved_by = u_app.id
    WHERE mr.id = ?
    LIMIT 1
  `;
  const [rows] = await pool.query(query, [id]);
  return rows[0] || null;
};

// Get status updates log for a maintenance request
export const getMaintenanceUpdates = async (request_id) => {
  const query = `
    SELECT mu.*, u.full_name AS updated_by_name
    FROM maintenance_updates mu
    LEFT JOIN users u ON mu.updated_by = u.id
    WHERE mu.request_id = ?
    ORDER BY mu.created_at DESC
  `;
  const [rows] = await pool.query(query, [request_id]);
  return rows;
};

// Update maintenance request status and handle asset status changes
export const updateMaintenanceStatus = async (
  requestId,
  updatedByUserId,
  { status, technician_assigned, notes }
) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Fetch current request details
    const [requests] = await connection.query('SELECT * FROM maintenance_requests WHERE id = ? FOR UPDATE', [requestId]);
    if (requests.length === 0) {
      throw new Error('Maintenance request not found.');
    }
    const request = requests[0];
    const currentStatus = request.status;

    // Automatic promotion: If Pending -> Approved but they provided a technician, target status becomes Technician Assigned!
    let targetStatus = status;
    if (currentStatus === 'Pending' && status === 'Approved' && technician_assigned) {
      targetStatus = 'Technician Assigned';
    }

    // Validate workflow transitions
    const allowedTransitions = {
      'Pending': ['Approved', 'Rejected', 'Technician Assigned'],
      'Approved': ['Technician Assigned', 'In Progress'],
      'Technician Assigned': ['In Progress'],
      'In Progress': ['Resolved'],
      'Rejected': [],
      'Resolved': []
    };

    if (!allowedTransitions[currentStatus].includes(targetStatus)) {
      throw new Error(`Invalid status transition from ${currentStatus} to ${targetStatus}.`);
    }

    // 2. Update request
    let updateQuery = 'UPDATE maintenance_requests SET status = ?';
    const params = [targetStatus];

    if (targetStatus === 'Approved' || targetStatus === 'Rejected' || targetStatus === 'Technician Assigned') {
      updateQuery += ', approved_by = ?';
      params.push(updatedByUserId);
    }

    if (technician_assigned) {
      updateQuery += ', technician_assigned = ?';
      params.push(technician_assigned);
    }

    updateQuery += ' WHERE id = ?';
    params.push(requestId);

    await connection.query(updateQuery, params);

    // 3. Log in maintenance_updates
    await connection.query(`
      INSERT INTO maintenance_updates (request_id, updated_by, status, notes)
      VALUES (?, ?, ?, ?)
    `, [requestId, updatedByUserId, targetStatus, notes || `Status updated to ${targetStatus}.`]);

    // 4. Update asset status
    // On Approval / Tech Assignment -> asset becomes "Under Maintenance"
    // On Resolution -> asset becomes "Available"
    if (targetStatus === 'Approved' || targetStatus === 'Technician Assigned') {
      await connection.query("UPDATE assets SET status = 'Under Maintenance' WHERE id = ?", [request.asset_id]);
      await connection.query(`
        INSERT INTO asset_history (asset_id, user_id, action_type, details)
        VALUES (?, ?, 'Maintenance', ?)
      `, [request.asset_id, updatedByUserId, `Maintenance request approved. Asset set to Under Maintenance. (State: ${targetStatus})`]);
    } else if (targetStatus === 'Resolved') {
      await connection.query("UPDATE assets SET status = 'Available' WHERE id = ?", [request.asset_id]);
      await connection.query(`
        INSERT INTO asset_history (asset_id, user_id, action_type, details)
        VALUES (?, ?, 'Maintenance', 'Maintenance request resolved. Asset reverted to Available.')
      `, [request.asset_id, updatedByUserId]);
    } else if (targetStatus === 'Rejected') {
      await connection.query(`
        INSERT INTO asset_history (asset_id, user_id, action_type, details)
        VALUES (?, ?, 'Maintenance', 'Maintenance request rejected.')
      `, [request.asset_id, updatedByUserId]);
    }

    await connection.commit();
    return true;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};
