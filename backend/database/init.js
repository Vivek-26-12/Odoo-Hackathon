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
    let adminUserId = 1;
    const salt = await bcrypt.genSalt(10);
    const defaultPasswordHash = await bcrypt.hash('Admin@123', salt);
    const employeePasswordHash = await bcrypt.hash('Password@123', salt);

    const [existingAdmin] = await connection.query('SELECT id FROM users WHERE email = ? LIMIT 1', [adminEmail]);
    if (existingAdmin.length === 0) {
      console.log('🌱 Seeding default admin user (admin@assetflow.com)...');
      const [adminResult] = await connection.query(
        `INSERT INTO users (full_name, email, password_hash, is_verified, role, status) 
         VALUES (?, ?, ?, TRUE, 'admin', 'active')`,
        ['System Admin', adminEmail, defaultPasswordHash]
      );
      adminUserId = adminResult.insertId;
      console.log('✔ Seeded default admin successfully.');
    } else {
      adminUserId = existingAdmin[0].id;
      console.log('✔ Default admin user already exists.');
    }

    // Seed Departments
    console.log('🌱 Seeding departments...');
    const [dept1] = await connection.query(
      "INSERT INTO departments (name) VALUES ('Engineering')",
      []
    );
    const [dept2] = await connection.query(
      "INSERT INTO departments (name) VALUES ('HR & Operations')",
      []
    );
    const [dept3] = await connection.query(
      "INSERT INTO departments (name) VALUES ('Sales & Marketing')",
      []
    );

    const engineeringId = dept1.insertId;
    const hrOpsId = dept2.insertId;

    // Seed Users / Employees
    console.log('🌱 Seeding test users...');
    const [user1Result] = await connection.query(
      `INSERT INTO users (full_name, email, password_hash, is_verified, role, status, department_id) 
       VALUES ('Priya Devi', 'priya.devi@assetflow.com', ?, TRUE, 'dept_head', 'active', ?)`,
      [employeePasswordHash, engineeringId]
    );
    const [user2Result] = await connection.query(
      `INSERT INTO users (full_name, email, password_hash, is_verified, role, status, department_id) 
       VALUES ('Rahul Raghavan', 'rahul.raghavan@assetflow.com', ?, TRUE, 'employee', 'active', ?)`,
      [employeePasswordHash, engineeringId]
    );
    const [user3Result] = await connection.query(
      `INSERT INTO users (full_name, email, password_hash, is_verified, role, status, department_id) 
       VALUES ('Sarah Connor', 'sarah.connor@assetflow.com', ?, TRUE, 'asset_manager', 'active', ?)`,
      [employeePasswordHash, hrOpsId]
    );
    const [user4Result] = await connection.query(
      `INSERT INTO users (full_name, email, password_hash, is_verified, role, status, department_id) 
       VALUES ('John Doe', 'john.doe@assetflow.com', ?, TRUE, 'employee', 'active', ?)`,
      [employeePasswordHash, hrOpsId]
    );

    const priyaId = user1Result.insertId;
    const rahulId = user2Result.insertId;
    const sarahId = user3Result.insertId;
    const johnId = user4Result.insertId;

    // Update Engineering head_id
    await connection.query('UPDATE departments SET head_id = ? WHERE id = ?', [priyaId, engineeringId]);

    // Seed Categories
    console.log('🌱 Seeding categories...');
    const [cat1] = await connection.query(
      `INSERT INTO categories (name, fields) VALUES ('Laptops', ?)`,
      [JSON.stringify([
        { name: 'ram', label: 'RAM Memory', type: 'text' },
        { name: 'storage', label: 'Storage Size', type: 'text' },
        { name: 'warranty_months', label: 'Warranty (Months)', type: 'number' }
      ])]
    );
    const [cat2] = await connection.query(
      `INSERT INTO categories (name, fields) VALUES ('Vehicles', ?)`,
      [JSON.stringify([
        { name: 'license_plate', label: 'License Plate', type: 'text' },
        { name: 'fuel_type', label: 'Fuel Type', type: 'text' }
      ])]
    );

    const laptopsCatId = cat1.insertId;
    const vehiclesCatId = cat2.insertId;

    // Seed Assets
    console.log('🌱 Seeding assets directory...');
    // Asset 1: Macbook Pro (Allocated to Priya)
    const [asset1Result] = await connection.query(
      `INSERT INTO assets (name, category_id, asset_tag, serial_number, acquisition_date, acquisition_cost, condition_status, location, is_shared, status, custom_fields) 
       VALUES ('MacBook Pro 16" M3 Max', ?, 'AF-0001', 'SN-MBP16-9872', '2026-01-15', 3499.00, 'New', 'Bangalore Office, Room 401', FALSE, 'Allocated', ?)`,
      [laptopsCatId, JSON.stringify({ ram: '48GB', storage: '1TB SSD', warranty_months: 36 })]
    );
    // Asset 2: Dell Latitude (Available)
    const [asset2Result] = await connection.query(
      `INSERT INTO assets (name, category_id, asset_tag, serial_number, acquisition_date, acquisition_cost, condition_status, location, is_shared, status, custom_fields) 
       VALUES ('Dell Latitude 5420', ?, 'AF-0002', 'SN-DELL-6152', '2026-02-10', 1250.00, 'Good', 'Delhi Office, Desk 12', FALSE, 'Available', ?)`,
      [laptopsCatId, JSON.stringify({ ram: '16GB', storage: '512GB SSD', warranty_months: 12 })]
    );
    // Asset 3: Tesla Model 3 (Shared / Bookable)
    const [asset3Result] = await connection.query(
      `INSERT INTO assets (name, category_id, asset_tag, serial_number, acquisition_date, acquisition_cost, condition_status, location, is_shared, status, custom_fields) 
       VALUES ('Tesla Model 3', ?, 'AF-0003', 'SN-TESLA-9921', '2026-03-01', 38990.00, 'New', 'Bangalore Garage, Bay 2', TRUE, 'Available', ?)`,
      [vehiclesCatId, JSON.stringify({ license_plate: 'KA-03-MJ-1290', fuel_type: 'Electric' })]
    );
    // Asset 4: Projector (Under Maintenance)
    const [asset4Result] = await connection.query(
      `INSERT INTO assets (name, category_id, asset_tag, serial_number, acquisition_date, acquisition_cost, condition_status, location, is_shared, status) 
       VALUES ('Epson projector EB-X06', ?, 'AF-0004', 'SN-EPSON-3122', '2026-02-28', 550.00, 'Fair', 'Bangalore Conference Room B', TRUE, 'Under Maintenance')`,
      [laptopsCatId]
    );
    // Asset 5: Keyboard (Overdue Allocation)
    const [asset5Result] = await connection.query(
      `INSERT INTO assets (name, category_id, asset_tag, serial_number, acquisition_date, acquisition_cost, condition_status, location, is_shared, status) 
       VALUES ('Keychron K2 Keyboard', ?, 'AF-0005', 'SN-KEYBOARD-1234', '2026-04-10', 99.00, 'Good', 'Bangalore Office, Desk 50', FALSE, 'Allocated')`,
      [laptopsCatId]
    );

    const asset1Id = asset1Result.insertId;
    const asset2Id = asset2Result.insertId;
    const asset3Id = asset3Result.insertId;
    const asset4Id = asset4Result.insertId;
    const asset5Id = asset5Result.insertId;

    // Seed Asset Allocations
    console.log('🌱 Seeding asset allocations...');
    // Active allocation: Macbook to Priya
    const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
    const ninetyDaysHence = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
    await connection.query(
      `INSERT INTO asset_allocations (asset_id, allocated_to_type, employee_id, allocated_by, allocation_date, expected_return_date, status) 
       VALUES (?, 'employee', ?, ?, ?, ?, 'Active')`,
      [asset1Id, priyaId, adminUserId, tenDaysAgo, ninetyDaysHence]
    );
    // Overdue allocation: Keyboard to John Doe
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
    await connection.query(
      `INSERT INTO asset_allocations (asset_id, allocated_to_type, employee_id, allocated_by, allocation_date, expected_return_date, status) 
       VALUES (?, 'employee', ?, ?, ?, ?, 'Active')`,
      [asset5Id, johnId, adminUserId, thirtyDaysAgo, fiveDaysAgo]
    );

    // Seed Transfer Requests
    console.log('🌱 Seeding transfer requests...');
    await connection.query(
      `INSERT INTO transfer_requests (asset_id, from_employee_id, to_employee_id, requested_by, status) 
       VALUES (?, ?, ?, ?, 'Pending')`,
      [asset1Id, priyaId, rahulId, rahulId]
    );

    // Seed Resources & Bookings
    console.log('🌱 Seeding resources and bookings...');
    const [res1] = await connection.query(
      "INSERT INTO resources (name, type, description, status) VALUES ('Conference Room A1 (Glassmorphism)', 'room', 'Seating capacity 12, screen and whiteboards', 'Active')",
      []
    );
    const [res2] = await connection.query(
      "INSERT INTO resources (name, type, description, status) VALUES ('Company Tesla Model 3', 'vehicle', 'Tesla Model 3 reserved for client transport', 'Active')",
      []
    );
    const confRoomResId = res1.insertId;

    // Booking: Today from 14:00 to 15:30
    const today2PM = new Date();
    today2PM.setHours(14, 0, 0, 0);
    const today330PM = new Date();
    today330PM.setHours(15, 30, 0, 0);
    await connection.query(
      `INSERT INTO bookings (resource_id, start_time, end_time, booked_by, booked_for_type, status) 
       VALUES (?, ?, ?, ?, 'employee', 'Upcoming')`,
      [confRoomResId, today2PM, today330PM, priyaId]
    );

    // Seed Maintenance Requests
    console.log('🌱 Seeding maintenance logs...');
    // Request 1: Projector (Pending)
    await connection.query(
      `INSERT INTO maintenance_requests (asset_id, reported_by, issue_description, priority, status) 
       VALUES (?, ?, 'Projector lamp flickering and dimming during presentations.', 'High', 'Pending')`,
      [asset4Id, priyaId]
    );
    // Request 2: Dell Latitude (In Progress)
    await connection.query(
      `INSERT INTO maintenance_requests (asset_id, reported_by, issue_description, priority, status, technician_assigned) 
       VALUES (?, ?, 'Broken spacebar key requires full keyboard replacement.', 'Medium', 'In Progress', 'Ramesh Kumar (Hardware Tech)')`,
      [asset2Id, rahulId]
    );

    // Seed Notifications
    console.log('🌱 Seeding notifications...');
    await connection.query(
      `INSERT INTO notifications (user_id, title, message, type) 
       VALUES (?, 'Overdue Alert', 'Your allocation of Keychron K2 Keyboard is 5 days overdue.', 'overdue')`,
      [johnId]
    );
    await connection.query(
      `INSERT INTO notifications (user_id, title, message, type) 
       VALUES (?, 'Transfer Request', 'Rahul Raghavan requested transfer of MacBook Pro.', 'transfer')`,
      [priyaId]
    );

    // Seed Activity Logs
    console.log('🌱 Seeding audit activity logs...');
    await connection.query(
      `INSERT INTO activity_logs (user_id, action, details) 
       VALUES (?, 'Allocation', 'MacBook Pro 16" M3 Max allocated to Priya Devi')`,
      [adminUserId]
    );
    await connection.query(
      `INSERT INTO activity_logs (user_id, action, details) 
       VALUES (?, 'Booking', 'Conference Room A1 reserved for Priya Devi')`,
      [priyaId]
    );
    await connection.query(
      `INSERT INTO activity_logs (user_id, action, details) 
       VALUES (?, 'Maintenance', 'Maintenance request created for Epson projector EB-X06')`,
      [priyaId]
    );

    // Seed 60 Laptops to demonstrate pagination
    console.log('🌱 Seeding 60 additional laptops for pagination test...');
    for (let i = 1; i <= 60; i++) {
      const tagNum = 5 + i; // AF-0006 to AF-0065
      const tag = `AF-${String(tagNum).padStart(4, '0')}`;
      const serial = `SN-QA-LAP-${1000 + i}`;
      const status = i % 5 === 0 ? 'Allocated' : 'Available';
      
      const [newAsset] = await connection.query(
        `INSERT INTO assets (name, category_id, asset_tag, serial_number, acquisition_date, acquisition_cost, condition_status, location, is_shared, status, custom_fields) 
         VALUES (?, ?, ?, ?, '2026-05-01', 1100.00, 'Good', 'Bangalore Office, Floor 3', FALSE, ?, ?)`,
        [`Enterprise Laptop Pro #${i}`, laptopsCatId, tag, serial, status, JSON.stringify({ ram: '16GB', storage: '256GB SSD', warranty_months: 12 })]
      );
      
      // If allocated, create an active allocation to Rahul or John
      if (status === 'Allocated') {
        const holderId = i % 2 === 0 ? rahulId : johnId;
        await connection.query(
          `INSERT INTO asset_allocations (asset_id, allocated_to_type, employee_id, allocated_by, allocation_date, status) 
           VALUES (?, 'employee', ?, ?, ?, 'Active')`,
          [newAsset.insertId, holderId, adminUserId, tenDaysAgo]
        );
      }
    }

    // Seed 80 Activity Logs to demonstrate pagination
    console.log('🌱 Seeding 80 activity logs for pagination test...');
    for (let i = 1; i <= 80; i++) {
      const logUser = i % 3 === 0 ? adminUserId : (i % 3 === 1 ? priyaId : rahulId);
      const action = i % 4 === 0 ? 'Allocation' : (i % 4 === 1 ? 'Booking' : (i % 4 === 2 ? 'Maintenance' : 'Audit'));
      const details = `Bulk Seeder action log #${i} - processed state for resource transaction code ${10000 + i}.`;
      await connection.query(
        `INSERT INTO activity_logs (user_id, action, details, created_at) 
         VALUES (?, ?, ?, DATE_SUB(NOW(), INTERVAL ? HOUR))`,
        [logUser, action, details, i]
      );
    }

    console.log('✔ Seeding process completed successfully.');

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
