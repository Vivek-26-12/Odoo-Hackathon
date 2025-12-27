const express = require('express');
const router = express.Router();
const db = require('../db');

// Login
router.post('/login', (req, res) => {
    const { email, password } = req.body;

    // In a real app, use bcrypt to compare hashed passwords
    const sql = 'SELECT * FROM users WHERE email = ? AND password = ?';

    db.query(sql, [email, password], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });

        if (results.length > 0) {
            const user = results[0];
            // Remove password from response
            delete user.password;
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
        db.query(sql, [fullName, email, password, role || 'Technician', avatar], (err, result) => {
            if (err) return res.status(500).json({ error: err.message });

            const newUser = {
                id: result.insertId,
                name: fullName,
                email,
                role: role || 'Technician',
                avatar
            };
            res.json({ success: true, user: newUser });
        });
    });
});

module.exports = router;
