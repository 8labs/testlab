export const executeTest = async (scenario, row) => {
    return await window.eightlabs.executeTest(scenario, row);
};

export const executeAllTests = async (scenario) => {
    return await window.eightlabs.executeAllTests(scenario);
};

export const executeFollowupTest = async (scenario, row, firstResponseJson) => {
    return await window.eightlabs.executeFollowupTest(scenario, row, firstResponseJson);
}; 