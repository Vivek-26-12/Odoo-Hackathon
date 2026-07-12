import pool from '../config/db.js';
import bcrypt from 'bcryptjs';

const initDatabase = async () => {
  const connection = await pool.getConnection();
  try {
    console.log('🔄 Checking database connection and initializing schema...');
    
    // Disable foreign key checks to allow dropping and recreating tables cleanly
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    
    console.log('🧹 Dropping existing tables for a clean schema reset...');
    const tablesToDrop = [
      'asset_history',
      'activity_logs',
      'notifications',
      'audit_assets',
      'audit_auditors',
      'audit_cycles',
      'maintenance_updates',
      'maintenance_requests',
      'bookings',
      'resources',
      'transfer_requests',
      'asset_allocations',
      'assets',
      'categories',
      'departments',
      'users'
    ];
    
    for (const table of tablesToDrop) {
      await connection.query(`DROP TABLE IF EXISTS ${table}`);
    }
    console.log('✔ Dropped existing tables.');
    
    // 1. Users Table
    const createUsersTableQuery = `
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        otp VARCHAR(6) DEFAULT NULL,
        otp_expiry DATETIME DEFAULT NULL,
        is_verified BOOLEAN DEFAULT FALSE,
        role ENUM('admin', 'asset_manager', 'dept_head', 'employee') DEFAULT 'employee',
        status ENUM('active', 'inactive') DEFAULT 'active',
        department_id INT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_email (email),
        INDEX idx_otp (otp)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    await connection.query(createUsersTableQuery);
    console.log('✔ "users" table is verified.');

    // 2. Departments Table
    const createDepartmentsTableQuery = `
      CREATE TABLE IF NOT EXISTS departments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        head_id INT DEFAULT NULL,
        parent_id INT DEFAULT NULL,
        status ENUM('active', 'inactive') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (head_id) REFERENCES users (id) ON DELETE SET NULL,
        FOREIGN KEY (parent_id) REFERENCES departments (id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    await connection.query(createDepartmentsTableQuery);
    console.log('✔ "departments" table is verified.');

    // Add foreign key constraint to users table for department_id
    // First, let's check if the constraint already exists by attempting to add it safely,
    // or we can rely on SET FOREIGN_KEY_CHECKS = 0 during creation.
    // In MySQL, we can add the constraint inline in users table definition if SET FOREIGN_KEY_CHECKS = 0.
    // Let's alter users table to add the constraint if it's not already there.
    try {
      await connection.query(`
        ALTER TABLE users 
        ADD CONSTRAINT fk_user_department 
        FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
      `);
      console.log('✔ Added department foreign key constraint to users.');
    } catch (err) {
      // Constraint might already exist
    }

    // 3. Categories Table
    const createCategoriesTableQuery = `
      CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        fields JSON DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    await connection.query(createCategoriesTableQuery);
    console.log('✔ "categories" table is verified.');

    // 4. Assets Table
    const createAssetsTableQuery = `
      CREATE TABLE IF NOT EXISTS assets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        category_id INT NOT NULL,
        asset_tag VARCHAR(50) UNIQUE NOT NULL,
        serial_number VARCHAR(100) UNIQUE NOT NULL,
        acquisition_date DATE NOT NULL,
        acquisition_cost DECIMAL(10, 2) NOT NULL,
        condition_status ENUM('New', 'Good', 'Fair', 'Poor', 'Damaged') DEFAULT 'New',
        location VARCHAR(255) NOT NULL,
        photo_url VARCHAR(500) DEFAULT NULL,
        is_shared BOOLEAN DEFAULT FALSE,
        custom_fields JSON DEFAULT NULL,
        status ENUM('Available', 'Allocated', 'Reserved', 'Under Maintenance', 'Lost', 'Retired', 'Disposed') DEFAULT 'Available',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE RESTRICT
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    await connection.query(createAssetsTableQuery);
    console.log('✔ "assets" table is verified.');

    // 4.5. Asset History Table
    const createAssetHistoryTableQuery = `
      CREATE TABLE IF NOT EXISTS asset_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        asset_id INT NOT NULL,
        user_id INT NOT NULL,
        action_type VARCHAR(100) NOT NULL,
        details TEXT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (asset_id) REFERENCES assets (id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    await connection.query(createAssetHistoryTableQuery);
    console.log('✔ "asset_history" table is verified.');

    // 5. Asset Allocations Table
    const createAllocationsTableQuery = `
      CREATE TABLE IF NOT EXISTS asset_allocations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        asset_id INT NOT NULL,
        allocated_to_type ENUM('employee', 'department') NOT NULL,
        employee_id INT DEFAULT NULL,
        department_id INT DEFAULT NULL,
        allocated_by INT NOT NULL,
        allocation_date DATE NOT NULL,
        expected_return_date DATE DEFAULT NULL,
        returned_date DATE DEFAULT NULL,
        return_condition ENUM('New', 'Good', 'Fair', 'Poor', 'Damaged', 'Lost') DEFAULT NULL,
        checkin_notes TEXT DEFAULT NULL,
        status ENUM('Active', 'Returned', 'Overdue') DEFAULT 'Active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (asset_id) REFERENCES assets (id) ON DELETE CASCADE,
        FOREIGN KEY (employee_id) REFERENCES users (id) ON DELETE SET NULL,
        FOREIGN KEY (department_id) REFERENCES departments (id) ON DELETE SET NULL,
        FOREIGN KEY (allocated_by) REFERENCES users (id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    await connection.query(createAllocationsTableQuery);
    console.log('✔ "asset_allocations" table is verified.');

    // 6. Transfer Requests Table
    const createTransfersTableQuery = `
      CREATE TABLE IF NOT EXISTS transfer_requests (
        id INT AUTO_INCREMENT PRIMARY KEY,
        asset_id INT NOT NULL,
        from_employee_id INT NOT NULL,
        to_employee_id INT NOT NULL,
        requested_by INT NOT NULL,
        approved_by INT DEFAULT NULL,
        status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (asset_id) REFERENCES assets (id) ON DELETE CASCADE,
        FOREIGN KEY (from_employee_id) REFERENCES users (id) ON DELETE CASCADE,
        FOREIGN KEY (to_employee_id) REFERENCES users (id) ON DELETE CASCADE,
        FOREIGN KEY (requested_by) REFERENCES users (id) ON DELETE CASCADE,
        FOREIGN KEY (approved_by) REFERENCES users (id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    await connection.query(createTransfersTableQuery);
    console.log('✔ "transfer_requests" table is verified.');

    // 7. Resources Table
    const createResourcesTableQuery = `
      CREATE TABLE IF NOT EXISTS resources (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        type ENUM('room', 'vehicle', 'equipment') NOT NULL,
        description TEXT DEFAULT NULL,
        status ENUM('Active', 'Inactive') DEFAULT 'Active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    await connection.query(createResourcesTableQuery);
    console.log('✔ "resources" table is verified.');

    // 8. Bookings Table
    const createBookingsTableQuery = `
      CREATE TABLE IF NOT EXISTS bookings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        resource_id INT NOT NULL,
        booked_by INT NOT NULL,
        booked_for_type ENUM('employee', 'department') NOT NULL,
        department_id INT DEFAULT NULL,
        start_time DATETIME NOT NULL,
        end_time DATETIME NOT NULL,
        status ENUM('Upcoming', 'Ongoing', 'Completed', 'Cancelled') DEFAULT 'Upcoming',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (resource_id) REFERENCES resources (id) ON DELETE CASCADE,
        FOREIGN KEY (booked_by) REFERENCES users (id) ON DELETE CASCADE,
        FOREIGN KEY (department_id) REFERENCES departments (id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    await connection.query(createBookingsTableQuery);
    console.log('✔ "bookings" table is verified.');

    // 9. Maintenance Requests Table
    const createMaintenanceRequestsTableQuery = `
      CREATE TABLE IF NOT EXISTS maintenance_requests (
        id INT AUTO_INCREMENT PRIMARY KEY,
        asset_id INT NOT NULL,
        reported_by INT NOT NULL,
        issue_description TEXT NOT NULL,
        priority ENUM('Low', 'Medium', 'High', 'Critical') DEFAULT 'Medium',
        photo_url VARCHAR(500) DEFAULT NULL,
        approved_by INT DEFAULT NULL,
        technician_assigned VARCHAR(255) DEFAULT NULL,
        status ENUM('Pending', 'Approved', 'Rejected', 'In Progress', 'Resolved') DEFAULT 'Pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (asset_id) REFERENCES assets (id) ON DELETE CASCADE,
        FOREIGN KEY (reported_by) REFERENCES users (id) ON DELETE CASCADE,
        FOREIGN KEY (approved_by) REFERENCES users (id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    await connection.query(createMaintenanceRequestsTableQuery);
    console.log('✔ "maintenance_requests" table is verified.');

    // 10. Maintenance Updates Table
    const createMaintenanceUpdatesTableQuery = `
      CREATE TABLE IF NOT EXISTS maintenance_updates (
        id INT AUTO_INCREMENT PRIMARY KEY,
        request_id INT NOT NULL,
        updated_by INT NOT NULL,
        status ENUM('Pending', 'Approved', 'Rejected', 'In Progress', 'Resolved') NOT NULL,
        notes TEXT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (request_id) REFERENCES maintenance_requests (id) ON DELETE CASCADE,
        FOREIGN KEY (updated_by) REFERENCES users (id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    await connection.query(createMaintenanceUpdatesTableQuery);
    console.log('✔ "maintenance_updates" table is verified.');

    // 11. Audit Cycles Table
    const createAuditCyclesTableQuery = `
      CREATE TABLE IF NOT EXISTS audit_cycles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        department_id INT DEFAULT NULL,
        location VARCHAR(255) DEFAULT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        created_by INT NOT NULL,
        status ENUM('Draft', 'Active', 'Completed') DEFAULT 'Draft',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (department_id) REFERENCES departments (id) ON DELETE SET NULL,
        FOREIGN KEY (created_by) REFERENCES users (id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    await connection.query(createAuditCyclesTableQuery);
    console.log('✔ "audit_cycles" table is verified.');

    // 12. Audit Auditors Table
    const createAuditAuditorsTableQuery = `
      CREATE TABLE IF NOT EXISTS audit_auditors (
        audit_cycle_id INT NOT NULL,
        auditor_id INT NOT NULL,
        PRIMARY KEY (audit_cycle_id, auditor_id),
        FOREIGN KEY (audit_cycle_id) REFERENCES audit_cycles (id) ON DELETE CASCADE,
        FOREIGN KEY (auditor_id) REFERENCES users (id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    await connection.query(createAuditAuditorsTableQuery);
    console.log('✔ "audit_auditors" table is verified.');

    // 13. Audit Assets Table
    const createAuditAssetsTableQuery = `
      CREATE TABLE IF NOT EXISTS audit_assets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        audit_cycle_id INT NOT NULL,
        asset_id INT NOT NULL,
        auditor_id INT NOT NULL,
        verification_status ENUM('Pending', 'Verified', 'Missing', 'Damaged') DEFAULT 'Pending',
        notes TEXT DEFAULT NULL,
        verified_at DATETIME DEFAULT NULL,
        FOREIGN KEY (audit_cycle_id) REFERENCES audit_cycles (id) ON DELETE CASCADE,
        FOREIGN KEY (asset_id) REFERENCES assets (id) ON DELETE CASCADE,
        FOREIGN KEY (auditor_id) REFERENCES users (id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    await connection.query(createAuditAssetsTableQuery);
    console.log('✔ "audit_assets" table is verified.');

    // 14. Notifications Table
    const createNotificationsTableQuery = `
      CREATE TABLE IF NOT EXISTS notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(100) NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    await connection.query(createNotificationsTableQuery);
    console.log('✔ "notifications" table is verified.');

    // 15. Activity Logs Table
    const createActivityLogsTableQuery = `
      CREATE TABLE IF NOT EXISTS activity_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        action VARCHAR(255) NOT NULL,
        details TEXT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    await connection.query(createActivityLogsTableQuery);
    console.log('✔ "activity_logs" table is verified.');

    // Re-enable foreign key checks
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('✔ Database schema verified successfully.');

    // Seed Default Admin User
    const adminEmail = 'admin@assetflow.com';
    const [existingAdmin] = await connection.query('SELECT id FROM users WHERE email = ? LIMIT 1', [adminEmail]);
    if (existingAdmin.length === 0) {
      console.log('🌱 Seeding default admin user (admin@assetflow.com)...');
      const salt = await bcrypt.genSalt(10);
      const adminPasswordHash = await bcrypt.hash('Admin@123', salt);
      await connection.query(
        `INSERT INTO users (full_name, email, password_hash, is_verified, role, status) 
         VALUES (?, ?, ?, TRUE, 'admin', 'active')`,
        ['System Admin', adminEmail, adminPasswordHash]
      );
      console.log('✔ Seeded default admin successfully.');
    } else {
      console.log('✔ Default admin user already exists.');
    }

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
