import axios from 'axios';
import { app } from 'electron';
import fs from 'fs/promises';
import path from 'path';

class AnalyticsService {
    constructor() {
        this.client = axios.create({
            baseURL: 'https://api.8labs.com/stats',
            timeout: 5000
        });
        this.uuid = null;
        this.uuidFilePath = path.join(app.getPath('userData'), '.analytics-uuid');
    }

    async initialize() {
        await this.loadOrGenerateUUID();
        await this.registerIfNeeded();
    }

    async loadOrGenerateUUID() {
        try {
            const uuidData = await fs.readFile(this.uuidFilePath, 'utf-8');
            this.uuid = JSON.parse(uuidData).uuid;
        } catch (error) {
            // Generate new UUID if file doesn't exist or is invalid
            this.uuid = crypto.randomUUID();
            await fs.writeFile(this.uuidFilePath, JSON.stringify({ uuid: this.uuid }));
        }
    }

    async registerIfNeeded() {
        try {
            const registerFlagPath = path.join(app.getPath('userData'), '.analytics-registered');
            await fs.access(registerFlagPath);
            // Already registered
            return;
        } catch {
            // Not registered yet, proceed with registration
            try {
                await this.client.post('/register', {
                    id: this.uuid,
                    platform: process.platform,
                    app_version: app.getVersion()
                });
                // Mark as registered
                await fs.writeFile(path.join(app.getPath('userData'), '.analytics-registered'), '');
            } catch (error) {
                console.error('Failed to register analytics:', error);
            }
        }
    }

    async trackEvent(eventType, details = {}) {
        if (!this.uuid) return;

        try {
            await this.client.post('/event', {
                id: this.uuid,
                event_type: eventType,
                details: {
                    app_version: app.getVersion(),
                    ...details
                }
            });
        } catch (error) {
            console.error('Failed to track event:', error);
        }
    }

    async trackAppOpened() {
        await this.trackEvent('app_opened');
    }

    async trackTestCreated(totalTests) {
        await this.trackEvent('test_created', { total_tests: totalTests });
    }

    async trackTestsExecuted(testScenario) {
        const rowCount = testScenario.testTable.rows.length;
        await this.trackEvent('tests_executed', { row_count: rowCount });
    }
}

export default AnalyticsService; 