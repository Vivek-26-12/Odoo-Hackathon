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
        r.duration_hours, r.equipment_id, r.maintenance_team_id as teamId, r.assigned_technician_id as technicianId
        FROM maintenance_requests r
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

router.put('/requests/:id', (req, res) => {
    const { status, durationHours } = req.body;
    const sql = 'UPDATE maintenance_requests SET status = ?, duration_hours = ? WHERE request_id = ?';
    db.query(sql, [status, durationHours || 0, req.params.id], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ success: true });
    });
});

module.exports = router;
