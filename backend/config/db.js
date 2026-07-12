import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

let pool;

try {
  // Use DATABASE_URL if available, otherwise fallback to individual variables
  if (process.env.DATABASE_URL) {
    pool = mysql.createPool({
      uri: process.env.DATABASE_URL,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      ssl: {
        rejectUnauthorized: false // Required for connecting to Aiven MySQL securely without needing local certificate file
      }
    });
  } else {
    pool = mysql.createPool({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '22427', 10),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      ssl: {
        rejectUnauthorized: false
      }
    });
  }
  
  console.log('✔ MySQL Connection Pool created successfully.');
} catch (error) {
  console.error('❌ Error creating MySQL connection pool:', error.message);
  process.exit(1);
}

export default pool;
