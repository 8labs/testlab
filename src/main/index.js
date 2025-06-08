import { app, shell, BrowserWindow, ipcMain, Menu } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.icns?asset'

import TestExecutor from './testExecutor.mjs';
import DataService from './dataService.mjs';
import TestHistoryService from './testHistoryService.mjs';
import AnalyticsService from './analyticsService.mjs';

const testExecutor = new TestExecutor();
const dataService = new DataService();
const testHistoryService = new TestHistoryService();
const analyticsService = new AnalyticsService();

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1920,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    titleBarStyle: 'hidden',
    // expose window controls in Windows/Linux
    ...(process.platform !== 'darwin' ? { titleBarOverlay: true } : {}),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  // mainWindow.webContents.openDevTools();

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
    ipcMain.handle('load-scenario-list-context-menu', async (event, id) => {
      const menuTemplate = [
        {
          label: 'Delete Test',
          click: () => {
            dataService.deleteTestScenario(id);
            mainWindow.webContents.send('test-deleted', id)
          }
        }
      ];
      const contextMenu = Menu.buildFromTemplate(menuTemplate); // 3
      contextMenu.popup({ window: mainWindow.webContents });    // 4
    });
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  dataService.initialize();
  testHistoryService.initialize();
  await analyticsService.initialize();
  await analyticsService.trackAppOpened();

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // Set up IPC handlers for data operations
  ipcMain.handle('get-all-test-scenarios', async () => {
    const scenarios = await dataService.getAllTestScenarios();
    return scenarios;
  });

  ipcMain.handle('get-test-scenario', async (event, id) => {
    return await dataService.getTestScenario(id);
  });

  ipcMain.handle('save-test-scenario', async (event, scenario) => {
    const savedScenario = await dataService.saveTestScenario(scenario);
    const allScenarios = await dataService.getAllTestScenarios();
    await analyticsService.trackTestCreated(allScenarios.length);
    return savedScenario;
  });

  ipcMain.handle('delete-test-scenario', async (event, id) => {
    return await dataService.deleteTestScenario(id);
  });

  ipcMain.handle('update-test-scenario-metadata', async (event, id, metadata) => {
    return await dataService.updateTestScenarioMetadata(id, metadata);
  });

  // Test history IPC handlers
  ipcMain.handle('save-test-history', async (event, historyEntry) => {
    return await testHistoryService.saveTestHistory(historyEntry);
  });

  ipcMain.handle('get-test-history', async (event, scenarioId) => {
    return await testHistoryService.getTestHistory(scenarioId);
  });

  ipcMain.handle('get-all-test-history', async () => {
    return await testHistoryService.getAllTestHistory();
  });

  ipcMain.handle('get-failure-count', async (event, scenarioId) => {
    return await testHistoryService.getFailureCount(scenarioId);
  });

  ipcMain.handle('execute-test', async (event, scenario, row) => {
    const result = await testExecutor.executeTest(scenario, row);
    return result;
  });

  ipcMain.handle('execute-all-tests', async (event, scenario) => {
    const results = await testExecutor.executeAllTests(scenario);
    return results;
  });

  ipcMain.handle('track-event', async (event, eventType, details) => {
    await analyticsService.trackEvent(eventType, details);
  });

  createWindow()


  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})


// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
