
export const executeTest = async (scenario, row) => {
    return await window.eightlabs.executeTest(scenario, row);
};

export const executeAllTests = async (scenario) => {
    return await window.eightlabs.executeAllTests(scenario);
}; 