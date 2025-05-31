import axios from 'axios';
import TestHistoryService from './testHistoryService.mjs';

class TestExecutor {
    constructor() {
        this.client = axios.create({
            validateStatus: function (status) {
                return true; // Accept all status codes
            }
        });
        this.testHistoryService = new TestHistoryService();
    }

    async executeTest(scenario, row) {
        try {
            // Create a map of input values
            const inputMap = scenario.testTable.inputColumns.reduce((acc, col, index) => {
                acc[col.expression] = row.inputItems[index].value;
                return acc;
            }, {});

            // Prepare the endpoint URL
            let endpoint = scenario.endpoint;
            Object.entries(inputMap)
                .filter(([key]) => !key.startsWith('$'))
                .forEach(([key, value]) => {
                    endpoint = endpoint.replace(`{{${key}}}`, value);
                });

            // Prepare headers
            const headers = {};
            scenario.testTable.headers.forEach(header => {
                let value = header.value;
                Object.entries(inputMap)
                    .filter(([key]) => !key.startsWith('$'))
                    .forEach(([key, val]) => {
                        value = value.replace(`{{${key}}}`, val);
                    });

                if (header.key) {
                    headers[header.key] = value;
                }
            });

            // Handle authentication
            if (scenario.testTable.authentication) {
                const auth = scenario.testTable.authentication;
                let username = auth.username;
                let password = auth.password;
                let token = auth.token;

                // Replace handlebars in authentication values
                Object.entries(inputMap)
                    .filter(([key]) => !key.startsWith('$'))
                    .forEach(([key, value]) => {
                        if (username) username = username.replace(`{{${key}}}`, value);
                        if (password) password = password.replace(`{{${key}}}`, value);
                        if (token) token = token.replace(`{{${key}}}`, value);
                    });
                if (auth && auth.type) {
                    switch (auth.type.toLowerCase()) {
                        case 'basic':
                            if (!username || !password) {
                                throw new Error('Basic authentication requires both username and password');
                            }
                            const authToken = Buffer.from(`${username}:${password}`).toString('base64');
                            headers['Authorization'] = `Basic ${authToken}`;
                            break;

                        case 'token':
                            if (!token) {
                                throw new Error('Token authentication requires a token');
                            }
                            headers['Authorization'] = `Bearer ${token}`;
                            break;

                        default:
                            throw new Error(`Unsupported authentication type: ${auth.type}`);
                    }
                }
            }

            // Prepare request body
            const bodyMap = {};
            scenario.testTable.inputColumns.forEach((col, index) => {
                if (col.expression.startsWith('$.')) {
                    const path = col.expression.substring(2).split('.');
                    let current = bodyMap;

                    // Traverse the path and create nested objects
                    for (let i = 0; i < path.length; i++) {
                        const key = path[i];
                        if (i === path.length - 1) {
                            // Last part of the path, set the value
                            current[key] = row.inputItems[index].value;
                        } else {
                            // Create nested object if it doesn't exist
                            current[key] = current[key] || {};
                            current = current[key];
                        }
                    }
                }
            });

            // Set up request config
            const config = {
                method: scenario.method,
                url: endpoint,
                headers,
                data: Object.keys(bodyMap).length > 0 ? bodyMap : undefined
            };

            // Send request
            const response = await this.client(config);
            const httpStatus = response.status;

            // Try to parse response as JSON, fall back to text if not JSON
            let responseJson;
            try {
                responseJson = response.data;
                // If it's a string, try to parse it as JSON
                if (typeof responseJson === 'string') {
                    responseJson = JSON.parse(responseJson);
                }
            } catch (e) {
                // If parsing fails, use the raw response data
                responseJson = response.data;
            }

            // Check if results match
            let match = true;
            for (let i = 0; i < scenario.testTable.resultColumns.length; i++) {
                const col = scenario.testTable.resultColumns[i];
                const item = row.resultItems[i];
                let actualValue;

                if (col.expression.replace(' ', '').toLowerCase() === '{{http_status}}') {
                    actualValue = httpStatus.toString();
                } else if (col.expression.startsWith('$.')) {
                    const json_path = col.expression.substring(2).split('.');
                    let current = responseJson;
                    let found = true;

                    // Traverse the path
                    for (const key of json_path) {
                        if (typeof current !== 'object' || current === null) {
                            found = false;
                            break;
                        }
                        current = current[key];
                        if (current === undefined) {
                            found = false;
                            break;
                        }
                    }

                    if (!found) {
                        match = false;
                        break;
                    }

                    actualValue = current.toString();
                } else {
                    match = false;
                    break;
                }

                // Compare values
                if (!this.compareValues(actualValue, item.value, item.operator)) {
                    match = false;
                    break;
                }
            }

            return {
                httpStatus,
                jsonContent: responseJson,
                match
            };
        } catch (error) {
            return {
                httpStatus: 0,
                jsonContent: { error: error.message },
                match: false
            };
        }
    }

    compareValues(actual, expected, op) {
        // Try parsing as numbers if possible
        const actualNum = parseFloat(actual);
        const expectedNum = parseFloat(expected);

        if (!isNaN(actualNum) && !isNaN(expectedNum)) {
            switch (op) {
                case '=': return actualNum === expectedNum;
                case '!=': return actualNum !== expectedNum;
                case '>': return actualNum > expectedNum;
                case '<': return actualNum < expectedNum;
                case '>=': return actualNum >= expectedNum;
                case '<=': return actualNum <= expectedNum;
                default: return actualNum === expectedNum;
            }
        }

        // String comparisons
        switch (op) {
            case '=': return actual === expected;
            case '!=': return actual !== expected;
            case 'contain': return actual.includes(expected);
            case 'notcontain': return !actual.includes(expected);
            default: return actual === expected;
        }
    }

    async executeAllTests(scenario) {
        const results = [];
        for (const row of scenario.testTable.rows) {
            const result = await this.executeTest(scenario, row);
            results.push(result);
        }

        return results;
    }
}

export default TestExecutor; 