const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function setupDatabase() {
    try {
        // 1. Connect to MySQL Server (no DB selected yet)
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            port: process.env.DB_PORT
        });

        console.log('Connected to MySQL server.');

        // 2. Create Database
        await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}`);
        console.log(`Database '${process.env.DB_NAME}' created or already exists.`);

        await connection.query(`USE ${process.env.DB_NAME}`);

        // 3. Read and Apply Schema
        // Note: The schema file is at d:\Projects\Odoo X Adani\Schema.txt
        // We will try to read it from there.
        const schemaPath = path.resolve(__dirname, '../../Schema.txt');

        if (fs.existsSync(schemaPath)) {
            let schemaSql = fs.readFileSync(schemaPath, 'utf8');

            // Remove 'use defaultdb;' if present to avoid switching context wrong
            schemaSql = schemaSql.replace(/use defaultdb;/gi, '');

            // Split by semicolon? No, mysql2 supports multipleStatements if enabled.
            // But we didn't enable it for this specific connection.
            // It's safer to split or use a connection with multipleStatements.
        } else {
            console.log('Schema.txt not found at ' + schemaPath);
            // Return or try another path?
            return;
        }

        // Re-connect with multipleStatements enabled to run the script
        await connection.end();

        const db = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: process.env.DB_PORT,
            multipleStatements: true
        });

        const schemaSql = fs.readFileSync(schemaPath, 'utf8').replace(/use defaultdb;/gi, '');
        await db.query(schemaSql);
        console.log('Schema applied successfully.');

        await db.end();
        console.log('Setup complete.');
        process.exit(0);

    } catch (err) {
        console.error('Database setup failed:', err);
        process.exit(1);
    }
}

setupDatabase();
