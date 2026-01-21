import { contextBridge, ipcRenderer } from 'electron';
// Import types from core (types are compile-time only)
import type { Project, Test } from 'projax-core';

export interface ProjectScript {
  name: string;
  command: string;
  runner: string;
  projectType: string;
}

export interface ProjectScripts {
  type: string;
  scripts: ProjectScript[];
}

export interface ProjectPort {
  id: number;
  project_id: number;
  port: number;
  script_name: string | null;
  config_source: string;
  last_detected: number;
  created_at: number;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export interface ElectronAPI {
  getProjects: () => Promise<Project[]>;
  addProject: (path: string) => Promise<Project>;
  removeProject: (projectId: number) => Promise<void>;
  scanProject: (projectId: number) => Promise<{ project: Project; testsFound: number; tests: Test[] }>;
  scanAllProjects: () => Promise<Array<{ project: Project; testsFound: number; tests: Test[] }>>;
  getTests: (projectId: number) => Promise<Test[]>;
  selectDirectory: () => Promise<string | null>;
  minimizeWindow: () => Promise<void>;
  maximizeWindow: () => Promise<void>;
  closeWindow: () => Promise<void>;
  renameProject: (projectId: number, newName: string) => Promise<Project>;
  updateProject: (projectId: number, updates: { description?: string | null; tags?: string[] }) => Promise<Project>;
  getProjectScripts: (projectPath: string) => Promise<ProjectScripts>;
  runScript: (projectPath: string, scriptName: string, args?: string[], background?: boolean) => Promise<{ success: boolean; background: boolean }>;
  scanProjectPorts: (projectId: number) => Promise<ProjectPort[]>;
  scanAllPorts: () => Promise<Record<number, ProjectPort[]>>;
  getProjectPorts: (projectId: number) => Promise<ProjectPort[]>;
  getRunningProcesses: () => Promise<Array<{
    pid: number;
    projectPath: string;
    projectName: string;
    scriptName: string;
    command: string;
    startedAt: number;
    logFile: string;
    detectedUrls?: string[];
    detectedPorts?: number[];
  }>>;
  stopScript: (pid: number) => Promise<boolean>;
  stopProject: (projectPath: string) => Promise<number>;
  openUrl: (url: string) => Promise<void>;
  openInEditor: (projectPath: string) => Promise<void>;
  openInFiles: (projectPath: string) => Promise<void>;
  getSettings: () => Promise<{
    editor: { type: string; customPath?: string };
    browser: { type: string; customPath?: string };
  }>;
  saveSettings: (settings: {
    editor: { type: string; customPath?: string };
    browser: { type: string; customPath?: string };
  }) => Promise<void>;
  openExternal: (url: string) => void;
  watchProcessOutput: (pid: number) => Promise<{ success: boolean }>;
  unwatchProcessOutput: (pid: number) => Promise<{ success: boolean }>;
  onProcessOutput: (callback: (event: any, data: { pid: number; data: string }) => void) => void;
  onProcessExit: (callback: (event: any, data: { pid: number; code: number }) => void) => void;
  removeProcessOutputListener: (callback: (event: any, data: { pid: number; data: string }) => void) => void;
  removeProcessExitListener: (callback: (event: any, data: { pid: number; code: number }) => void) => void;
  getAppVersion: () => Promise<string>;
  getLatestTestResult: (projectId: number) => Promise<any | null>;
  getWorkspaces: () => Promise<any[]>;
  addWorkspace: (workspace: any) => Promise<any>;
  removeWorkspace: (workspaceId: number) => Promise<void>;
  createBackup: (outputPath: string) => Promise<{ success: boolean; backup_path: string }>;
  restoreBackup: (backupPath: string) => Promise<{ success: boolean }>;
  showSaveDialog: (options: any) => Promise<any>;
  showOpenDialog: (options: any) => Promise<any>;
  selectFile: (options: any) => Promise<string | null>;
  openWorkspace: (workspaceId: number) => Promise<void>;
}

contextBridge.exposeInMainWorld('electronAPI', {
  getProjects: () => ipcRenderer.invoke('get-projects'),
  addProject: (path: string) => ipcRenderer.invoke('add-project', path),
  removeProject: (projectId: number) => ipcRenderer.invoke('remove-project', projectId),
  scanProject: (projectId: number) => ipcRenderer.invoke('scan-project', projectId),
  scanAllProjects: () => ipcRenderer.invoke('scan-all-projects'),
  getTests: (projectId: number) => ipcRenderer.invoke('get-tests', projectId),
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  minimizeWindow: () => ipcRenderer.invoke('minimize-window'),
  maximizeWindow: () => ipcRenderer.invoke('maximize-window'),
  closeWindow: () => ipcRenderer.invoke('close-window'),
  renameProject: (projectId: number, newName: string) => ipcRenderer.invoke('rename-project', projectId, newName),
  updateProject: (projectId: number, updates: any) => ipcRenderer.invoke('update-project', projectId, updates),
  getProjectScripts: (projectPath: string) => ipcRenderer.invoke('get-project-scripts', projectPath),
  runScript: (projectPath: string, scriptName: string, args?: string[], background?: boolean) => ipcRenderer.invoke('run-script', projectPath, scriptName, args, background),
  scanProjectPorts: (projectId: number) => ipcRenderer.invoke('scan-project-ports', projectId),
  scanAllPorts: () => ipcRenderer.invoke('scan-all-ports'),
  getProjectPorts: (projectId: number) => ipcRenderer.invoke('get-project-ports', projectId),
  getRunningProcesses: () => ipcRenderer.invoke('get-running-processes'),
  stopScript: (pid: number) => ipcRenderer.invoke('stop-script', pid),
  stopProject: (projectPath: string) => ipcRenderer.invoke('stop-project', projectPath),
  openUrl: (url: string) => ipcRenderer.invoke('open-url', url),
  openInEditor: (projectPath: string) => ipcRenderer.invoke('open-in-editor', projectPath),
  openInFiles: (projectPath: string) => ipcRenderer.invoke('open-in-files', projectPath),
  openExternal: (url: string) => ipcRenderer.send('open-external-url', url),
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings: any) => ipcRenderer.invoke('save-settings', settings),
  watchProcessOutput: (pid: number) => ipcRenderer.invoke('watch-process-output', pid),
  unwatchProcessOutput: (pid: number) => ipcRenderer.invoke('unwatch-process-output', pid),
  onProcessOutput: (callback: any) => ipcRenderer.on('process-output', callback),
  onProcessExit: (callback: any) => ipcRenderer.on('process-exit', callback),
  removeProcessOutputListener: (callback: any) => ipcRenderer.removeListener('process-output', callback),
  removeProcessExitListener: (callback: any) => ipcRenderer.removeListener('process-exit', callback),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  getLatestTestResult: (projectId: number) => ipcRenderer.invoke('get-latest-test-result', projectId),
  getWorkspaces: () => ipcRenderer.invoke('get-workspaces'),
  addWorkspace: (workspace: any) => ipcRenderer.invoke('add-workspace', workspace),
  removeWorkspace: (workspaceId: number) => ipcRenderer.invoke('remove-workspace', workspaceId),
  createBackup: (outputPath: string) => ipcRenderer.invoke('create-backup', outputPath),
  restoreBackup: (backupPath: string) => ipcRenderer.invoke('restore-backup', backupPath),
  showSaveDialog: (options: any) => ipcRenderer.invoke('show-save-dialog', options),
  showOpenDialog: (options: any) => ipcRenderer.invoke('show-open-dialog', options),
    selectFile: (options: any) => ipcRenderer.invoke('select-file', options),
    openWorkspace: (workspaceId: number) => ipcRenderer.invoke('open-workspace', workspaceId),
} as ElectronAPI);

