const mysql = require('mysql2/promise');
require('dotenv').config();

const TEAMS = [
    { name: 'Mechanics', specialty: 'Mechanical' },
    { name: 'Electricians', specialty: 'Electrical' },
    { name: 'IT Support', specialty: 'Computer/Network' },
    { name: 'Facility Mgmt', specialty: 'General' },
];

const DEPARTMENTS = ['Production', 'Admin', 'Logistics', 'IT', 'Facility'];
const LOCATIONS = ['Floor 1, Zone A', 'Office Block B', 'Floor 1, Zone B', 'Warehouse A', 'Server Room', 'Cafeteria', 'Warehouse B'];
const CATEGORIES = ['CNC', 'Printer', 'Heavy Machinery', 'Conveyor', 'Server', 'Appliance', 'Vehicle'];

const USERS = [
    { name: 'John Doe', email: 'john@example.com', role: 'Technician', teamIdx: 0, avatar: 'https://i.pravatar.cc/150?u=u1' },
    { name: 'Jane Smith', email: 'jane@example.com', role: 'Manager', teamIdx: 1, avatar: 'https://i.pravatar.cc/150?u=u2' },
    { name: 'Mike Ross', email: 'mike@example.com', role: 'Technician', teamIdx: 2, avatar: 'https://i.pravatar.cc/150?u=u3' },
    { name: 'Sarah Connor', email: 'sarah@example.com', role: 'Technician', teamIdx: 0, avatar: 'https://i.pravatar.cc/150?u=u4' },
    { name: 'David Lee', email: 'david@example.com', role: 'Technician', teamIdx: 3, avatar: 'https://i.pravatar.cc/150?u=u5' },
];

const EQUIPMENT = [
    { name: 'CNC Machine X1', serial: 'CNC-2023-001', dept: 'Production', loc: 'Floor 1, Zone A', cat: 'CNC', teamIdx: 0, techIdx: 0, status: 'Operational', buy: '2023-01-15' },
    { name: 'Office Printer Pro', serial: 'PRT-9988', dept: 'Admin', loc: 'Office Block B', cat: 'Printer', teamIdx: 2, techIdx: 2, status: 'Operational', buy: '2022-05-10' },
    { name: 'Hydraulic Press', serial: 'HP-5000', dept: 'Production', loc: 'Floor 1, Zone B', cat: 'Heavy Machinery', teamIdx: 0, techIdx: 0, status: 'Down', buy: '2020-11-20' },
    { name: 'Conveyor Belt 04', serial: 'CV-2021-44', dept: 'Logistics', loc: 'Warehouse A', cat: 'Conveyor', teamIdx: 0, techIdx: 3, status: 'Operational', buy: '2021-03-01' },
    { name: 'Main Server Rack', serial: 'SRV-001', dept: 'IT', loc: 'Server Room', cat: 'Server', teamIdx: 2, techIdx: 2, status: 'Maintenance', buy: '2024-01-01' },
    { name: 'Pantry Coffee Machine', serial: 'CM-Brew-200', dept: 'Facility', loc: 'Cafeteria', cat: 'Appliance', teamIdx: 3, techIdx: 4, status: 'Operational', buy: '2024-06-15' },
];

