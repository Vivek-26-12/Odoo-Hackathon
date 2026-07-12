import pool from '../config/db.js';

// Create audit cycle, assign auditors, and auto-scope assets
export const createAuditCycle = async ({
  name,
  department_id,
  location,
  start_date,
  end_date,
  created_by,
  auditor_ids // array of user IDs
}) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Insert Audit Cycle
    const cycleQuery = `
      INSERT INTO audit_cycles (name, department_id, location, start_date, end_date, created_by, status)
      VALUES (?, ?, ?, ?, ?, ?, 'Active')
    `;
    const [cycleResult] = await connection.query(cycleQuery, [
      name.trim(),
      department_id || null,
      location ? location.trim() : null,
      start_date,
      end_date,
      created_by
    ]);
    const cycleId = cycleResult.insertId;

    // 2. Assign Auditors
    if (auditor_ids && auditor_ids.length > 0) {
      const auditorQuery = 'INSERT INTO audit_auditors (audit_cycle_id, auditor_id) VALUES (?, ?)';
      for (const auditorId of auditor_ids) {
        await connection.query(auditorQuery, [cycleId, auditorId]);
      }
    }

    // 3. Discover and scope assets
    let assetQuery = `
      SELECT DISTINCT a.id, a.asset_tag, a.name 
      FROM assets a
      LEFT JOIN asset_allocations al ON a.id = al.asset_id AND al.status = 'Active'
      WHERE a.status NOT IN ('Retired', 'Disposed')
    `;
    const params = [];

    if (department_id) {
      assetQuery += ' AND al.department_id = ?';
      params.push(department_id);
    }
    if (location) {
      assetQuery += ' AND a.location LIKE ?';
      params.push(`%${location}%`);
    }

    const [scopedAssets] = await connection.query(assetQuery, params);

    // 4. Populate audit_assets with Pending status
    if (scopedAssets.length > 0) {
      const auditAssetInsertQuery = `
        INSERT INTO audit_assets (audit_cycle_id, asset_id, auditor_id, verification_status)
        VALUES (?, ?, ?, 'Pending')
      `;
      // Default auditor for insertion is the creator or first assigned auditor
      const defaultAuditor = (auditor_ids && auditor_ids.length > 0) ? auditor_ids[0] : created_by;
      
      for (const asset of scopedAssets) {
        await connection.query(auditAssetInsertQuery, [cycleId, asset.id, defaultAuditor]);
      }
    }

    // 5. Log activity
    await connection.query(`
      INSERT INTO activity_logs (user_id, action, details)
      VALUES (?, 'Audit Cycle Created', ?)
    `, [created_by, `Audit cycle "${name}" created with ${scopedAssets.length} scoped assets.`]);

    await connection.commit();
    return { cycleId, scopedAssetsCount: scopedAssets.length };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// Get audit cycles with user scope
export const getAuditCyclesList = async (userId, userRole) => {
  let query = `
    SELECT DISTINCT ac.*, 
           d.name AS department_name,
           u.full_name AS creator_name
    FROM audit_cycles ac
    LEFT JOIN departments d ON ac.department_id = d.id
    LEFT JOIN users u ON ac.created_by = u.id
    LEFT JOIN audit_auditors aa ON ac.id = aa.audit_cycle_id
    WHERE 1=1
  `;
  const params = [];

  // Auditors/employees can only see cycles they are assigned to, except admins/managers
  if (userRole !== 'admin' && userRole !== 'asset_manager') {
    query += ' AND (ac.created_by = ? OR aa.auditor_id = ?)';
    params.push(userId, userId);
  }

  query += ' ORDER BY ac.created_at DESC';
  const [rows] = await pool.query(query, params);
  return rows;
};

// Get single audit cycle
export const getAuditCycleDetails = async (id) => {
  const cycleQuery = `
    SELECT ac.*, d.name AS department_name, u.full_name AS creator_name
    FROM audit_cycles ac
    LEFT JOIN departments d ON ac.department_id = d.id
    LEFT JOIN users u ON ac.created_by = u.id
    WHERE ac.id = ?
    LIMIT 1
  `;
  const [cycles] = await pool.query(cycleQuery, [id]);
  if (cycles.length === 0) return null;

  const cycle = cycles[0];

  // Fetch auditors
  const auditorsQuery = `
    SELECT u.id, u.full_name, u.email 
    FROM audit_auditors aa
    JOIN users u ON aa.auditor_id = u.id
    WHERE aa.audit_cycle_id = ?
  `;
  const [auditors] = await pool.query(auditorsQuery, [id]);
  cycle.auditors = auditors;

  return cycle;
};

