// scriptService.js
// Service to execute scripts via Electron preload

export async function runScript(type, script) {
    if (!window.eightlabs || !window.eightlabs.runScript) {
        throw new Error('Script execution not available');
    }
    return await window.eightlabs.runScript(type, script);
} 