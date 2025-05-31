import fs from 'fs/promises';
import path from 'path';
import { app } from 'electron';

class TestHistoryService {
    constructor() {
        this.historyDir = app.getPath('userData') + '/test-history';
    }

    async initialize() {
        try {
            await fs.mkdir(this.historyDir, { recursive: true });
        } catch (error) {
            console.error('Error creating test history directory:', error);
        }
    }

    async saveTestHistory(historyEntry) {
        try {
            const fileName = `${historyEntry.id}_${new Date().getTime()}.json`;
            const filePath = path.join(this.historyDir, fileName);

            await fs.writeFile(filePath, JSON.stringify(historyEntry, null, 2));
            return true;
        } catch (error) {
            console.error('Error saving test history:', error);
            throw error;
        }
    }

    async getTestHistory(scenarioId) {
        try {
            const files = await fs.readdir(this.historyDir);
            const historyFiles = files.filter(file => file.startsWith(`${scenarioId}_`));

            const history = await Promise.all(
                historyFiles.map(async file => {
                    const content = await fs.readFile(path.join(this.historyDir, file), 'utf-8');
                    return JSON.parse(content);
                })
            );

            return history.sort((a, b) => new Date(b.date) - new Date(a.date));
        } catch (error) {
            console.error('Error getting test history:', error);
            return [];
        }
    }

    async getAllTestHistory() {
        try {
            const files = await fs.readdir(this.historyDir);

            const history = await Promise.all(
                files.map(async file => {
                    const content = await fs.readFile(path.join(this.historyDir, file), 'utf-8');
                    return JSON.parse(content);
                })
            );

            return history.sort((a, b) => new Date(b.date) - new Date(a.date));
        } catch (error) {
            console.error('Error getting all test history:', error);
            return [];
        }
    }

    async getFailureCount(scenarioId) {
        try {
            const history = await this.getTestHistory(scenarioId);
            if (history && history.length > 0) {
                return history[0].failureCount;
            }
            return 0;
        } catch (error) {
            console.error('Error getting failure count:', error);
            return 0;
        }
    }
}

export default TestHistoryService; 