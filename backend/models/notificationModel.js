import pool from '../config/db.js';

// --- NOTIFICATION FUNCTIONS ---

export const createNotification = async ({ user_id, title, message, type }) => {
  const query = `
    INSERT INTO notifications (user_id, title, message, type, is_read)
    VALUES (?, ?, ?, ?, FALSE)
  `;
  const [result] = await pool.query(query, [user_id, title, message, type]);
  return result.insertId;
};

export const getUserNotifications = async (user_id) => {
  const query = `
    SELECT * FROM notifications 
    WHERE user_id = ? 
    ORDER BY created_at DESC 
    LIMIT 50
  `;
  const [rows] = await pool.query(query, [user_id]);
  return rows;
};

export const markAsRead = async (id, user_id) => {
  const query = 'UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?';
  const [result] = await pool.query(query, [id, user_id]);
  return result.affectedRows > 0;
};

export const markAllAsRead = async (user_id) => {
  const query = 'UPDATE notifications SET is_read = TRUE WHERE user_id = ?';
  const [result] = await pool.query(query, [user_id]);
  return result.affectedRows > 0;
};

// --- ACTIVITY LOG FUNCTIONS ---

export const logActivity = async ({ user_id, action, details }) => {
  const query = `
    INSERT INTO activity_logs (user_id, action, details)
    VALUES (?, ?, ?)
  `;
  const [result] = await pool.query(query, [user_id, action, details ? details.trim() : null]);
  return result.insertId;
};

export const getSystemLogs = async () => {
  const query = `
    SELECT al.*, u.full_name AS user_name, u.email AS user_email, u.role AS user_role
    FROM activity_logs al
    LEFT JOIN users u ON al.user_id = u.id
    ORDER BY al.created_at DESC
    LIMIT 100
  `;
  const [rows] = await pool.query(query);
  return rows;
};
