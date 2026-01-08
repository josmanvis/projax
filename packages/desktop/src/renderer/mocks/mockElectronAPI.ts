import { ElectronAPI } from '../../main/preload';
import {
  mockProjects,
  mockWorkspaces,
  mockRunningProcesses,
  mockProjectScripts,
  mockProjectPorts,
  mockTests,
} from './mockData';

// In-memory state for mocks (simulates database)
const projects = [...mockProjects];
const workspaces = [...mockWorkspaces];
const runningProcesses = [...mockRunningProcesses];
const projectPorts = new Map<number, typeof mockProjectPorts>();
projectPorts.set(1, mockProjectPorts);

// Helper to delay responses (simulate network latency)
const delay = (ms: number = 300) => new Promise(resolve => setTimeout(resolve, ms));

export const createMockElectronAPI = (): ElectronAPI => {
  return {
    getProjects: async () => {
      await delay();
      return [...projects];
    },

    addProject: async (path: string) => {
      await delay();
      const newProject = {
        id: Math.max(...projects.map(p => p.id), 0) + 1,
        name: path.split('/').pop() || 'New Project',
        path,
        description: null,
        tags: [],
        framework: null,
        last_scanned: null,
        created_at: Date.now(),
      };
      projects.push(newProject);
      return newProject;
    },

    removeProject: async (projectId: number) => {
      await delay();
      projects = projects.filter(p => p.id !== projectId);
    },

    scanProject: async (projectId: number) => {
      await delay(1000);
      const project = projects.find(p => p.id === projectId);
      if (!project) throw new Error('Project not found');
      return {
        project,
        testsFound: mockTests.filter(t => t.project_id === projectId).length,
        tests: mockTests.filter(t => t.project_id === projectId),
      };
    },

    scanAllProjects: async () => {
      await delay(2000);
      return projects.map(project => ({
        project,
        testsFound: mockTests.filter(t => t.project_id === project.id).length,
        tests: mockTests.filter(t => t.project_id === project.id),
      }));
    },

    getTests: async (projectId: number) => {
      await delay();
      return mockTests.filter(t => t.project_id === projectId);
    },

    selectDirectory: async () => {
      await delay();
      // In browser, we can use a simple prompt or return a mock path
      const path = prompt('Enter a project path (mock):');
      return path || null;
    },

    minimizeWindow: async () => {
      console.log('[MOCK] minimizeWindow');
    },

    maximizeWindow: async () => {
      console.log('[MOCK] maximizeWindow');
    },

    closeWindow: async () => {
      console.log('[MOCK] closeWindow');
    },

    renameProject: async (projectId: number, newName: string) => {
      await delay();
      const project = projects.find(p => p.id === projectId);
      if (!project) throw new Error('Project not found');
      project.name = newName;
      return { ...project };
    },

    updateProject: async (projectId: number, updates: { description?: string | null }) => {
      await delay();
      const project = projects.find(p => p.id === projectId);
      if (!project) throw new Error('Project not found');
      if (updates.description !== undefined) {
        project.description = updates.description;
      }
      return { ...project };
    },

    getProjectScripts: async (projectPath: string) => {
      await delay();
      return mockProjectScripts;
    },

    runScript: async (projectPath: string, scriptName: string, args?: string[], background?: boolean) => {
      await delay(500);
      const project = projects.find(p => p.path === projectPath);
      if (background) {
        const newProcess = {
          pid: Math.floor(Math.random() * 90000) + 10000,
          projectPath,
          projectName: project?.name || 'Unknown',
          scriptName,
          command: `npm run ${scriptName}`,
          startedAt: Date.now(),
          logFile: `/tmp/projax-${Date.now()}.log`,
          detectedUrls: [],
          detectedPorts: [],
        };
        runningProcesses.push(newProcess);
      }
      return { success: true, background: background || false };
    },

    scanProjectPorts: async (projectId: number) => {
      await delay(1000);
      return projectPorts.get(projectId) || [];
    },

    scanAllPorts: async () => {
      await delay(2000);
      const result: Record<number, typeof mockProjectPorts> = {};
      projectPorts.forEach((ports, projectId) => {
        result[projectId] = ports;
      });
      return result;
    },

    getProjectPorts: async (projectId: number) => {
      await delay();
      return projectPorts.get(projectId) || [];
    },

    getRunningProcesses: async () => {
      await delay();
      return [...runningProcesses];
    },

    stopScript: async (pid: number) => {
      await delay();
      runningProcesses = runningProcesses.filter(p => p.pid !== pid);
      return true;
    },

    stopProject: async (projectPath: string) => {
      await delay();
      const count = runningProcesses.filter(p => p.projectPath === projectPath).length;
      runningProcesses = runningProcesses.filter(p => p.projectPath !== projectPath);
      return count;
    },

    openUrl: async (url: string) => {
      console.log('[MOCK] openUrl:', url);
      window.open(url, '_blank');
    },

    openInEditor: async (projectPath: string) => {
      console.log('[MOCK] openInEditor:', projectPath);
    },

    openInFiles: async (projectPath: string) => {
      console.log('[MOCK] openInFiles:', projectPath);
    },

    getSettings: async () => {
      await delay();
      return {
        editor: { type: 'vscode' },
        browser: { type: 'default' },
      };
    },

    saveSettings: async (settings: any) => {
      await delay();
      console.log('[MOCK] saveSettings:', settings);
    },

    openExternal: (url: string) => {
      window.open(url, '_blank');
    },

    watchProcessOutput: async (pid: number) => {
      console.log('[MOCK] watchProcessOutput:', pid);
      return { success: true };
    },

    unwatchProcessOutput: async (pid: number) => {
      console.log('[MOCK] unwatchProcessOutput:', pid);
      return { success: true };
    },

    onProcessOutput: (callback: any) => {
      // Mock: simulate some output after a delay
      setTimeout(() => {
        if (runningProcesses.length > 0) {
          callback(null, {
            pid: runningProcesses[0].pid,
            data: '[MOCK] Process output line\n',
          });
        }
      }, 2000);
    },

    onProcessExit: (callback: any) => {
      // Mock: simulate process exit after some time
      setTimeout(() => {
        if (runningProcesses.length > 0) {
          callback(null, {
            pid: runningProcesses[0].pid,
            code: 0,
          });
        }
      }, 10000);
    },

    removeProcessOutputListener: (callback: any) => {
      console.log('[MOCK] removeProcessOutputListener');
    },

    removeProcessExitListener: (callback: any) => {
      console.log('[MOCK] removeProcessExitListener');
    },

    getAppVersion: async () => {
      await delay();
      return '3.3.38';
    },

    getLatestTestResult: async (projectId: number) => {
      await delay();
      return {
        id: 1,
        project_id: projectId,
        passed: 10,
        failed: 2,
        skipped: 1,
        duration: 1234,
        timestamp: Date.now(),
      };
    },

    getWorkspaces: async () => {
      await delay();
      return [...workspaces];
    },

    addWorkspace: async (workspace: any) => {
      await delay();
      const newWorkspace = {
        id: Math.max(...workspaces.map(w => w.id), 0) + 1,
        ...workspace,
        created_at: Date.now(),
      };
      workspaces.push(newWorkspace);
      return newWorkspace;
    },

    removeWorkspace: async (workspaceId: number) => {
      await delay();
      workspaces = workspaces.filter(w => w.id !== workspaceId);
    },

    createBackup: async (outputPath: string) => {
      await delay(1000);
      return { success: true, backup_path: outputPath };
    },

    restoreBackup: async (backupPath: string) => {
      await delay(1000);
      return { success: true };
    },

    showSaveDialog: async (options: any) => {
      await delay();
      return { canceled: false, filePath: '/tmp/backup.json' };
    },

    showOpenDialog: async (options: any) => {
      await delay();
      return { canceled: false, filePaths: ['/tmp/backup.json'] };
    },

    selectFile: async (options: any) => {
      await delay();
      return '/tmp/selected-file.json';
    },
  };
};

