const express = require('express');
const router = express.Router();
const db = require('../db');

// Helper: Convert snake_case to camelCase
const toCamel = (o) => {
    if (Array.isArray(o)) {
        return o.map(i => toCamel(i));
    }
    if (o !== null && typeof o === 'object') {
        const n = {};
        Object.keys(o).forEach(k => {
            const ck = k.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
            n[ck] = toCamel(o[k]);
        });
        return n;
    }
    return o;
}

// --- TEAMS ---
router.get('/teams', (req, res) => {
    db.query('SELECT team_id as id, team_name as name, "General" as specialty FROM maintenance_teams', (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(toCamel(results));
    });
});

router.post('/teams', (req, res) => {
    const { name } = req.body;
    const sql = 'INSERT INTO maintenance_teams (team_name) VALUES (?)';
    db.query(sql, [name], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ id: result.insertId, name });
    });
});

router.put('/teams/:id', (req, res) => {
    const { name } = req.body;
    const sql = 'UPDATE maintenance_teams SET team_name = ? WHERE team_id = ?';
    db.query(sql, [name, req.params.id], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ success: true });
    });
});

router.delete('/teams/:id', (req, res) => {
    // Ideally check for dependencies (members, categories, requests) before deleting
    // For now, we assume cascade or manual cleanup, but let's be safe and just try delete
    db.query('DELETE FROM maintenance_teams WHERE team_id = ?', [req.params.id], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ success: true });
    });
});

// Add member to team (User <-> Team)
// This assumes 'maintenance_team_members' table exists (team_id, user_id)
router.post('/teams/:id/members', (req, res) => {
    const { userId } = req.body;
    const sql = 'INSERT INTO maintenance_team_members (team_id, user_id) VALUES (?, ?)';
    db.query(sql, [req.params.id, userId], (err, result) => {
        if (err) {
            // ignore duplicate entry error slightly gracefully or return error
            if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'User already in team' });
            return res.status(500).json(err);
        }
        res.json({ success: true });
    });
});

// Remove member from team
router.delete('/teams/:id/members/:userId', (req, res) => {
    const sql = 'DELETE FROM maintenance_team_members WHERE team_id = ? AND user_id = ?';
    db.query(sql, [req.params.id, req.params.userId], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ success: true });
    });
});

router.get('/team-members', (req, res) => {
    db.query('SELECT team_id as teamId, user_id as userId FROM maintenance_team_members', (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(toCamel(results));
    });
});

// --- USERS ---
router.get('/users', (req, res) => {
    // Join with teams if needed, but for now simple select
    const sql = `
        SELECT u.user_id as id, u.full_name as name, u.avatar_url as avatar, u.role, 
        (SELECT team_id FROM maintenance_team_members WHERE user_id = u.user_id LIMIT 1) as teamId 
        FROM users u
    `;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(toCamel(results));
    });
});

router.put('/users/:id', (req, res) => {
    const { name, role, email } = req.body;
    let sql = 'UPDATE users SET full_name = ?, role = ?';
    const params = [name, role];
    if (email) {
        sql += ', email = ?';
        params.push(email);
    }
    sql += ' WHERE user_id = ?';
    params.push(req.params.id);

    db.query(sql, params, (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ success: true });
    });
});

router.delete('/users/:id', (req, res) => {
    db.query('DELETE FROM users WHERE user_id = ?', [req.params.id], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ success: true });
    });
});

// --- EQUIPMENT ---
router.get('/equipment', (req, res) => {
    const sql = `
        SELECT e.equipment_id as id, e.equipment_name as name, e.serial_number, 
        d.department_name as department, l.location_name as location, 
        e.purchase_date, e.warranty_end_date as warrantyEnd,
        ec.default_team_id as teamId, e.assigned_employee_id as technicianId,
        e.status
        FROM equipment e
        LEFT JOIN departments d ON e.department_id = d.department_id
        LEFT JOIN equipment_locations l ON e.location_id = l.location_id
        LEFT JOIN equipment_categories ec ON e.equipment_category_id = ec.equipment_category_id
    `;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(toCamel(results));
    });
});

