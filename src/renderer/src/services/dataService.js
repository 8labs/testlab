
export const getAllTestScenarios = async () => {

    return await window.eightlabs.getAllTestScenarios();
};

export const getTestScenario = async (id) => {

    return await window.eightlabs.getTestScenario(id);
};

export const saveTestScenario = async (scenario) => {

    return await window.eightlabs.saveTestScenario(scenario);
};

export const deleteTestScenario = async (id) => {
    return await window.eightlabs.deleteTestScenario(id);
};

export const updateTestScenarioMetadata = async (id, metadata) => {

    return await window.eightlabs.updateTestScenarioMetadata(id, metadata);
}; 