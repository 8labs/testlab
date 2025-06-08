const express = require('express');
const cors = require('cors');
const { initializeDatabase, registerUser, recordEvent } = require('./db');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database on startup
initializeDatabase().catch(console.error);

// Register endpoint
app.post('/stats/register', async (req, res) => {
    try {
        const { id, platform, app_version } = req.body;

        if (!id || !platform || !app_version) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        await registerUser(id, platform, app_version);
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Error in register endpoint:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Event endpoint
app.post('/stats/event', async (req, res) => {
    try {
        const { id, event_type, details } = req.body;

        if (!id || !event_type || !details) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Extract app_version from details
        const app_version = details.app_version;
        if (!app_version) {
            return res.status(400).json({ error: 'Missing app_version in details' });
        }

        // Update user's last_seen timestamp
        await registerUser(id, null, app_version);

        // Record the event
        await recordEvent(id, event_type, details, app_version);
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Error in event endpoint:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.listen(port, () => {
    console.log(`Stats server listening on port ${port}`);
}); 