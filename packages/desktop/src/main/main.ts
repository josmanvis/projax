import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as http from 'http';
import { spawn, ChildProcess } from 'child_process';
import { Tail } from 'tail';
// #region agent log
fetch('http://127.0.0.1:7242/ingest/6c072a46-f01e-4db0-a457-6218bdb7cec6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.ts:7',message:'Importing core modules',data:{__dirname},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
// #endregion
import {
  getDatabaseManager,
  getAllProjects,
  addProject,
  removeProject,
  scanProject,
  scanAllProjects,
  getTestsByProject,
} from './core';
// #region agent log
fetch('http://127.0.0.1:7242/ingest/6c072a46-f01e-4db0-a457-6218bdb7cec6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.ts:16',message:'Core modules imported successfully',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
// #endregion
import type { Project, Test } from 'projax-core';

let mainWindow: BrowserWindow | null = null;
let apiProcess: ChildProcess | null = null;
const logWatchers: Map<number, any> = new Map();

// #region agent log
fetch('http://127.0.0.1:7242/ingest/6c072a46-f01e-4db0-a457-6218bdb7cec6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.ts:23',message:'Checking single instance lock',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
// #endregion
// Prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/6c072a46-f01e-4db0-a457-6218bdb7cec6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.ts:27',message:'Single instance lock failed - another instance running',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
  // #endregion
  app.quit();
} else {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/6c072a46-f01e-4db0-a457-6218bdb7cec6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.ts:30',message:'Single instance lock acquired',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
  // #endregion
  app.on('second-instance', () => {
    // Someone tried to run a second instance, focus our window instead
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  function createWindow() {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/6c072a46-f01e-4db0-a457-6218bdb7cec6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.ts:36',message:'createWindow called',data:{hasMainWindow:!!mainWindow},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    // Don't create a new window if one already exists
    if (mainWindow) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/6c072a46-f01e-4db0-a457-6218bdb7cec6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.ts:39',message:'Window already exists, focusing',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      mainWindow.focus();
      return;
    }


    const isDev = process.env.NODE_ENV === 'development';
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/6c072a46-f01e-4db0-a457-6218bdb7cec6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.ts:45',message:'Creating BrowserWindow',data:{isDev,__dirname},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    
    mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      frame: false,
      titleBarStyle: 'hidden',
      title: 'PROJAX UI',
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        nodeIntegration: false,
        contextIsolation: true,
        webSecurity: true,
      },
      show: false, // Don't show until ready
    });

    // Show window when ready to prevent white screen flash
    mainWindow.once('ready-to-show', () => {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/6c072a46-f01e-4db0-a457-6218bdb7cec6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.ts:63',message:'Window ready-to-show event fired',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      mainWindow?.show();
    });

    // Load the app
    if (isDev) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/6c072a46-f01e-4db0-a457-6218bdb7cec6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.ts:67',message:'Dev mode: checking Vite server',data:{port:7898},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      // Wait for Vite dev server to be ready before loading
      const checkServerAndLoad = (retries = 10) => {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/6c072a46-f01e-4db0-a457-6218bdb7cec6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.ts:70',message:'Checking Vite server availability',data:{retries},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        const req = http.get('http://localhost:7898', (res) => {
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/6c072a46-f01e-4db0-a457-6218bdb7cec6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.ts:72',message:'Vite server is ready',data:{statusCode:res.statusCode},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
          // #endregion
          console.log('Vite dev server is ready!');
          mainWindow?.loadURL('http://localhost:7898');
          mainWindow?.webContents.openDevTools();
        });
        
        req.on('error', (error) => {
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/6c072a46-f01e-4db0-a457-6218bdb7cec6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.ts:76',message:'Vite server check error',data:{error:error.message,retries},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
          // #endregion
          if (retries > 0) {
            console.log(`Vite dev server not ready (${retries} retries left), retrying in 1 second...`);
            setTimeout(() => checkServerAndLoad(retries - 1), 1000);
          } else {
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/6c072a46-f01e-4db0-a457-6218bdb7cec6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.ts:82',message:'Vite server connection failed after all retries',data:{error:error.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
            // #endregion
            console.error('Failed to connect to Vite dev server after multiple retries');
            console.error('Make sure Vite is running on port 7898');
            mainWindow?.loadURL('http://localhost:7898'); // Try anyway
          }
        });
        
        req.setTimeout(2000, () => {
          req.destroy();
          if (retries > 0) {
            console.log(`Vite dev server timeout (${retries} retries left), retrying...`);
            setTimeout(() => checkServerAndLoad(retries - 1), 1000);
          } else {
            console.error('Failed to connect to Vite dev server - timeout');
            mainWindow?.loadURL('http://localhost:7898'); // Try anyway
          }
        });
      };
      
      checkServerAndLoad();
    } else {
      // Try bundled renderer path first (when bundled in CLI: dist/electron/renderer/index.html)
      // Then try local dev path (packages/desktop/dist/renderer/index.html)
      const bundledRenderer = path.join(__dirname, 'renderer', 'index.html');
      const localRenderer = path.join(__dirname, '..', 'renderer', 'index.html');
      
      if (fs.existsSync(bundledRenderer)) {
        mainWindow.loadFile(bundledRenderer);
      } else if (fs.existsSync(localRenderer)) {
        mainWindow.loadFile(localRenderer);
      } else {
        console.error('Error: Renderer index.html not found');
        console.error('Bundled path:', bundledRenderer);
        console.error('Local path:', localRenderer);
        app.quit();
      }
    }

    // Handle external links securely
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
      // Only allow http/https links to be opened externally for security
      const isExternal = url.startsWith('http:') || url.startsWith('https:');
      
      if (isExternal) {
        shell.openExternal(url);
        // Deny the default action of opening a new Electron window/tab
        return { action: 'deny' };
      }
      
      // For internal or non-web links, allow the default behavior
      return { action: 'allow' };
    });

    mainWindow.on('closed', () => {
      mainWindow = null;
    });

    // Handle page load errors
    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
      console.error('Failed to load:', validatedURL, errorCode, errorDescription);
      if (isDev && validatedURL === 'http://localhost:7898/') {
        console.log('Retrying to load Vite dev server...');
        setTimeout(() => {
          mainWindow?.loadURL('http://localhost:7898');
        }, 2000);
      }
    });

    // Log when page finishes loading
    mainWindow.webContents.on('did-finish-load', () => {
      console.log('Page loaded successfully');
    });

    // Log console messages from renderer
    mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
      console.log(`[Renderer ${level}]:`, message, sourceId ? `(${sourceId}:${line})` : '');
    });

    // Log all console output from renderer
    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL, isMainFrame) => {
      if (isMainFrame) {
        console.error('Main frame failed to load:', {
          errorCode,
          errorDescription,
          validatedURL,
        });
      }
    });

    // Add keyboard shortcut to reload in dev mode
    if (isDev) {
      mainWindow.webContents.on('before-input-event', (event, input) => {
        // Cmd+R or Ctrl+R to reload
        if ((input.control || input.meta) && input.key.toLowerCase() === 'r') {
          event.preventDefault();
          mainWindow?.reload();
        }
        // Cmd+Shift+R or Ctrl+Shift+R to hard reload
        if ((input.control || input.meta) && input.shift && input.key.toLowerCase() === 'r') {
          event.preventDefault();
          mainWindow?.webContents.reloadIgnoringCache();
        }
      });
    }
  }

  // Start API server
  function startAPIServer() {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/6c072a46-f01e-4db0-a457-6218bdb7cec6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.ts:187',message:'startAPIServer called',data:{__dirname,processCwd:process.cwd()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    try {
      // Try to find API server in various locations
      const apiPaths = [
        path.join(__dirname, '..', '..', '..', 'api', 'dist', 'index.js'),
        path.join(__dirname, '..', '..', 'api', 'dist', 'index.js'),
        path.join(process.cwd(), 'packages', 'api', 'dist', 'index.js'),
      ];
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/6c072a46-f01e-4db0-a457-6218bdb7cec6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.ts:196',message:'Checking API paths',data:{apiPaths,__dirname},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion

      let apiPath: string | null = null;
      for (const p of apiPaths) {
        const exists = fs.existsSync(p);
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/6c072a46-f01e-4db0-a457-6218bdb7cec6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.ts:199',message:'Checking API path',data:{path:p,exists},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
        if (exists) {
          apiPath = p;
          break;
        }
      }

      if (!apiPath) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/6c072a46-f01e-4db0-a457-6218bdb7cec6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.ts:205',message:'API server not found',data:{checkedPaths:apiPaths},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
        console.warn('API server not found. Some features may not work.');
        return;
      }

      console.log('Starting API server from:', apiPath);
      // Kill any existing API server on the same port first
      if (apiProcess) {
        console.log('Killing existing API server...');
        apiProcess.kill();
        apiProcess = null;
      }
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/6c072a46-f01e-4db0-a457-6218bdb7cec6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.ts:216',message:'Spawning API server process',data:{apiPath,cwd:path.dirname(apiPath)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      apiProcess = spawn('node', [apiPath], {
        detached: false,
        stdio: 'pipe',
        env: { ...process.env },
        cwd: path.dirname(apiPath),
      });
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/6c072a46-f01e-4db0-a457-6218bdb7cec6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.ts:222',message:'API server process spawned',data:{pid:apiProcess.pid},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion

      apiProcess.stdout?.on('data', (data) => {
        console.log(`[API] ${data.toString().trim()}`);
      });

      apiProcess.stderr?.on('data', (data) => {
        console.error(`[API Error] ${data.toString().trim()}`);
      });

      apiProcess.on('exit', (code) => {
        console.log(`API server exited with code ${code}`);
        apiProcess = null;
        // Restart API server if it crashes (wait 2 seconds)
        if (code !== 0) {
          console.log('API server crashed, restarting in 2 seconds...');
          setTimeout(() => {
            startAPIServer();
          }, 2000);
        }
      });
    } catch (error) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/6c072a46-f01e-4db0-a457-6218bdb7cec6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.ts:243',message:'API server startup error',data:{error:error instanceof Error ? error.message : String(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      console.error('Failed to start API server:', error);
    }
  }

  app.whenReady().then(() => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/6c072a46-f01e-4db0-a457-6218bdb7cec6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.ts:247',message:'App whenReady fired',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    startAPIServer();
    createWindow();

    app.on('activate', () => {
      // On macOS, re-create window when dock icon is clicked and no windows are open
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      } else if (mainWindow) {
        mainWindow.focus();
      }
    });
  });
}

