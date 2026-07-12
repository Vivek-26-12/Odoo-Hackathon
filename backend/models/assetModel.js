import pool from '../config/db.js';

// Get next sequential asset tag
export const generateNextAssetTag = async (connection) => {
  const conn = connection || pool;
  const query = 'SELECT asset_tag FROM assets ORDER BY id DESC LIMIT 1';
  const [rows] = await conn.query(query);
  
  if (rows.length === 0) {
    return 'AF-0001';
  }
  
  const lastTag = rows[0].asset_tag; // e.g., "AF-0023"
  const match = lastTag.match(/^AF-(\d+)$/i);
  if (!match) {
    return 'AF-0001';
  }
  
  const nextNum = parseInt(match[1], 10) + 1;
  return `AF-${String(nextNum).padStart(4, '0')}`;
};

// Create a new asset
export const createAsset = async ({
  name,
  category_id,
  serial_number,
  acquisition_date,
  acquisition_cost,
  condition_status,
  location,
  photo_url,
  is_shared,
  custom_fields
}) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const assetTag = await generateNextAssetTag(connection);

    const query = `
      INSERT INTO assets (name, category_id, asset_tag, serial_number, acquisition_date, acquisition_cost, condition_status, location, photo_url, is_shared, custom_fields, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Available')
    `;

    const [result] = await connection.query(query, [
      name.trim(),
      category_id,
      assetTag,
      serial_number.trim(),
      acquisition_date,
      acquisition_cost,
      condition_status || 'New',
      location.trim(),
      photo_url || null,
      is_shared ? 1 : 0,
      custom_fields ? JSON.stringify(custom_fields) : null
    ]);

    await connection.commit();
    return { assetId: result.insertId, assetTag };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// Get assets with optional search & filters
export const getAssets = async ({ search, category_id, status, location, is_shared, department_id }) => {
  let query = `
    SELECT 
      a.*, 
      c.name AS category_name,
      -- Get latest allocation details if any
      al.employee_id AS current_holder_id,
      u.full_name AS current_holder_name,
      al.department_id AS current_dept_id,
      d.name AS current_dept_name
    FROM assets a
    LEFT JOIN categories c ON a.category_id = c.id
    LEFT JOIN asset_allocations al ON a.id = al.asset_id AND al.status = 'Active'
    LEFT JOIN users u ON al.employee_id = u.id
    LEFT JOIN departments d ON al.department_id = d.id
    WHERE 1=1
  `;
  
  const params = [];

  if (search) {
    query += ` AND (a.name LIKE ? OR a.asset_tag LIKE ? OR a.serial_number LIKE ? OR a.location LIKE ?)`;
    const searchWildcard = `%${search}%`;
    params.push(searchWildcard, searchWildcard, searchWildcard, searchWildcard);
  }

  if (category_id) {
    query += ` AND a.category_id = ?`;
    params.push(category_id);
  }

  if (status) {
    query += ` AND a.status = ?`;
    params.push(status);
  }

  if (location) {
    query += ` AND a.location LIKE ?`;
    params.push(`%${location}%`);
  }

  if (is_shared !== undefined && is_shared !== '') {
    query += ` AND a.is_shared = ?`;
    params.push(is_shared === 'true' || is_shared === 1 || is_shared === true ? 1 : 0);
  }

  if (department_id) {
    // Filter by department holding the asset
    query += ` AND al.department_id = ?`;
    params.push(department_id);
  }

  query += ' ORDER BY a.id DESC';

  const [rows] = await pool.query(query, params);
  return rows.map(row => ({
    ...row,
    custom_fields: typeof row.custom_fields === 'string' ? JSON.parse(row.custom_fields) : row.custom_fields
  }));
};

// Get single asset details
export const getAssetById = async (id) => {
  const query = `
    SELECT a.*, c.name AS category_name
    FROM assets a
    LEFT JOIN categories c ON a.category_id = c.id
    WHERE a.id = ?
    LIMIT 1
  `;
  const [rows] = await pool.query(query, [id]);
  if (!rows[0]) return null;
  const row = rows[0];
  return {
    ...row,
    custom_fields: typeof row.custom_fields === 'string' ? JSON.parse(row.custom_fields) : row.custom_fields
  };
};

// Log asset activity history
export const logAssetHistory = async (asset_id, user_id, action_type, details) => {
  const query = `
    INSERT INTO asset_history (asset_id, user_id, action_type, details)
    VALUES (?, ?, ?, ?)
  `;
  const [result] = await pool.query(query, [asset_id, user_id, action_type, details]);
  return result.insertId;
};

// Get asset history log (joins allocations and maintenance events for audit log)
export const getAssetHistoryLog = async (asset_id) => {
  const query = `
    SELECT 
      h.id, 
      h.asset_id, 
      h.user_id, 
      u.full_name AS user_name, 
      h.action_type, 
      h.details, 
      h.created_at
    FROM asset_history h
    LEFT JOIN users u ON h.user_id = u.id
    WHERE h.asset_id = ?
    ORDER BY h.created_at DESC
  `;
  const [rows] = await pool.query(query, [asset_id]);
  return rows;
};

// Update asset details
export const updateAsset = async (id, {
  name,
  category_id,
  serial_number,
  acquisition_date,
  acquisition_cost,
  condition_status,
  location,
  photo_url,
  is_shared,
  custom_fields,
  status
}) => {
  const query = `
    UPDATE assets 
    SET name = ?, category_id = ?, serial_number = ?, acquisition_date = ?, acquisition_cost = ?, condition_status = ?, location = ?, photo_url = ?, is_shared = ?, custom_fields = ?, status = ?
    WHERE id = ?
  `;
  const [result] = await pool.query(query, [
    name.trim(),
    category_id,
    serial_number.trim(),
    acquisition_date,
    acquisition_cost,
    condition_status,
    location.trim(),
    photo_url || null,
    is_shared ? 1 : 0,
    custom_fields ? JSON.stringify(custom_fields) : null,
    status,
    id
  ]);
  return result.affectedRows > 0;
};

// Update asset status only
export const updateAssetStatus = async (id, status) => {
  const query = 'UPDATE assets SET status = ? WHERE id = ?';
  const [result] = await pool.query(query, [status, id]);
  return result.affectedRows > 0;
};