// --- REQUESTS ---
router.get('/requests', (req, res) => {
    const sql = `
        SELECT r.request_id as id, r.subject, r.description, r.request_type as type,
        r.status, r.priority, r.created_at as createdDate, r.scheduled_date, 
        r.duration_hours, r.equipment_id, r.maintenance_team_id as teamId, 
        r.assigned_technician_id as technicianId, r.requester_id as requesterId,
        e.equipment_name as equipmentName,
        u_tech.full_name as technicianName,
        u_req.full_name as requesterName,
        t.team_name as teamName
        FROM maintenance_requests r
        LEFT JOIN equipment e ON r.equipment_id = e.equipment_id
        LEFT JOIN users u_tech ON r.assigned_technician_id = u_tech.user_id
        LEFT JOIN users u_req ON r.requester_id = u_req.user_id
        LEFT JOIN maintenance_teams t ON r.maintenance_team_id = t.team_id
    `;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json(err);
        const camelResults = toCamel(results);
        // Add computed 'isOverdue' logic if needed
        const now = new Date();
        const final = camelResults.map(r => ({
            ...r,
            isOverdue: r.status !== 'Repaired' && r.status !== 'Scrap' && r.scheduledDate && new Date(r.scheduledDate) < now
        }));
        res.json(final);
    });
});

router.post('/requests', (req, res) => {
    const { subject, description, type, priority, equipmentId, teamId, technicianId, scheduledDate, requesterId } = req.body;
    const sql = `
        INSERT INTO maintenance_requests 
        (request_number, subject, description, request_type, priority, equipment_id, maintenance_team_id, assigned_technician_id, scheduled_date, status, requester_id)
        VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, 'New', ?) 
    `;

    db.query(sql, [subject, description, type, priority, equipmentId, teamId, technicianId, scheduledDate, requesterId || 1], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json(err);
        }
        res.json({ id: result.insertId, ...req.body, status: 'New' });
    });
});

router.post('/requests/batch', (req, res) => {
    const requests = req.body; // Array of request objects
    if (!Array.isArray(requests) || requests.length === 0) {
        return res.status(400).json({ error: 'Invalid batch data' });
    }

    // Build values array for bulk insert
    // UUID() is server-side, so we can't easily get IDs back in one go with simple INSERT.
    // For simplicity and reliability, we'll process them in a transaction or just loop promises.
    // Since it's low volume (12 requests), a loop of inserts is fine and safer for generating UUIDs.

    const insertPromises = requests.map(reqData => {
        return new Promise((resolve, reject) => {
            const { subject, description, type, priority, equipmentId, teamId, technicianId, scheduledDate, requesterId } = reqData;
            const sql = `
                INSERT INTO maintenance_requests 
                (request_number, subject, description, request_type, priority, equipment_id, maintenance_team_id, assigned_technician_id, scheduled_date, status, requester_id)
                VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, 'New', ?)
            `;
            db.query(sql, [
                subject,
                description,
                type,
                priority,
                equipmentId,
                teamId,
                technicianId,
                scheduledDate,
                requesterId || 1
            ], (err, result) => {
                if (err) return reject(err);
                resolve({ id: result.insertId, ...reqData, status: 'New' });
            });
        });
    });

    Promise.all(insertPromises)
        .then(results => res.json(results))
        .catch(err => {
            console.error(err);
            res.status(500).json(err);
        });
});

