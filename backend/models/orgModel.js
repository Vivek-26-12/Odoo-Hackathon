import pool from '../config/db.js';

// --- DEPARTMENT FUNCTIONS ---

export const createDepartment = async ({ name, head_id, parent_id, status }) => {
  const query = `
    INSERT INTO departments (name, head_id, parent_id, status)
    VALUES (?, ?, ?, ?)
  `;
  const [result] = await pool.query(query, [
    name.trim(),
    head_id || null,
    parent_id || null,
    status || 'active'
  ]);
  return result.insertId;
};

export const getDepartments = async () => {
  const query = `
    SELECT 
      d.id, 
      d.name, 
      d.head_id, 
      u.full_name AS head_name,
      u.email AS head_email,
      d.parent_id, 
      p.name AS parent_name,
      d.status,
      d.created_at,
      d.updated_at
    FROM departments d
    LEFT JOIN users u ON d.head_id = u.id
    LEFT JOIN departments p ON d.parent_id = p.id
    ORDER BY d.name ASC
  `;
  const [rows] = await pool.query(query);
  return rows;
};

export const getDepartmentById = async (id) => {
  const query = `
    SELECT 
      d.*, 
      u.full_name AS head_name, 
      p.name AS parent_name
    FROM departments d
    LEFT JOIN users u ON d.head_id = u.id
    LEFT JOIN departments p ON d.parent_id = p.id
    WHERE d.id = ?
    LIMIT 1
  `;
  const [rows] = await pool.query(query, [id]);
  return rows[0] || null;
};

export const updateDepartment = async (id, { name, head_id, parent_id, status }) => {
  const query = `
    UPDATE departments 
    SET name = ?, head_id = ?, parent_id = ?, status = ?
    WHERE id = ?
  `;
  const [result] = await pool.query(query, [
    name.trim(),
    head_id || null,
    parent_id || null,
    status || 'active',
    id
  ]);
  return result.affectedRows > 0;
};

// --- CATEGORY FUNCTIONS ---

export const createCategory = async ({ name, fields }) => {
  const query = `
    INSERT INTO categories (name, fields)
    VALUES (?, ?)
  `;
  const [result] = await pool.query(query, [
    name.trim(),
    fields ? JSON.stringify(fields) : null
  ]);
  return result.insertId;
};

export const getCategories = async () => {
  const query = 'SELECT * FROM categories ORDER BY name ASC';
  const [rows] = await pool.query(query);
  return rows.map(row => ({
    ...row,
    fields: typeof row.fields === 'string' ? JSON.parse(row.fields) : row.fields
  }));
};

export const getCategoryById = async (id) => {
  const query = 'SELECT * FROM categories WHERE id = ? LIMIT 1';
  const [rows] = await pool.query(query, [id]);
  if (!rows[0]) return null;
  const row = rows[0];
  return {
    ...row,
    fields: typeof row.fields === 'string' ? JSON.parse(row.fields) : row.fields
  };
};

export const updateCategory = async (id, { name, fields }) => {
  const query = `
    UPDATE categories 
    SET name = ?, fields = ?
    WHERE id = ?
  `;
  const [result] = await pool.query(query, [
    name.trim(),
    fields ? JSON.stringify(fields) : null,
    id
  ]);
  return result.affectedRows > 0;
};

// --- EMPLOYEE DIRECTORY & PROMOTION FUNCTIONS ---

export const getEmployees = async () => {
  const query = `
    SELECT 
      u.id, 
      u.full_name, 
      u.email, 
      u.role, 
      u.status, 
      u.department_id, 
      d.name AS department_name,
      u.is_verified,
      u.created_at
    FROM users u
    LEFT JOIN departments d ON u.department_id = d.id
    ORDER BY u.full_name ASC
  `;
  const [rows] = await pool.query(query);
  return rows;
};

export const updateEmployeeRole = async (id, role) => {
  const query = 'UPDATE users SET role = ? WHERE id = ?';
  const [result] = await pool.query(query, [role, id]);
  return result.affectedRows > 0;
};

export const updateEmployeeStatus = async (id, status) => {
  const query = 'UPDATE users SET status = ? WHERE id = ?';
  const [result] = await pool.query(query, [status, id]);
  return result.affectedRows > 0;
};

export const updateEmployeeDepartment = async (id, department_id) => {
  const query = 'UPDATE users SET department_id = ? WHERE id = ?';
  const [result] = await pool.query(query, [department_id || null, id]);
  return result.affectedRows > 0;
};
