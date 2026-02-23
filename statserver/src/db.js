const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 5432,
});

// Initialize database with schema
async function initializeDatabase() {
    try {
        const schema = require('fs').readFileSync('./src/schema.sql', 'utf8');
        await pool.query(schema);
        console.log('Database schema initialized successfully');
    } catch (error) {
        console.error('Error initializing database schema:', error);
        throw error;
    }
}

// Register or update user
async function registerUser(userId, platform, appVersion) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Check if user exists
        const userResult = await client.query(
            'SELECT id FROM users WHERE id = $1',
            [userId]
        );

        if (userResult.rows.length === 0) {
            // Insert new user
            await client.query(
                'INSERT INTO users (id, platform, app_version) VALUES ($1, $2, $3)',
                [userId, platform, appVersion]
            );
        } else {
            // Update existing user's last_seen and app_version
            await client.query(
                'UPDATE users SET last_seen = CURRENT_TIMESTAMP, app_version = $1 WHERE id = $2',
                [appVersion, userId]
            );
        }

        await client.query('COMMIT');
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

// Record event
async function recordEvent(userId, eventType, details, appVersion) {
    try {
        await pool.query(
            'INSERT INTO events (user_id, event_type, details, app_version) VALUES ($1, $2, $3, $4)',
            [userId, eventType, details, appVersion]
        );
    } catch (error) {
        console.error('Error recording event:', error);
        throw error;
    }
}

module.exports = {
    initializeDatabase,
    registerUser,
    recordEvent,
    pool
}; 