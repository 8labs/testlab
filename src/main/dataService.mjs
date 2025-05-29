import fs from 'fs/promises';
import path from 'path';
import { app } from 'electron';

class DataService {
    constructor() {
        this.dataDir = app.getPath('userData') + '/' + 'test-scenarios';
        this.firstRunFlagFile = app.getPath('userData') + '/' + '.first-run-flag';
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
            const demoScenario = {
                "name": "Demo Scenario",
                "endpoint": "https://files.8labs.com/test.php?static_param=staticvalue&dynamic_param={{dynamicValue}}",
                "method": "POST",
                "testTable": {
                    "inputColumns": [
                        {
                            "key": "dynamic_query_value",
                            "label": "Dynamic Query Value",
                            "expression": "dynamicValue",
                            "editVisible": false
                        },
                        {
                            "label": "Multiplier",
                            "expression": "$.math_variables.multiplier",
                            "editVisible": false,
                            "key": "multiplier"
                        },
                        {
                            "label": "Name",
                            "expression": "$.name",
                            "editVisible": false,
                            "key": "name"
                        },
                        {
                            "label": "Age",
                            "expression": "$.age",
                            "editVisible": false,
                            "key": "age"
                        }
                    ],
                    "resultColumns": [
                        {
                            "key": "multiplied",
                            "label": "Multiplied",
                            "expression": "$.math.multiplied",
                            "editVisible": false
                        },
                        {
                            "label": "Name",
                            "expression": "$.person.name",
                            "editVisible": false,
                            "key": "name"
                        },
                        {
                            "label": "Status Code",
                            "expression": "{{http_status}}",
                            "editVisible": false,
                            "key": "status_code"
                        }
                    ],
                    "rows": [
                        {
                            "inputItems": [
                                {
                                    "value": "value1"
                                },
                                {
                                    "value": "10"
                                },
                                {
                                    "value": "John"
                                },
                                {
                                    "value": "30"
                                }
                            ],
                            "resultItems": [
                                {
                                    "value": "100",
                                    "operator": "="
                                },
                                {
                                    "value": "John",
                                    "operator": "="
                                },
                                {
                                    "value": "200",
                                    "operator": "="
                                }
                            ]
                        },
                        {
                            "inputItems": [
                                {
                                    "value": "value2"
                                },
                                {
                                    "value": "20"
                                },
                                {
                                    "value": "John"
                                },
                                {
                                    "value": "30"
                                }
                            ],
                            "resultItems": [
                                {
                                    "value": "200",
                                    "operator": "="
                                },
                                {
                                    "value": "John",
                                    "operator": "="
                                },
                                {
                                    "value": "404",
                                    "operator": "!="
                                }
                            ]
                        },
                        {
                            "inputItems": [
                                {
                                    "value": "value3"
                                },
                                {
                                    "value": "-20"
                                },
                                {
                                    "value": "John"
                                },
                                {
                                    "value": "30"
                                }
                            ],
                            "resultItems": [
                                {
                                    "value": "0",
                                    "operator": "<"
                                },
                                {
                                    "value": "John",
                                    "operator": "="
                                },
                                {
                                    "value": "200",
                                    "operator": "="
                                }
                            ]
                        }, {
                            "inputItems": [
                                {
                                    "value": "value3"
                                },
                                {
                                    "value": "2"
                                },
                                {
                                    "value": "John"
                                },
                                {
                                    "value": "30"
                                }
                            ],
                            "resultItems": [
                                {
                                    "value": "2000",
                                    "operator": "="
                                },
                                {
                                    "value": "John",
                                    "operator": "="
                                },
                                {
                                    "value": "200",
                                    "operator": "="
                                }
                            ]
                        }
                    ],
                    "authentication": {
                        "type": "Basic",
                        "username": "AUsername",
                        "password": "aPassword!"
                    },
                    "headers": [
                        {
                            "key": "static_header",
                            "value": "static_value1"
                        },
                        {
                            "key": "dynamic_header",
                            "value": "{{dynamicValue}}"
                        }
                    ]
                },
                "id": "9b0c23eb-33ff-4e50-9f3e-59c65eee580a"
            };

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

    async getTestScenario(id) {
        try {
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