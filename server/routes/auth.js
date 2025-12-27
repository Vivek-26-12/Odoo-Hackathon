const express = require('express');
const router = express.Router();
const db = require('../db');

// Helper to convert snake_case to camelCase
const toCamel = (obj) => {
    if (Array.isArray(obj)) return obj.map(toCamel);
    if (obj !== null && obj.constructor === Object) {
        return Object.keys(obj).reduce((acc, key) => {
            const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
            acc[camelKey] = toCamel(obj[key]);
            return acc;
        }, {});
    }
    return obj;
};

// Login
router.post('/login', (req, res) => {
    const { email, password } = req.body;

    // In a real app, use bcrypt to compare hashed passwords
    const sql = 'SELECT user_id, full_name, email, role, avatar_url FROM users WHERE email = ? AND password = ?';

    db.query(sql, [email, password], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });

        if (results.length > 0) {
            const user = toCamel(results[0]);
            // Map user_id to id and full_name to name for consistency
            user.id = user.userId;
            user.name = user.fullName;
            delete user.userId;
            delete user.fullName;
            res.json({ success: true, user });
        } else {
            res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
    });
});

// Signup
router.post('/signup', (req, res) => {
    const { fullName, email, password, role } = req.body;

    // Check if user exists
    db.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length > 0) {
            return res.status(400).json({ success: false, message: 'User already exists' });
        }

        // Insert new user
        // Default avatar for now
        const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=random`;

        const sql = 'INSERT INTO users (full_name, email, password, role, avatar_url) VALUES (?, ?, ?, ?, ?)';
        db.query(sql, [fullName, email, password, role || 'Employee', avatar], (err, result) => {
            if (err) return res.status(500).json({ error: err.message });

            const newUser = {
                id: result.insertId,
                name: fullName,
                email,
                role: role || 'Employee',
                avatarUrl: avatar
            };
            res.json({ success: true, user: newUser });
        });
    });
});

module.exports = router;
