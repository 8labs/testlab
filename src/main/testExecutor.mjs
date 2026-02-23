import axios from 'axios';
import TestHistoryService from './testHistoryService.mjs';
import { runScript } from '../renderer/src/services/scriptService.js';

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
                // Only include non-followup inputs in the first query
                if (!col.expression.startsWith('%')) {
                    acc[col.expression] = row.inputItems[index].value;
                }
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
                            // Convert to number if it's a numeric string
                            const value = row.inputItems[index].value;
                            current[key] = !isNaN(value) && value.trim() !== '' ? Number(value) : value;
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

            // Check if results match for first query
            let match = true;
            const counts = [];
            for (let i = 0; i < scenario.testTable.resultColumns.length; i++) {
                const col = scenario.testTable.resultColumns[i];
                const item = row.resultItems[i];

                // Skip followup result columns in first query
                if (col.expression.startsWith('%')) {
                    continue;
                }

                let actualValue;

                // Handle count() function in expressions
                const countMatch = col.expression.match(/\{\{[\s]+?count\((.*?)\)[\s]+?\}\}/);
                if (countMatch) {
                    const jsonPath = countMatch[1];
                    if (jsonPath.startsWith('$.')) {
                        const path = jsonPath.substring(2).split('.');
                        let current = responseJson;
                        let found = true;

                        // Traverse the path
                        for (const key of path) {
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

                        if (!found || !Array.isArray(current)) {
                            console.log('6 else ' + jsonPath);
                            match = false;
                            break;
                        }

                        actualValue = current.length.toString();
                        // Add to counts array
                        counts.push({
                            name: jsonPath,
                            count: current.length
                        });
                    } else {
                        console.log('7 else ' + jsonPath);
                        match = false;
                        break;
                    }
                } else if (col.expression.replace(' ', '').toLowerCase() === '{{http_status}}') {
                    actualValue = httpStatus.toString();
                } else if (col.expression.replace(' ', '').toLowerCase() === '{{followup_http_status}}') {
                    continue;
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
                        console.log('8 else ' + col.expression);
                        match = false;
                        break;
                    }

                    actualValue = current.toString();
                } else {
                    console.log('9 else ' + col.expression);
                    match = false;
                    break;
                }

                // Compare values
                if (!this.compareValues(actualValue, item.value, item.operator)) {
                    console.log('10 ' + actualValue + ' -> ' + item.value + ' -> ' + item.operator);
                    match = false;
                    break;
                }
            }

            // Execute followup query if configured
            let followupResult = null;
            if (scenario.followup_endpoint) {
                followupResult = await this.executeFollowupTest(scenario, row, responseJson);
                // Only combine matches if there are followup result columns
                const hasFollowupResults = scenario.testTable.resultColumns.some(col => col.expression.startsWith('%'));
                if (hasFollowupResults) {
                    match = match && followupResult.match;
                }
                // Combine counts
                counts.push(...followupResult.counts);
            }

            return {
                httpStatus,
                jsonContent: responseJson,
                followupResult,
                match,
                counts
            };
        } catch (error) {
            return {
                httpStatus: 0,
                jsonContent: { error: error.message },
                match: false
            };
        }
    }

    async executeFollowupTest(scenario, row, firstResponseJson) {
        try {
            // Wait for the specified time
            const waitTime = scenario.followup_wait_time || 0;
            const waitUnit = scenario.followup_wait_time_unit || 'ms';
            const waitMs = waitUnit === 's' ? waitTime * 1000 : waitTime;
            await new Promise(resolve => setTimeout(resolve, waitMs));

            // Create a map of input values for followup query
            const inputMap = scenario.testTable.inputColumns.reduce((acc, col, index) => {
                // For followup inputs, replace $ bindings with values from first response
                let value = row.inputItems[index].value;
                if (value.startsWith('%.')) {
                    const path = value.substring(2).split('.');
                    let current = firstResponseJson;
                    let found = true;

                    // Traverse the path in first response
                    for (const key of path) {
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

                    if (found) {
                        value = current.toString();
                    } else {
                        // If we couldn't find the value, use the original binding
                        value = `{{${value.substring(2)}}}`;
                    }
                }
                acc[col.expression] = value;
                return acc;
            }, {});


            // Prepare the endpoint URL
            let endpoint = scenario.followup_endpoint;
            Object.entries(inputMap).filter(([key]) => !key.startsWith('$'))
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

            // Prepare request body for followup
            const bodyMap = {};
            scenario.testTable.inputColumns.forEach((col, index) => {
                if (col.expression.startsWith('%')) {
                    // Remove the % prefix and use the rest as the path
                    const path = col.expression.substring(2);
                    const parts = path.split('.');

                    if (parts.length === 1) {
                        // For root level properties, set directly
                        const value = inputMap[col.expression];
                        bodyMap[parts[0]] = !isNaN(value) && value.trim() !== '' ? Number(value) : value;
                    } else {
                        // For nested properties, create the structure
                        let current = bodyMap;
                        for (let i = 0; i < parts.length; i++) {
                            const key = parts[i];
                            if (i === parts.length - 1) {
                                const value = inputMap[col.expression];
                                current[key] = !isNaN(value) && value.trim() !== '' ? Number(value) : value;
                            } else {
                                current[key] = current[key] || {};
                                current = current[key];
                            }
                        }
                    }
                }
            });

            // Set up request config
            const config = {
                method: scenario.followup_method || 'POST',
                url: endpoint,
                headers,
                data: Object.keys(bodyMap).length > 0 ? bodyMap : undefined
            };

            // Send followup request
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

            // Check if results match for followup query
            let match = true;
            const counts = [];
            for (let i = 0; i < scenario.testTable.resultColumns.length; i++) {
                const col = scenario.testTable.resultColumns[i];
                const item = row.resultItems[i];

                // Only check followup result columns
                if (!col.expression.startsWith('%')) {
                    continue;
                }

                let actualValue;

                // Handle count() function in expressions
                const countMatch = col.expression.match(/\{\{[\s]+?count\((.*?)\)[\s]+?\}\}/);
                if (countMatch) {
                    const jsonPath = countMatch[1];
                    if (jsonPath.startsWith('$.')) {
                        const path = jsonPath.substring(2).split('.');
                        let current = responseJson;
                        let found = true;

                        // Traverse the path
                        for (const key of path) {
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

                        if (!found || !Array.isArray(current)) {
                            console.log('1 ' + jsonPath + ' -> ' + current + ' -> ' + found);
                            match = false;
                            break;
                        }

                        actualValue = current.length.toString();
                        // Add to counts array
                        counts.push({
                            name: jsonPath,
                            count: current.length
                        });
                    } else {
                        console.log('2 else ' + jsonPath);
                        match = false;
                        break;
                    }
                } else if (col.expression.replace(' ', '').toLowerCase() === '{{followup_http_status}}') {
                    actualValue = httpStatus.toString();
                } else if (col.expression.startsWith('%.')) {
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
                        console.log('3 ' + col.expression + ' -> ' + actualValue + ' -> ' + item.value);
                        match = false;
                        break;
                    }

                    actualValue = current.toString();
                } else {
                    console.log('4 ' + col.expression + ' -> ' + actualValue + ' -> ' + item.value);
                    match = false;
                    break;
                }

                // Compare values
                if (!this.compareValues(actualValue, item.value, item.operator)) {
                    console.log('5 ' + actualValue + ' -> ' + item.value + ' -> ' + item.operator);
                    match = false;
                    break;
                }
            }

            return {
                httpStatus,
                jsonContent: responseJson,
                match,
                counts
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
        // Run pre-run script if present
        if (scenario.scripts && scenario.scripts.preRun) {
            try {
                await runScript('preRun', scenario.scripts.preRun);
            } catch (e) {
                console.error('Pre-run script error:', e);
            }
        }
        for (const row of scenario.testTable.rows) {
            // Run pre-test script if present
            if (scenario.scripts && scenario.scripts.preTest) {
                try {
                    await runScript('preTest', scenario.scripts.preTest);
                } catch (e) {
                    console.error('Pre-test script error:', e);
                }
            }
            const result = await this.executeTest(scenario, row);
            results.push(result);
            // Run post-test script if present
            if (scenario.scripts && scenario.scripts.postTest) {
                try {
                    await runScript('postTest', scenario.scripts.postTest);
                } catch (e) {
                    console.error('Post-test script error:', e);
                }
            }
        }
        // Run post-run script if present
        if (scenario.scripts && scenario.scripts.postRun) {
            try {
                await runScript('postRun', scenario.scripts.postRun);
            } catch (e) {
                console.error('Post-run script error:', e);
            }
        }
        return results;
    }
}

export default TestExecutor; 