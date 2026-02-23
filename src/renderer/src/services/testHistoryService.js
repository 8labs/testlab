export const saveTestHistory = async (testResults) => {
    console.log("saveTestHistory", testResults);
    try {
        return await window.eightlabs.saveTestHistory(testResults);
    } catch (error) {
        console.error('Error saving test history:', error);
        throw error;
    }
};

export const getTestHistory = async (scenarioId) => {
    try {
        return await window.eightlabs.getTestHistory(scenarioId);
    } catch (error) {
        console.error('Error getting test history:', error);
        throw error;
    }
};

export const getAllTestHistory = async () => {
    try {
        return await window.eightlabs.getAllTestHistory();
    } catch (error) {
        console.error('Error getting all test history:', error);
        throw error;
    }
};

export const getFailureCount = async (scenarioId) => {
    try {
        return await window.eightlabs.getFailureCount(scenarioId);
    } catch (error) {
        console.error('Error getting failure count:', error);
        return 0;
    }
}; 