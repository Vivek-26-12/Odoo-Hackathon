import pool from '../config/db.js';

const initDatabase = async () => {
  const connection = await pool.getConnection();
  try {
    console.log('🔄 Checking database connection and initializing schema...');
    
    // Create users table
    const createUsersTableQuery = `
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        otp VARCHAR(6) DEFAULT NULL,
        otp_expiry DATETIME DEFAULT NULL,
        is_verified BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_email (email),
        INDEX idx_otp (otp)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    
    await connection.query(createUsersTableQuery);
    console.log('✔ Schema initialization complete: "users" table is verified.');
    
  } catch (error) {
    console.error('❌ Database schema initialization failed:', error.message);
    process.exit(1);
  } finally {
    connection.release();
  }
};

// Execute if run directly
initDatabase()
  .then(() => {
    console.log('✔ Database initialized successfully. Exiting.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Database initialization error:', err);
    process.exit(1);
  });