// Get scoped assets in an audit cycle
export const getAuditCycleAssets = async (cycleId) => {
  const query = `
    SELECT aa.*, 
           a.name AS asset_name, 
           a.asset_tag, 
           a.serial_number,
           a.location AS registered_location,
           a.status AS current_status,
           u.full_name AS auditor_name
    FROM audit_assets aa
    JOIN assets a ON aa.asset_id = a.id
    LEFT JOIN users u ON aa.auditor_id = u.id
    WHERE aa.audit_cycle_id = ?
    ORDER BY a.asset_tag ASC
  `;
  const [rows] = await pool.query(query, [cycleId]);
  return rows;
};

// Verify/audit a specific asset
export const verifyAsset = async (cycleId, assetId, auditorId, { verification_status, notes }) => {
  const query = `
    UPDATE audit_assets 
    SET verification_status = ?, notes = ?, auditor_id = ?, verified_at = NOW()
    WHERE audit_cycle_id = ? AND asset_id = ?
  `;
  const [result] = await pool.query(query, [
    verification_status,
    notes ? notes.trim() : null,
    auditorId,
    cycleId,
    assetId
  ]);
  return result.affectedRows > 0;
};

// Get discrepancy report (flagged items: Missing or Damaged)
export const getAuditDiscrepancies = async (cycleId) => {
  const query = `
    SELECT aa.*, 
           a.name AS asset_name, 
           a.asset_tag, 
           a.serial_number,
           a.status AS current_status,
           u.full_name AS auditor_name
    FROM audit_assets aa
    JOIN assets a ON aa.asset_id = a.id
    LEFT JOIN users u ON aa.auditor_id = u.id
    WHERE aa.audit_cycle_id = ? 
      AND aa.verification_status IN ('Missing', 'Damaged')
    ORDER BY a.asset_tag ASC
  `;
  const [rows] = await pool.query(query, [cycleId]);
  return rows;
};

// Close audit cycle and update assets
export const closeAuditCycle = async (cycleId, closedByUserId) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Fetch cycle
    const [cycles] = await connection.query('SELECT * FROM audit_cycles WHERE id = ? FOR UPDATE', [cycleId]);
    if (cycles.length === 0) {
      throw new Error('Audit cycle not found.');
    }
    const cycle = cycles[0];
    if (cycle.status !== 'Active') {
      throw new Error('Audit cycle is already closed.');
    }

    // 2. Fetch all verified/scoped items
    const [assets] = await connection.query(
      'SELECT asset_id, verification_status, notes FROM audit_assets WHERE audit_cycle_id = ?',
      [cycleId]
    );

    // 3. Auto-update asset statuses
    for (const item of assets) {
      if (item.verification_status === 'Missing') {
        // Confirmed missing items update status to Lost
        await connection.query("UPDATE assets SET status = 'Lost' WHERE id = ?", [item.asset_id]);
        
        await connection.query(`
          INSERT INTO asset_history (asset_id, user_id, action_type, details)
          VALUES (?, ?, 'Audit Close', ?)
        `, [item.asset_id, closedByUserId, `Asset confirmed missing during audit cycle "${cycle.name}". Status changed to Lost.`]);
      } else if (item.verification_status === 'Damaged') {
        // Optionally update damaged status in history
        await connection.query(`
          INSERT INTO asset_history (asset_id, user_id, action_type, details)
          VALUES (?, ?, 'Audit Close', ?)
        `, [item.asset_id, closedByUserId, `Asset flagged as Damaged during audit cycle "${cycle.name}". Notes: ${item.notes || 'None'}.`]);
      } else if (item.verification_status === 'Verified') {
        await connection.query(`
          INSERT INTO asset_history (asset_id, user_id, action_type, details)
          VALUES (?, ?, 'Audit Close', ?)
        `, [item.asset_id, closedByUserId, `Asset verified successfully during audit cycle "${cycle.name}".`]);
      }
    }

    // 4. Close cycle
    await connection.query("UPDATE audit_cycles SET status = 'Completed' WHERE id = ?", [cycleId]);

    // 5. Log activity
    await connection.query(`
      INSERT INTO activity_logs (user_id, action, details)
      VALUES (?, 'Audit Cycle Closed', ?)
    `, [closedByUserId, `Audit cycle "${cycle.name}" closed. Asset statuses synchronized.`]);

    await connection.commit();
    return true;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};