router.put('/requests/:id', (req, res) => {
    const { status, durationHours, assignedTechnicianId, technicianId } = req.body;

    // First, get the request to find equipment_id
    db.query('SELECT equipment_id FROM maintenance_requests WHERE request_id = ?', [req.params.id], (err, rows) => {
        if (err) return res.status(500).json(err);

        const equipmentId = rows[0]?.equipment_id;

        // Update the request
        const updateFields = [];
        const updateValues = [];

        if (status) {
            updateFields.push('status = ?');
            updateValues.push(status);
        }
        if (durationHours !== undefined) {
            updateFields.push('duration_hours = ?');
            updateValues.push(durationHours);
        }

        // Handle technician assignment (support both parameter names)
        const targetTechId = technicianId !== undefined ? technicianId : assignedTechnicianId;
        if (targetTechId !== undefined) {
            updateFields.push('assigned_technician_id = ?');
            updateValues.push(targetTechId);
        }

        updateValues.push(req.params.id);

        const sql = `UPDATE maintenance_requests SET ${updateFields.join(', ')} WHERE request_id = ?`;

        db.query(sql, updateValues, (err, result) => {
            if (err) return res.status(500).json(err);

            // If status is Scrap, update equipment status
            if (status === 'Scrap' && equipmentId) {
                db.query('UPDATE equipment SET status = ? WHERE equipment_id = ?', ['Scrapped', equipmentId], (err2) => {
                    if (err2) console.error('Failed to update equipment status:', err2);
                });
            }

            // If status is Repaired, update equipment status to Operational
            if (status === 'Repaired' && equipmentId) {
                db.query('UPDATE equipment SET status = ? WHERE equipment_id = ?', ['Operational', equipmentId], (err2) => {
                    if (err2) console.error('Failed to update equipment status:', err2);
                });
            }

            res.json({ success: true });
        });
    });
});

// --- DEPARTMENTS ---
router.get('/departments', (req, res) => {
    db.query('SELECT department_id as id, department_name as name FROM departments', (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(toCamel(results));
    });
});

// --- EQUIPMENT CATEGORIES ---
router.get('/equipment-categories', (req, res) => {
    const sql = `
        SELECT ec.equipment_category_id as id, ec.category_name as name, 
        ec.default_team_id as defaultTeamId, mt.team_name as defaultTeamName
        FROM equipment_categories ec
        LEFT JOIN maintenance_teams mt ON ec.default_team_id = mt.team_id
    `;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(toCamel(results));
    });
});

router.post('/equipment-categories', (req, res) => {
    const { name, defaultTeamId } = req.body;
    const sql = 'INSERT INTO equipment_categories (category_name, default_team_id) VALUES (?, ?)';
    db.query(sql, [name, defaultTeamId], (err, result) => {
        if (err) {
            console.error('Error creating category:', err);
            return res.status(500).json(err);
        }
        res.json({ id: result.insertId, name, defaultTeamId });
    });
});

// --- EQUIPMENT LOCATIONS ---
router.get('/equipment-locations', (req, res) => {
    db.query('SELECT location_id as id, location_name as name FROM equipment_locations', (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(toCamel(results));
    });
});

// --- CREATE EQUIPMENT ---
router.post('/equipment', (req, res) => {
    const {
        equipmentName,
        serialNumber,
        equipmentCategoryId,
        departmentId,
        assignedEmployeeId,
        purchaseDate,
        warrantyStartDate,
        warrantyEndDate,
        locationId,
        status
    } = req.body;

    const sql = `
        INSERT INTO equipment 
        (equipment_name, serial_number, equipment_category_id, department_id, 
         assigned_employee_id, purchase_date, warranty_start_date, warranty_end_date, 
         location_id, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(sql, [
        equipmentName,
        serialNumber,
        equipmentCategoryId,
        departmentId,
        assignedEmployeeId || null,
        purchaseDate || null,
        warrantyStartDate || null,
        warrantyEndDate || null,
        locationId || null,
        status || 'Operational'
    ], (err, result) => {
        if (err) {
            console.error('Error creating equipment:', err);
            return res.status(500).json({ error: err.message });
        }
        res.json({
            success: true,
            id: result.insertId,
            message: 'Equipment created successfully'
        });
    });
});

module.exports = router;