app.on('window-all-closed', () => {
  // Kill API server
  if (apiProcess) {
    console.log('Stopping API server...');
    apiProcess.kill();
    apiProcess = null;
  }
  
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  // Kill API server before quitting
  if (apiProcess) {
    console.log('Stopping API server...');
    apiProcess.kill();
    apiProcess = null;
  }
});

// IPC Handlers

ipcMain.handle('get-app-version', async (): Promise<string> => {
  return app.getVersion();
});

ipcMain.handle('get-projects', async (): Promise<Project[]> => {
  try {
    console.log('Getting projects from database...');
    const projects = getAllProjects();
    console.log(`Found ${projects.length} project(s)`);
    return projects;
  } catch (error) {
    console.error('Error getting projects:', error);
    throw error;
  }
});

ipcMain.handle('add-project', async (_, projectPath: string): Promise<Project> => {
  if (!fs.existsSync(projectPath)) {
    throw new Error('Path does not exist');
  }
  if (!fs.statSync(projectPath).isDirectory()) {
    throw new Error('Path must be a directory');
  }
  
  const db = getDatabaseManager();
  const existingProject = db.getProjectByPath(projectPath);
  
  if (existingProject) {
    throw new Error('Project already exists');
  }
  
  const projectName = path.basename(projectPath);
  return db.addProject(projectName, projectPath);
});

