import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
    contextBridge.exposeInMainWorld(
      'eightlabs',
      {
        // Test execution
        executeTest: (scenario, row) => ipcRenderer.invoke('execute-test', scenario, row),
        executeAllTests: (scenario) => ipcRenderer.invoke('execute-all-tests', scenario),

        // Data operations
        getAllTestScenarios: () => ipcRenderer.invoke('get-all-test-scenarios'),
        getTestScenario: (id) => ipcRenderer.invoke('get-test-scenario', id),
        saveTestScenario: async (scenario) => await ipcRenderer.invoke('save-test-scenario', scenario),
        deleteTestScenario: (id) => ipcRenderer.invoke('delete-test-scenario', id),
        updateTestScenarioMetadata: (id, metadata) =>
          ipcRenderer.invoke('update-test-scenario-metadata', id, metadata),
      }
    );
  } catch (error) {
    console.error(error)
  }
} else {
  window.electron = electronAPI
  window.api = api
}

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
