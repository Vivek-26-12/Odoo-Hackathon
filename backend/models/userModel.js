import pool from '../config/db.js';

// Find a user by their email address
export const findUserByEmail = async (email) => {
  const query = 'SELECT * FROM users WHERE email = ? LIMIT 1';
  const [rows] = await pool.query(query, [email.toLowerCase().trim()]);
  return rows[0] || null;
};

// Find a user by their ID
export const findUserById = async (id) => {
  const query = 'SELECT id, full_name, email, is_verified, created_at, updated_at FROM users WHERE id = ? LIMIT 1';
  const [rows] = await pool.query(query, [id]);
  return rows[0] || null;
};

// Create a new user with registration details
export const createUser = async ({ name, email, passwordHash, otp, otpExpiry }) => {
  const query = `
    INSERT INTO users (full_name, email, password_hash, otp, otp_expiry, is_verified)
    VALUES (?, ?, ?, ?, ?, FALSE)
  `;
  const [result] = await pool.query(query, [
    name.trim(),
    email.toLowerCase().trim(),
    passwordHash,
    otp,
    otpExpiry
  ]);
  return result.insertId;
};

// Update user OTP code and expiration time
export const updateUserOTP = async (email, otp, otpExpiry) => {
  const query = 'UPDATE users SET otp = ?, otp_expiry = ? WHERE email = ?';
  const [result] = await pool.query(query, [otp, otpExpiry, email.toLowerCase().trim()]);
  return result.affectedRows > 0;
};

// Mark account as verified and clear OTP fields
export const verifyUser = async (email) => {
  const query = 'UPDATE users SET is_verified = TRUE, otp = NULL, otp_expiry = NULL WHERE email = ?';
  const [result] = await pool.query(query, [email.toLowerCase().trim()]);
  return result.affectedRows > 0;
};

// Update password and clear OTP fields (used in Reset Password)
export const updatePassword = async (email, passwordHash) => {
  const query = 'UPDATE users SET password_hash = ?, otp = NULL, otp_expiry = NULL WHERE email = ?';
  const [result] = await pool.query(query, [passwordHash, email.toLowerCase().trim()]);
  return result.affectedRows > 0;
};