async function seed() {
    const conn = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT
    });

    console.log('Connected to DB for seeding...');

    try {
        // 1. Teams
        const teamIds = [];
        for (const t of TEAMS) {
            const [res] = await conn.execute('INSERT INTO maintenance_teams (team_name) VALUES (?) ON DUPLICATE KEY UPDATE team_name=team_name', [t.name]);
            // If inserted, use insertId. If exists, we need to fetch.
            const [rows] = await conn.execute('SELECT team_id FROM maintenance_teams WHERE team_name = ?', [t.name]);
            teamIds.push(rows[0].team_id);
        }
        console.log('Teams seeded.');

        // 2. Departments
        const deptIds = {};
        for (const d of DEPARTMENTS) {
            await conn.execute('INSERT INTO departments (department_name) VALUES (?) ON DUPLICATE KEY UPDATE department_name=department_name', [d]);
            const [rows] = await conn.execute('SELECT department_id FROM departments WHERE department_name = ?', [d]);
            deptIds[d] = rows[0].department_id;
        }
        console.log('Departments seeded.');

        // 3. Locations
        const locIds = {};
        for (const l of LOCATIONS) {
            await conn.execute('INSERT INTO equipment_locations (location_name) VALUES (?) ON DUPLICATE KEY UPDATE location_name=location_name', [l]);
            const [rows] = await conn.execute('SELECT location_id FROM equipment_locations WHERE location_name = ?', [l]);
            locIds[l] = rows[0].location_id;
        }
        console.log('Locations seeded.');

        // 4. Categories
        const catIds = {};
        for (let i = 0; i < CATEGORIES.length; i++) {
            const c = CATEGORIES[i];
            // Default team logic: just round robin or correct map?
            // Mapping based on equipment list...
            // Just assign random default team for now
            const defaultTeamId = teamIds[i % teamIds.length] || teamIds[0];

            await conn.execute('INSERT INTO equipment_categories (category_name, default_team_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE category_name=category_name', [c, defaultTeamId]);
            const [rows] = await conn.execute('SELECT equipment_category_id FROM equipment_categories WHERE category_name = ?', [c]);
            catIds[c] = rows[0].equipment_category_id;
        }
        console.log('Categories seeded.');

        // 5. Users
        const userIds = [];
        for (const u of USERS) {
            await conn.execute('INSERT INTO users (full_name, email, password, role, avatar_url) VALUES (?, ?, "pass123", ?, ?)', [u.name, u.email, u.role, u.avatar]);
            const [rows] = await conn.execute('SELECT user_id FROM users WHERE email = ?', [u.email]);
            const uid = rows[0].user_id;
            userIds.push(uid);

            // Assign to team
            const tid = teamIds[u.teamIdx];
            if (tid) {
                await conn.execute('INSERT IGNORE INTO maintenance_team_members (team_id, user_id) VALUES (?, ?)', [tid, uid]);
            }
        }
        console.log('Users seeded.');

        // 6. Equipment
        const eqIds = [];
        for (const e of EQUIPMENT) {
            await conn.execute(`
                INSERT INTO equipment 
                (equipment_name, serial_number, equipment_category_id, department_id, location_id, assigned_employee_id, status, purchase_date)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                e.name,
                e.serial,
                catIds[e.cat],
                deptIds[e.dept],
                locIds[e.loc],
                userIds[e.techIdx],
                e.status,
                e.buy
            ]);
            const [rows] = await conn.execute('SELECT equipment_id FROM equipment WHERE serial_number = ?', [e.serial]);
            eqIds.push(rows[0].equipment_id);
        }
        console.log('Equipment seeded.');

        // 7. Requests (Sample)
        // Request 1: Leaking Oil (Equipment 2 - Hydraulic Press)
        await conn.execute(`
            INSERT INTO maintenance_requests 
            (request_number, subject, description, request_type, equipment_id, maintenance_team_id, requester_id, assigned_technician_id, status, priority, duration_hours)
            VALUES (UUID(), 'Leaking Oil', 'Oil leaking from seal', 'Corrective', ?, ?, ?, ?, 'In Progress', 'High', 2.0)
        `, [eqIds[2], teamIds[0], userIds[0], userIds[0]]);

        // Request 2: Monthly Checkup (Equipment 0 - CNC)
        await conn.execute(`
            INSERT INTO maintenance_requests 
            (request_number, subject, description, request_type, equipment_id, maintenance_team_id, requester_id, assigned_technician_id, status, priority, scheduled_date)
            VALUES (UUID(), 'Monthly Checkup', 'Routine check', 'Preventive', ?, ?, ?, NULL, 'New', 'Medium', DATE_ADD(NOW(), INTERVAL 2 DAY))
        `, [eqIds[0], teamIds[0], userIds[1]]);

        console.log('Requests seeded.');

    } catch (err) {
        console.error('Seeding failed:', err);
    } finally {
        await conn.end();
        process.exit();
    }
}

seed();
