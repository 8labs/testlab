import fs from 'fs/promises';
import path from 'path';
import { app } from 'electron';

class DataService {
    constructor() {
        this.dataDir = app.getPath('userData') + '/' + 'test-scenarios';
        this.firstRunFlagFile = app.getPath('userData') + '/' + '.first-run-flag';

        this.resourcePath = process.env.NODE_ENV === 'development'
            ? path.join(__dirname, '../../resources')
            : process.resourcesPath;
        this.demoScenarioPath = path.join(this.resourcePath, 'demoscenario.json');
        this.newScenarioPath = path.join(this.resourcePath, 'newscenario.json');
    }

    async initialize() {
        try {
            await fs.mkdir(this.dataDir, { recursive: true });
        } catch (error) {
            console.error('Error creating data directory:', error);
        }
    }

    async isFirstRun() {
        try {
            await fs.access(this.firstRunFlagFile);
            return false;
        } catch {
            return true;
        }
    }

    async markFirstRunComplete() {
        try {
            await fs.writeFile(this.firstRunFlagFile, '');
        } catch (error) {
            console.error('Error marking first run complete:', error);
        }
    }

    async insertDemoScenario() {
        try {
            // Read the demo scenario from the resources
            const demoContent = await fs.readFile(this.demoScenarioPath, 'utf-8');
            const demoScenario = JSON.parse(demoContent);

            // Ensure the demo scenario has a unique ID
            demoScenario.id = crypto.randomUUID();

            const filePath = this.dataDir + '/' + `${demoScenario.id}.json`;
            await fs.writeFile(filePath, JSON.stringify(demoScenario, null, 2));
            return demoScenario;
        } catch (error) {
            console.error('Error inserting demo scenario:', error);
            return null;
        }
    }

    async getAllTestScenarios() {
        try {
            const files = await fs.readdir(this.dataDir);
            const scenarios = [];

            for (const file of files) {
                if (file.endsWith('.json')) {
                    const content = await fs.readFile(this.dataDir + '/' + file, 'utf-8');
                    scenarios.push(JSON.parse(content));
                }
            }

            // If this is the first run and there are no scenarios, insert the demo
            if (await this.isFirstRun() && scenarios.length === 0) {
                const demoScenario = await this.insertDemoScenario();
                if (demoScenario) {
                    scenarios.push(demoScenario);
                    await this.markFirstRunComplete();
                }
            }

            return scenarios;
        } catch (error) {
            console.error('Error reading test scenarios:', error);
            return [];
        }
    }

    async createNewTestScenario() {
        const newContent = await fs.readFile(this.newScenarioPath, 'utf-8');
        const newScenario = JSON.parse(newContent);
        newScenario.name = "New Test Scenario " + new Date().toISOString();
        const scenario = await this.saveTestScenario(newScenario);
        return scenario;
    }

    async getTestScenario(id) {
        try {
            // If id is null, return a new scenario template
            if (id === null) {
                const newContent = await fs.readFile(this.newScenarioPath, 'utf-8');
                const newScenario = JSON.parse(newContent);
                newScenario.name = "New Test Scenario " + new Date().toISOString();
                return newScenario;
            }

            const filePath = this.dataDir + '/' + `${id}.json`;
            const content = await fs.readFile(filePath, 'utf-8');
            return JSON.parse(content);
        } catch (error) {
            console.error('Error reading test scenario:', error);
            return null;
        }
    }

    async saveTestScenario(scenario) {
        try {
            // Generate ID if new scenario
            if (!scenario.id) {
                scenario.id = crypto.randomUUID();
            }

            const filePath = this.dataDir + '/' + `${scenario.id}.json`;
            await fs.writeFile(filePath, JSON.stringify(scenario, null, 2));
            return scenario;
        } catch (error) {
            console.error('Error saving test scenario:', error);
            throw error;
        }
    }

    async deleteTestScenario(id) {
        try {
            const filePath = this.dataDir + '/' + `${id}.json`;
            await fs.unlink(filePath);
            return true;
        } catch (error) {
            console.error('Error deleting test scenario:', error);
            return false;
        }
    }

    async updateTestScenarioMetadata(id, metadata) {
        try {
            const scenario = await this.getTestScenario(id);
            if (!scenario) {
                throw new Error('Test scenario not found');
            }

            Object.assign(scenario, metadata);
            await this.saveTestScenario(scenario);
            return scenario;
        } catch (error) {
            console.error('Error updating test scenario metadata:', error);
            throw error;
        }
    }
}

export default DataService; 