ipcMain.handle('remove-project', async (_, projectId: number): Promise<void> => {
  removeProject(projectId);
});

ipcMain.handle('scan-project', async (_, projectId: number) => {
  return scanProject(projectId);
});

ipcMain.handle('scan-all-projects', async () => {
  return scanAllProjects();
});

ipcMain.handle('get-tests', async (_, projectId: number): Promise<Test[]> => {
  try {
    const db = getDatabaseManager();
    return getTestsByProject(projectId);
  } catch (error) {
    console.error('Error getting tests:', error);
    throw error;
  }
});

ipcMain.handle('get-latest-test-result', async (_, projectId: number) => {
  try {
    const db = getDatabaseManager();
    return db.getLatestTestResult(projectId);
  } catch (error) {
    console.error('Error getting latest test result:', error);
    return null;
  }
});

ipcMain.handle('select-directory', async (): Promise<string | null> => {
  if (!mainWindow) return null;
  
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
  });
  
  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }
  
  return result.filePaths[0];
});

// Window controls
ipcMain.handle('minimize-window', () => {
  if (mainWindow) {
    mainWindow.minimize();
  }
});

ipcMain.handle('maximize-window', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.handle('close-window', () => {
  if (mainWindow) {
    mainWindow.close();
  }
});

// Update project
ipcMain.handle('update-project', async (_, projectId: number, updates: { description?: string | null }) => {
  const db = getDatabaseManager();
  const updated = db.updateProject(projectId, updates);
  return updated;
});

// Rename project
ipcMain.handle('rename-project', async (_, projectId: number, newName: string): Promise<Project> => {
  const db = getDatabaseManager();
  return db.updateProjectName(projectId, newName);
});

// Get project scripts
ipcMain.handle('get-project-scripts', async (_, projectPath: string) => {
  // Try bundled path first (when bundled in CLI: dist/electron/main.js -> dist/script-runner.js)
  // Then try local dev path (packages/desktop/dist/main.js -> packages/cli/dist/script-runner.js)
  const bundledScriptRunnerPath = path.join(__dirname, '..', 'script-runner.js');
  const localScriptRunnerPath = path.join(__dirname, '..', '..', 'cli', 'dist', 'script-runner.js');
  
  let scriptRunnerPath: string;
  if (fs.existsSync(bundledScriptRunnerPath)) {
    scriptRunnerPath = bundledScriptRunnerPath;
  } else {
    scriptRunnerPath = localScriptRunnerPath;
  }
  
  const { getProjectScripts } = await import(scriptRunnerPath);
  const result = getProjectScripts(projectPath);
  // Convert Map to array for IPC serialization
  const scriptsArray = Array.from(result.scripts.entries() as Iterable<[string, any]>).map(([name, script]) => ({
    name,
    ...script,
  }));
  return {
    type: result.type,
    scripts: scriptsArray,
  };
});

// Run script
ipcMain.handle('run-script', async (_, projectPath: string, scriptName: string, args: string[] = [], background: boolean = false) => {
  try {
  // Try bundled path first (when bundled in CLI: dist/electron/main.js -> dist/script-runner.js)
  // Then try local dev path (packages/desktop/dist/main.js -> packages/cli/dist/script-runner.js)
  const bundledScriptRunnerPath = path.join(__dirname, '..', 'script-runner.js');
  const localScriptRunnerPath = path.join(__dirname, '..', '..', 'cli', 'dist', 'script-runner.js');
  
  let scriptRunnerPath: string;
  if (fs.existsSync(bundledScriptRunnerPath)) {
    scriptRunnerPath = bundledScriptRunnerPath;
    } else if (fs.existsSync(localScriptRunnerPath)) {
      scriptRunnerPath = localScriptRunnerPath;
  } else {
      throw new Error(`Script runner not found. Tried: ${bundledScriptRunnerPath} and ${localScriptRunnerPath}`);
  }
  
    const scriptRunnerModule = await import(scriptRunnerPath);
    const { runScriptInBackground } = scriptRunnerModule;
    
    if (!runScriptInBackground || typeof runScriptInBackground !== 'function') {
      throw new Error('runScriptInBackground function not found in script runner module');
    }
    
  const db = getDatabaseManager();
  const project = db.getProjectByPath(projectPath);
  
  if (!project) {
    throw new Error('Project not found');
  }
  
  // Run in background (foreground scripts would need IPC streaming for output)
    const pid = await runScriptInBackground(projectPath, project.name, scriptName, args, false);
    return { success: true, background: true, pid };
  } catch (error) {
    console.error('Error running script:', error);
    throw error;
  }
});

// Scan ports
ipcMain.handle('scan-project-ports', async (_, projectId: number) => {
  // Try bundled path first (when bundled in CLI: dist/electron/main.js -> dist/port-scanner.js)
  // Then try local dev path (packages/desktop/dist/main.js -> packages/cli/dist/port-scanner.js)
  const bundledPortScannerPath = path.join(__dirname, '..', 'port-scanner.js');
  const localPortScannerPath = path.join(__dirname, '..', '..', 'cli', 'dist', 'port-scanner.js');
  
  let portScannerPath: string;
  if (fs.existsSync(bundledPortScannerPath)) {
    portScannerPath = bundledPortScannerPath;
  } else {
    portScannerPath = localPortScannerPath;
  }
  
  const { scanProjectPorts } = await import(portScannerPath);
  await scanProjectPorts(projectId);
  const db = getDatabaseManager();
  return db.getProjectPorts(projectId);
});

ipcMain.handle('scan-all-ports', async () => {
  // Try bundled path first (when bundled in CLI: dist/electron/main.js -> dist/port-scanner.js)
  // Then try local dev path (packages/desktop/dist/main.js -> packages/cli/dist/port-scanner.js)
  const bundledPortScannerPath = path.join(__dirname, '..', 'port-scanner.js');
  const localPortScannerPath = path.join(__dirname, '..', '..', 'cli', 'dist', 'port-scanner.js');
  
  let portScannerPath: string;
  if (fs.existsSync(bundledPortScannerPath)) {
    portScannerPath = bundledPortScannerPath;
  } else {
    portScannerPath = localPortScannerPath;
  }
  
  const { scanAllProjectPorts } = await import(portScannerPath);
  await scanAllProjectPorts();
  const db = getDatabaseManager();
  const projects = getAllProjects();
  const result: Record<number, any[]> = {};
  for (const project of projects) {
    result[project.id] = db.getProjectPorts(project.id);
  }
  return result;
});

// Get project ports
ipcMain.handle('get-project-ports', async (_, projectId: number) => {
  const db = getDatabaseManager();
  return db.getProjectPorts(projectId);
});

// Get running processes
ipcMain.handle('get-running-processes', async () => {
  // Try bundled path first (when bundled in CLI: dist/electron/main.js -> dist/script-runner.js)
  // Then try local dev path (packages/desktop/dist/main.js -> packages/cli/dist/script-runner.js)
  const bundledScriptRunnerPath = path.join(__dirname, '..', 'script-runner.js');
  const localScriptRunnerPath = path.join(__dirname, '..', '..', 'cli', 'dist', 'script-runner.js');
  
  let scriptRunnerPath: string;
  if (fs.existsSync(bundledScriptRunnerPath)) {
    scriptRunnerPath = bundledScriptRunnerPath;
  } else {
    scriptRunnerPath = localScriptRunnerPath;
  }
  
  const { getRunningProcessesClean } = await import(scriptRunnerPath);
  return await getRunningProcessesClean();
});

// Stop script by PID
ipcMain.handle('stop-script', async (_, pid: number) => {
  // Try bundled path first (when bundled in CLI: dist/electron/main.js -> dist/script-runner.js)
  // Then try local dev path (packages/desktop/dist/main.js -> packages/cli/dist/script-runner.js)
  const bundledScriptRunnerPath = path.join(__dirname, '..', 'script-runner.js');
  const localScriptRunnerPath = path.join(__dirname, '..', '..', 'cli', 'dist', 'script-runner.js');
  
  let scriptRunnerPath: string;
  if (fs.existsSync(bundledScriptRunnerPath)) {
    scriptRunnerPath = bundledScriptRunnerPath;
  } else {
    scriptRunnerPath = localScriptRunnerPath;
  }
  
  const { stopScript } = await import(scriptRunnerPath);
  return await stopScript(pid);
});

// Stop all processes for a project
ipcMain.handle('stop-project', async (_, projectPath: string) => {
  // Try bundled path first (when bundled in CLI: dist/electron/main.js -> dist/script-runner.js)
  // Then try local dev path (packages/desktop/dist/main.js -> packages/cli/dist/script-runner.js)
  const bundledScriptRunnerPath = path.join(__dirname, '..', 'script-runner.js');
  const localScriptRunnerPath = path.join(__dirname, '..', '..', 'cli', 'dist', 'script-runner.js');
  
  let scriptRunnerPath: string;
  if (fs.existsSync(bundledScriptRunnerPath)) {
    scriptRunnerPath = bundledScriptRunnerPath;
  } else {
    scriptRunnerPath = localScriptRunnerPath;
  }
  
  const { stopProjectProcesses } = await import(scriptRunnerPath);
  return await stopProjectProcesses(projectPath);
});

// Open URL in browser
ipcMain.handle('open-url', async (_, url: string) => {
  // Try bundled path first (when bundled in CLI: dist/electron/main.js -> dist/core)
  // Then try local dev path (packages/desktop/dist/main.js -> packages/core/dist)
  const bundledCorePath = path.join(__dirname, '..', 'core');
  const localCorePath = path.join(__dirname, '..', '..', '..', 'core', 'dist');
  
  let corePath: string;
  if (fs.existsSync(bundledCorePath)) {
    corePath = bundledCorePath;
  } else {
    corePath = localCorePath;
  }
  
  const coreModule = require(corePath);
  const { getBrowserSettings } = coreModule;
  const browserSettings = getBrowserSettings();
  
  let command: string;
  let args: string[] = [url];
  
  if (browserSettings.type === 'custom' && browserSettings.customPath) {
    command = browserSettings.customPath;
  } else {
    // Platform-specific browser commands
    if (process.platform === 'darwin') {
      // macOS
      switch (browserSettings.type) {
        case 'chrome':
          command = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
          break;
        case 'firefox':
          command = '/Applications/Firefox.app/Contents/MacOS/firefox';
          break;
        case 'safari':
          command = 'open';
          args = ['-a', 'Safari', url];
          break;
        case 'edge':
          command = '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge';
          break;
        default:
          command = 'open';
          args = [url];
      }
    } else if (process.platform === 'win32') {
      // Windows
      switch (browserSettings.type) {
        case 'chrome':
          command = 'chrome';
          break;
        case 'firefox':
          command = 'firefox';
          break;
        case 'edge':
          command = 'msedge';
          break;
        case 'safari':
          command = 'safari';
          break;
        default:
          command = 'start';
          args = [url];
      }
    } else {
      // Linux
      switch (browserSettings.type) {
        case 'chrome':
          command = 'google-chrome';
          break;
        case 'firefox':
          command = 'firefox';
          break;
        case 'edge':
          command = 'microsoft-edge';
          break;
        case 'safari':
          command = 'safari';
          break;
        default:
          command = 'xdg-open';
          args = [url];
      }
    }
  }
  
  const { spawn } = require('child_process');
  spawn(command, args, {
    detached: true,
    stdio: 'ignore',
  }).unref();
});

// Open project in editor
ipcMain.handle('open-in-editor', async (_, projectPath: string) => {
  // Try bundled path first (when bundled in CLI: dist/electron/main.js -> dist/core/settings)
  // Then try local dev path (packages/desktop/dist/main.js -> packages/core/dist/settings)
  const bundledSettingsPath = path.join(__dirname, 'core', 'settings');
  const localSettingsPath = path.join(__dirname, '..', '..', 'core', 'dist', 'settings');
  
  let settingsPath: string;
  if (fs.existsSync(bundledSettingsPath + '.js')) {
    settingsPath = bundledSettingsPath;
  } else {
    settingsPath = localSettingsPath;
  }
  
  const { getEditorSettings } = require(settingsPath);
  const editorSettings = getEditorSettings();
  
  let command: string;
  let args: string[] = [projectPath];
  
  if (editorSettings.type === 'custom' && editorSettings.customPath) {
    command = editorSettings.customPath;
  } else {
    switch (editorSettings.type) {
      case 'vscode':
        command = 'code';
        break;
      case 'cursor':
        command = 'cursor';
        break;
      case 'windsurf':
        command = 'windsurf';
        break;
      case 'zed':
        command = 'zed';
        break;
      default:
        command = 'code'; // Default to VS Code
    }
  }
  
  const { spawn } = require('child_process');
  spawn(command, args, {
    detached: true,
    stdio: 'ignore',
  }).unref();
});

// Open workspace in editor
ipcMain.handle('open-workspace', async (_, workspaceId: number) => {
  try {
    // Get workspace file path from API (ensures file exists)
    const ports = [38124, 38125, 38126, 38127, 38128, 3001];
    let apiBaseUrl = '';
    
    for (const port of ports) {
      try {
        const response = await fetch(`http://localhost:${port}/health`, { signal: AbortSignal.timeout(500) });
        if (response.ok) {
          apiBaseUrl = `http://localhost:${port}/api`;
          break;
        }
      } catch {
        continue;
      }
    }
    
    if (!apiBaseUrl) {
      throw new Error('API server not found');
    }
    
    // Get workspace file path (this will generate it if needed)
    const response = await fetch(`${apiBaseUrl}/workspaces/${workspaceId}/file-path`);
    if (!response.ok) {
      throw new Error('Failed to get workspace file path');
    }
    
    const data = await response.json() as { workspace_file_path: string };
    const workspace_file_path = data.workspace_file_path;
    
    if (!fs.existsSync(workspace_file_path)) {
      throw new Error('Workspace file does not exist');
    }
    
    // Open workspace file in editor (workspace files are opened with the workspace flag)
    const bundledSettingsPath = path.join(__dirname, 'core', 'settings');
    const localSettingsPath = path.join(__dirname, '..', '..', 'core', 'dist', 'settings');
    
    let settingsPath: string;
    if (fs.existsSync(bundledSettingsPath + '.js')) {
      settingsPath = bundledSettingsPath;
    } else {
      settingsPath = localSettingsPath;
    }
    
    const { getEditorSettings } = require(settingsPath);
    const editorSettings = getEditorSettings();
    
    let command: string;
    let args: string[] = [];
    
    if (editorSettings.type === 'custom' && editorSettings.customPath) {
      command = editorSettings.customPath;
      // For custom editors, try workspace file as argument
      args = [workspace_file_path];
    } else {
      switch (editorSettings.type) {
        case 'vscode':
        case 'cursor':
        case 'windsurf':
          // VS Code, Cursor, and Windsurf support opening workspace files directly
          command = editorSettings.type === 'vscode' ? 'code' : editorSettings.type === 'cursor' ? 'cursor' : 'windsurf';
          args = [workspace_file_path];
          break;
        case 'zed':
          // Zed doesn't support workspace files, open the first project folder instead
          const workspaceContent = JSON.parse(fs.readFileSync(workspace_file_path, 'utf-8'));
          if (workspaceContent.folders && workspaceContent.folders.length > 0) {
            const firstFolder = workspaceContent.folders[0];
            const folderPath = path.isAbsolute(firstFolder.path) 
              ? firstFolder.path 
              : path.resolve(path.dirname(workspace_file_path), firstFolder.path);
            command = 'zed';
            args = [folderPath];
          } else {
            throw new Error('Workspace has no folders to open');
          }
          break;
        default:
          command = 'code';
          args = [workspace_file_path];
      }
    }
    
    const { spawn } = require('child_process');
    spawn(command, args, {
      detached: true,
      stdio: 'ignore',
    }).unref();
  } catch (error) {
    console.error('Error opening workspace:', error);
    throw error;
  }
});

// Open project directory in file manager
ipcMain.handle('open-in-files', async (_, projectPath: string) => {
  try {
    await shell.openPath(projectPath);
  } catch (error) {
    console.error('Error opening directory:', error);
    throw error;
  }
});


// Get settings
ipcMain.handle('get-settings', async () => {
  try {
    // Load settings module directly
    const bundledSettingsPath = path.join(__dirname, 'core', 'settings');
    const localSettingsPath = path.join(__dirname, '..', '..', 'core', 'dist', 'settings');
    
    let settingsPath: string;
    if (fs.existsSync(bundledSettingsPath + '.js')) {
      settingsPath = bundledSettingsPath;
    } else {
      settingsPath = localSettingsPath;
    }
    
    const { getAppSettings } = require(settingsPath);
    return getAppSettings();
  } catch (error) {
    console.error('Error getting settings:', error);
    throw error;
  }
});

// Save settings
ipcMain.handle('save-settings', async (_, settings: {
  editor: { type: string; customPath?: string };
  browser: { type: string; customPath?: string };
}) => {
  try {
    // Load settings module directly
    const bundledSettingsPath = path.join(__dirname, 'core', 'settings');
    const localSettingsPath = path.join(__dirname, '..', '..', 'core', 'dist', 'settings');
    
    let settingsPath: string;
    if (fs.existsSync(bundledSettingsPath + '.js')) {
      settingsPath = bundledSettingsPath;
    } else {
      settingsPath = localSettingsPath;
    }
    
    const { setAppSettings } = require(settingsPath);
    setAppSettings(settings);
    console.log('Settings saved successfully');
  } catch (error) {
    console.error('Error saving settings:', error);
    throw error;
  }
});

// Open external URL securely (for anchor tags and manual calls)
ipcMain.on('open-external-url', (event, url: string) => {
  try {
    // SECURITY: Ensure only http/https links to prevent arbitrary file execution
    const parsedUrl = new URL(url);
    if (['http:', 'https:'].includes(parsedUrl.protocol)) {
      shell.openExternal(url);
    } else {
      console.warn(`Blocked attempt to open non-http/https URL: ${url}`);
    }
  } catch (error) {
    console.error('Error opening external URL:', error);
  }
});

// Watch process output
ipcMain.handle('watch-process-output', async (_, pid: number) => {
  try {
    // Try bundled path first
    const bundledScriptRunnerPath = path.join(__dirname, '..', 'script-runner.js');
    const localScriptRunnerPath = path.join(__dirname, '..', '..', 'cli', 'dist', 'script-runner.js');
    
    let scriptRunnerPath: string;
    if (fs.existsSync(bundledScriptRunnerPath)) {
      scriptRunnerPath = bundledScriptRunnerPath;
    } else {
      scriptRunnerPath = localScriptRunnerPath;
    }
    
    const { getRunningProcessesClean } = await import(scriptRunnerPath);
    const processes = await getRunningProcessesClean();
    const process = processes.find((p: any) => p.pid === pid);
    
    if (!process || !process.logFile) {
      throw new Error(`Process ${pid} not found or has no log file`);
    }
    
    if (!fs.existsSync(process.logFile)) {
      throw new Error(`Log file not found: ${process.logFile}`);
    }
    
    // Stop any existing watcher for this PID
    if (logWatchers.has(pid)) {
      const existingWatcher = logWatchers.get(pid);
      existingWatcher.unwatch();
      logWatchers.delete(pid);
    }
    
    // Read existing content first
    try {
      const existingContent = fs.readFileSync(process.logFile, 'utf-8');
      if (existingContent && mainWindow) {
        mainWindow.webContents.send('process-output', { pid, data: existingContent });
      }
    } catch (error) {
      console.error('Error reading existing log content:', error);
    }
    
    // Create a tail watcher for the log file
    const tail = new Tail(process.logFile, {
      fromBeginning: false,
      follow: true,
      useWatchFile: true,
    });
    
    tail.on('line', (data: string) => {
      if (mainWindow) {
        mainWindow.webContents.send('process-output', { pid, data: data + '\n' });
      }
    });
    
    tail.on('error', (error: Error) => {
      console.error(`Tail error for PID ${pid}:`, error);
      if (mainWindow) {
        mainWindow.webContents.send('process-output', { pid, data: `\n[Error reading log: ${error.message}]\n` });
      }
    });
    
    logWatchers.set(pid, tail);
    
    return { success: true };
  } catch (error) {
    console.error('Error watching process output:', error);
    throw error;
  }
});

// Unwatch process output
ipcMain.handle('unwatch-process-output', async (_, pid: number) => {
  if (logWatchers.has(pid)) {
    const watcher = logWatchers.get(pid);
    watcher.unwatch();
    logWatchers.delete(pid);
    return { success: true };
  }
  return { success: false };
});

// Workspace handlers
ipcMain.handle('get-workspaces', async () => {
  try {
    const response = await fetch('http://localhost:3001/api/workspaces');
    if (!response.ok) throw new Error('Failed to fetch workspaces');
    return await response.json();
  } catch (error) {
    console.error('Error getting workspaces:', error);
    throw error;
  }
});

ipcMain.handle('add-workspace', async (_, workspace: any) => {
  try {
    const response = await fetch('http://localhost:3001/api/workspaces', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(workspace),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error((errorData as any).error || 'Failed to add workspace');
    }
    return await response.json();
  } catch (error) {
    console.error('Error adding workspace:', error);
    throw error;
  }
});

ipcMain.handle('remove-workspace', async (_, workspaceId: number) => {
  try {
    const response = await fetch(`http://localhost:3001/api/workspaces/${workspaceId}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to remove workspace');
  } catch (error) {
    console.error('Error removing workspace:', error);
    throw error;
  }
});

// Backup handlers
ipcMain.handle('create-backup', async (_, outputPath: string) => {
  try {
    // Try to load from dist first, then src
    const backupUtilsPath = path.join(__dirname, '..', '..', 'core', 'dist', 'backup-utils.js');
    const backupUtilsSrcPath = path.join(__dirname, '..', '..', 'core', 'src', 'backup-utils.ts');
    
    let backupUtils;
    if (fs.existsSync(backupUtilsPath)) {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      backupUtils = require(backupUtilsPath);
    } else if (fs.existsSync(backupUtilsSrcPath.replace('.ts', '.js'))) {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      backupUtils = require(backupUtilsSrcPath.replace('.ts', '.js'));
    } else {
      throw new Error('Backup utils not found');
    }
    
    const { createBackup } = backupUtils;
    const backupPath = await createBackup(outputPath);
    return { success: true, backup_path: backupPath };
  } catch (error) {
    console.error('Error creating backup:', error);
    throw error;
  }
});

ipcMain.handle('restore-backup', async (_, backupPath: string) => {
  try {
    // Try to load from dist first, then src
    const backupUtilsPath = path.join(__dirname, '..', '..', 'core', 'dist', 'backup-utils.js');
    const backupUtilsSrcPath = path.join(__dirname, '..', '..', 'core', 'src', 'backup-utils.ts');
    
    let backupUtils;
    if (fs.existsSync(backupUtilsPath)) {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      backupUtils = require(backupUtilsPath);
    } else if (fs.existsSync(backupUtilsSrcPath.replace('.ts', '.js'))) {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      backupUtils = require(backupUtilsSrcPath.replace('.ts', '.js'));
    } else {
      throw new Error('Backup utils not found');
    }
    
    const { restoreBackup } = backupUtils;
    await restoreBackup(backupPath);
    return { success: true };
  } catch (error) {
    console.error('Error restoring backup:', error);
    throw error;
  }
});

// File dialog handlers
ipcMain.handle('show-save-dialog', async (_, options: any) => {
  if (!mainWindow) return { canceled: true };
  const result = await dialog.showSaveDialog(mainWindow, {
    title: options.title || 'Save File',
    defaultPath: options.defaultPath,
    filters: options.filters || [{ name: 'All Files', extensions: ['*'] }],
  });
  return result;
});

ipcMain.handle('show-open-dialog', async (_, options: any) => {
  if (!mainWindow) return { canceled: true };
  const result = await dialog.showOpenDialog(mainWindow, {
    title: options.title || 'Open File',
    defaultPath: options.defaultPath,
    filters: options.filters || [{ name: 'All Files', extensions: ['*'] }],
    properties: options.properties || ['openFile'],
  });
  return result;
});

ipcMain.handle('select-file', async (_, options: any) => {
  if (!mainWindow) return null;
  const result = await dialog.showOpenDialog(mainWindow, {
    title: options.title || 'Select File',
    defaultPath: options.defaultPath,
    filters: options.filters || [{ name: 'All Files', extensions: ['*'] }],
    properties: ['openFile'],
  });
  if (result.canceled || result.filePaths.length === 0) return null;
  return result.filePaths[0];
});

