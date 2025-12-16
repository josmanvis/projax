/* eslint-disable @typescript-eslint/no-var-requires */
import * as vscode from 'vscode';
import * as path from 'path';
import { getConnectionManager } from './services/ConnectionManager';
import { getLogger } from './utils/logger';
import { WorkspaceDetector } from './services/WorkspaceDetector';
import { ProjectsViewProvider } from './providers/ProjectsViewProvider';
import { ProjectDetailsViewProvider } from './providers/ProjectDetailsViewProvider';

let workspaceDetector: WorkspaceDetector | null = null;
let projectsProvider: ProjectsViewProvider | null = null;
let detailsProvider: ProjectDetailsViewProvider | null = null;

export async function activate(context: vscode.ExtensionContext) {
  const logger = getLogger();
  logger.info('PROJAX extension activating...');

  // Get configuration
  const config = vscode.workspace.getConfiguration('projax');
  const manualPort = config.get<number | null>('apiPort') || undefined;

  // Initialize connection
  const connectionManager = getConnectionManager();
  let provider;
  try {
    provider = await connectionManager.connect(manualPort);
    const mode = connectionManager.getMode();
    logger.info(`Connected to PROJAX (mode: ${mode})`);
  } catch (error) {
    logger.error('Failed to connect to PROJAX', error as Error);
    vscode.window.showErrorMessage('Failed to connect to PROJAX. Check the output panel for details.');
    return;
  }

  // Initialize workspace detector
  workspaceDetector = new WorkspaceDetector(provider);
  
  // Initialize view providers
  projectsProvider = new ProjectsViewProvider(context.extensionUri, provider, workspaceDetector);
  detailsProvider = new ProjectDetailsViewProvider(context.extensionUri, provider, workspaceDetector, projectsProvider);
  // Link them together
  projectsProvider.setDetailsProvider(detailsProvider);
  
  // Detect current project and notify details provider
  logger.info('Detecting current workspace project...');
  const currentProject = await workspaceDetector.detectCurrentProject();
  if (currentProject) {
    logger.info(`Current workspace project detected: ${currentProject.name} (ID: ${currentProject.id})`);
    detailsProvider.setProject(currentProject);
  } else {
    logger.info('No current workspace project detected');
  }
  
  workspaceDetector.watchWorkspaceChanges();

  // Register webview providers
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider('projax.projects', projectsProvider)
  );
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider('projax.details', detailsProvider)
  );

  // Register commands
  context.subscriptions.push(
    vscode.commands.registerCommand('projax.openProject', async () => {
      if (!projectsProvider) {
        return;
      }
      const projects = await provider.getProjects();
      if (projects.length === 0) {
        vscode.window.showInformationMessage('No projects found in PROJAX.');
        return;
      }
      const items = projects.map(p => ({
        label: p.name,
        description: p.path,
        project: p,
      }));
      const selected = await vscode.window.showQuickPick(items, {
        placeHolder: 'Select a project to open',
      });
      if (selected) {
        await projectsProvider.openProject(selected.project);
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('projax.addProject', async () => {
      const folders = await vscode.window.showOpenDialog({
        canSelectFiles: false,
        canSelectFolders: true,
        canSelectMany: false,
        openLabel: 'Add to PROJAX',
      });
      if (folders && folders.length > 0) {
        const folderPath = folders[0].fsPath;
        const name = await vscode.window.showInputBox({
          prompt: 'Enter project name',
          value: require('path').basename(folderPath),
        });
        if (name) {
          try {
            await provider.addProject(name, folderPath);
            vscode.window.showInformationMessage(`Added project: ${name}`);
            if (projectsProvider) {
              projectsProvider.refresh();
            }
          } catch (error) {
            vscode.window.showErrorMessage(`Failed to add project: ${error instanceof Error ? error.message : String(error)}`);
          }
        }
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('projax.refreshProjects', () => {
      if (projectsProvider) {
        projectsProvider.refresh();
      }
      if (detailsProvider) {
        detailsProvider.refresh();
      }
      workspaceDetector?.detectCurrentProject();
      vscode.window.showInformationMessage('Projects refreshed');
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('projax.scanProject', async () => {
      if (!projectsProvider) {
        return;
      }
      const projects = await provider.getProjects();
      if (projects.length === 0) {
        vscode.window.showInformationMessage('No projects found in PROJAX.');
        return;
      }
      const items = projects.map(p => ({
        label: p.name,
        description: p.path,
        project: p,
      }));
      const selected = await vscode.window.showQuickPick(items, {
        placeHolder: 'Select a project to scan',
      });
      if (selected) {
        try {
          await provider.scanProject(selected.project.id);
          vscode.window.showInformationMessage(`Scanned project: ${selected.project.name}`);
          if (detailsProvider) {
            detailsProvider.refresh();
          }
        } catch (error) {
          vscode.window.showErrorMessage(`Failed to scan project: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('projax.scanAllProjects', async () => {
      try {
        await provider.scanAllProjects();
        vscode.window.showInformationMessage('Scanned all projects');
        if (detailsProvider) {
          detailsProvider.refresh();
        }
      } catch (error) {
        vscode.window.showErrorMessage(`Failed to scan projects: ${error instanceof Error ? error.message : String(error)}`);
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('projax.openSettings', () => {
      vscode.commands.executeCommand('workbench.action.openSettings', '@ext:projax');
    })
  );

  // Add current workspace to PROJAX
  context.subscriptions.push(
    vscode.commands.registerCommand('projax.addCurrentProject', async () => {
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders || workspaceFolders.length === 0) {
        vscode.window.showWarningMessage('No workspace folder open');
        return;
      }
      const folderPath = workspaceFolders[0].uri.fsPath;
      const name = await vscode.window.showInputBox({
        prompt: 'Enter project name',
        value: require('path').basename(folderPath),
      });
      if (name) {
        try {
          await provider.addProject(name, folderPath);
          vscode.window.showInformationMessage(`Added "${name}" to PROJAX`);
          if (projectsProvider) {
            projectsProvider.refresh();
          }
          if (workspaceDetector) {
            await workspaceDetector.detectCurrentProject();
          }
        } catch (error) {
          vscode.window.showErrorMessage(`Failed to add project: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    })
  );

  // Remove current project from PROJAX
  context.subscriptions.push(
    vscode.commands.registerCommand('projax.removeCurrentProject', async () => {
      const currentProject = workspaceDetector?.getCurrentProject();
      if (!currentProject) {
        vscode.window.showWarningMessage('Current workspace is not a PROJAX project');
        return;
      }
      const confirm = await vscode.window.showWarningMessage(
        `Remove "${currentProject.name}" from PROJAX?`,
        { modal: true },
        'Remove'
      );
      if (confirm === 'Remove') {
        try {
          await provider.removeProject(currentProject.id);
          vscode.window.showInformationMessage(`Removed "${currentProject.name}" from PROJAX`);
          if (projectsProvider) {
            projectsProvider.refresh();
          }
          if (detailsProvider) {
            detailsProvider.refresh();
          }
          if (workspaceDetector) {
            await workspaceDetector.detectCurrentProject();
          }
        } catch (error) {
          vscode.window.showErrorMessage(`Failed to remove project: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    })
  );

  // Open current project in PROJAX Desktop
  context.subscriptions.push(
    vscode.commands.registerCommand('projax.openInDesktop', async () => {
      const currentProject = workspaceDetector?.getCurrentProject();
      if (!currentProject) {
        vscode.window.showWarningMessage('Current workspace is not a PROJAX project. Add it first with "PROJAX: Add Current Workspace to PROJAX"');
        return;
      }
      try {
        // Try to open the desktop app with the project
        const apiStatus = await connectionManager.getMode();
        if (apiStatus === 'api') {
          // API is running, which means the desktop app might be running
          vscode.window.showInformationMessage(`Opening "${currentProject.name}" in PROJAX Desktop...`);
          // The desktop app should already be showing this project if it's running
          // TODO: In the future, we could send a message to the desktop app to focus this project
        } else {
          vscode.window.showWarningMessage('PROJAX Desktop app is not running. Start it with: prx web');
        }
      } catch (error) {
        vscode.window.showErrorMessage(`Failed to open in desktop: ${error instanceof Error ? error.message : String(error)}`);
      }
    })
  );

  // Run script
  context.subscriptions.push(
    vscode.commands.registerCommand('projax.runScript', async () => {
      const currentProject = workspaceDetector?.getCurrentProject();
      if (!currentProject) {
        vscode.window.showWarningMessage('Current workspace is not a PROJAX project');
        return;
      }
      try {
        const { getScriptRunner } = await import('./services/ScriptRunner');
        const scriptRunner = getScriptRunner();
        const projectScripts = await scriptRunner.getProjectScripts(currentProject.path);
        if (projectScripts.length === 0) {
          vscode.window.showInformationMessage('No scripts found in this project');
          return;
        }
        const items = projectScripts.map(s => ({
          label: s.name,
          description: s.command,
        }));
        const selected = await vscode.window.showQuickPick(items, {
          placeHolder: 'Select a script to run',
        });
        if (selected) {
          await scriptRunner.runScript(currentProject.path, selected.label);
          vscode.window.showInformationMessage(`Running script: ${selected.label}`);
          if (detailsProvider) {
            detailsProvider.refresh();
          }
        }
      } catch (error) {
        vscode.window.showErrorMessage(`Failed to run script: ${error instanceof Error ? error.message : String(error)}`);
      }
    })
  );

  // Stop all scripts
  context.subscriptions.push(
    vscode.commands.registerCommand('projax.stopAllScripts', async () => {
      const currentProject = workspaceDetector?.getCurrentProject();
      if (!currentProject) {
        vscode.window.showWarningMessage('Current workspace is not a PROJAX project');
        return;
      }
      try {
        const { getScriptRunner } = await import('./services/ScriptRunner');
        const scriptRunner = getScriptRunner();
        const runningProcesses = scriptRunner.getRunningProcessesForProject(currentProject.path);
        if (runningProcesses.length === 0) {
          vscode.window.showInformationMessage('No running processes for this project');
          return;
        }
        for (const process of runningProcesses) {
          await scriptRunner.stopScript(process.pid);
        }
        vscode.window.showInformationMessage(`Stopped ${runningProcesses.length} process(es)`);
        if (detailsProvider) {
          detailsProvider.refresh();
        }
      } catch (error) {
        vscode.window.showErrorMessage(`Failed to stop scripts: ${error instanceof Error ? error.message : String(error)}`);
      }
    })
  );

  // Show running processes
  context.subscriptions.push(
    vscode.commands.registerCommand('projax.showRunningProcesses', async () => {
      const currentProject = workspaceDetector?.getCurrentProject();
      if (!currentProject) {
        vscode.window.showWarningMessage('Current workspace is not a PROJAX project');
        return;
      }
      try {
        const { getScriptRunner } = await import('./services/ScriptRunner');
        const scriptRunner = getScriptRunner();
        const runningProcesses = scriptRunner.getRunningProcessesForProject(currentProject.path);
        if (runningProcesses.length === 0) {
          vscode.window.showInformationMessage('No running processes for this project');
          return;
        }
        const items = runningProcesses.map(p => ({
          label: `${p.scriptName} (PID: ${p.pid})`,
          description: p.projectName,
          pid: p.pid,
        }));
        const selected = await vscode.window.showQuickPick(items, {
          placeHolder: 'Select a process to stop',
        });
        if (selected) {
          await scriptRunner.stopScript(selected.pid);
          vscode.window.showInformationMessage(`Stopped process: ${selected.label}`);
          if (detailsProvider) {
            detailsProvider.refresh();
          }
        }
      } catch (error) {
        vscode.window.showErrorMessage(`Failed to show processes: ${error instanceof Error ? error.message : String(error)}`);
      }
    })
  );

  // Open workspace from PROJAX
  context.subscriptions.push(
    vscode.commands.registerCommand('projax.openWorkspace', async () => {
      try {
        const workspaces = await provider.getWorkspaces();
        if (workspaces.length === 0) {
          vscode.window.showInformationMessage('No workspaces found in PROJAX');
          return;
        }
        const items = workspaces.map(w => ({
          label: w.name,
          description: w.workspace_file_path,
          workspace: w,
        }));
        const selected = await vscode.window.showQuickPick(items, {
          placeHolder: 'Select a workspace to open',
        });
        if (selected) {
          const config = vscode.workspace.getConfiguration('projax');
          const preferredMode = config.get<'newWindow' | 'currentWindow' | 'addToWorkspace' | 'ask'>('preferredOpenMode', 'ask');
          
          let openMode: boolean | undefined;
          if (preferredMode === 'ask') {
            const modeItems = [
              { label: 'New Window', value: true },
              { label: 'Current Window', value: false },
            ];
            const modeSelected = await vscode.window.showQuickPick(modeItems, {
              placeHolder: 'How would you like to open this workspace?',
            });
            if (!modeSelected) return;
            openMode = modeSelected.value;
          } else {
            openMode = preferredMode === 'newWindow';
          }
          
          const workspaceUri = vscode.Uri.file(selected.workspace.workspace_file_path);
          await vscode.commands.executeCommand('vscode.openFolder', workspaceUri, openMode);
          vscode.window.showInformationMessage(`Opened workspace: ${selected.workspace.name}`);
        }
      } catch (error) {
        vscode.window.showErrorMessage(`Failed to open workspace: ${error instanceof Error ? error.message : String(error)}`);
      }
    })
  );

  // Create backup
  context.subscriptions.push(
    vscode.commands.registerCommand('projax.createBackup', async () => {
      try {
        const saveUri = await vscode.window.showSaveDialog({
          title: 'Save PROJAX Backup',
          defaultUri: vscode.Uri.file(`projax-backup-${new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-')}.pbz`),
          filters: { 'PROJAX Backup': ['pbz'] },
        });
        if (saveUri) {
          // Get API base URL from connection manager
          const apiBaseUrl = connectionManager.getMode() === 'api' 
            ? (provider as any).baseUrl || 'http://localhost:3001/api'
            : 'http://localhost:3001/api';
          const response = await fetch(`${apiBaseUrl}/backup/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ output_path: path.dirname(saveUri.fsPath) }),
          });
          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to create backup');
          }
          const result = await response.json();
          vscode.window.showInformationMessage(`Backup created: ${result.backup_path}`);
        }
      } catch (error) {
        vscode.window.showErrorMessage(`Failed to create backup: ${error instanceof Error ? error.message : String(error)}`);
      }
    })
  );

  // Restore backup
  context.subscriptions.push(
    vscode.commands.registerCommand('projax.restoreBackup', async () => {
      try {
        const confirm = await vscode.window.showWarningMessage(
          'This will overwrite your current PROJAX data. Continue?',
          { modal: true },
          'Continue'
        );
        if (confirm !== 'Continue') return;
        
        const openUri = await vscode.window.showOpenDialog({
          title: 'Select Backup File',
          filters: { 'PROJAX Backup': ['pbz'] },
          canSelectMany: false,
        });
        if (openUri && openUri.length > 0) {
          // Get API base URL from connection manager
          const apiBaseUrl = connectionManager.getMode() === 'api' 
            ? (provider as any).baseUrl || 'http://localhost:3001/api'
            : 'http://localhost:3001/api';
          const response = await fetch(`${apiBaseUrl}/backup/restore`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ backup_path: openUri[0].fsPath }),
          });
          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to restore backup');
          }
          vscode.window.showInformationMessage('Backup restored successfully! Please refresh the PROJAX views.');
          if (projectsProvider) projectsProvider.refresh();
          if (detailsProvider) detailsProvider.refresh();
        }
      } catch (error) {
        vscode.window.showErrorMessage(`Failed to restore backup: ${error instanceof Error ? error.message : String(error)}`);
      }
    })
  );

  // Open project URL
  context.subscriptions.push(
    vscode.commands.registerCommand('projax.openProjectUrl', async () => {
      const currentProject = workspaceDetector?.getCurrentProject();
      if (!currentProject) {
        vscode.window.showWarningMessage('Current workspace is not a PROJAX project');
        return;
      }
      try {
        const ports = await provider.getProjectPorts(currentProject.id);
        if (ports.length === 0) {
          vscode.window.showInformationMessage('No URLs detected for this project. Try running a script first.');
          return;
        }
        const items = ports.map(p => ({
          label: `${p.protocol}://${p.host}:${p.port}`,
          description: p.script_name || 'Unknown script',
          url: `${p.protocol}://${p.host}:${p.port}`,
        }));
        const selected = await vscode.window.showQuickPick(items, {
          placeHolder: 'Select a URL to open',
        });
        if (selected) {
          vscode.env.openExternal(vscode.Uri.parse(selected.url));
        }
      } catch (error) {
        vscode.window.showErrorMessage(`Failed to open URL: ${error instanceof Error ? error.message : String(error)}`);
      }
    })
  );

  // Watch for configuration changes
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration(async (e) => {
      if (e.affectsConfiguration('projax.apiPort')) {
        const config = vscode.workspace.getConfiguration('projax');
        const manualPort = config.get<number | null>('apiPort') || undefined;
        try {
          const newProvider = await connectionManager.reconnect(manualPort);
          workspaceDetector?.setProvider(newProvider);
          projectsProvider?.setProvider(newProvider);
          detailsProvider?.setProvider(newProvider);
          logger.info('Reconnected to PROJAX');
        } catch (error) {
          logger.error('Failed to reconnect', error as Error);
        }
      }
    })
  );

  logger.info('PROJAX extension activated');
}

export function deactivate() {
  const logger = getLogger();
  logger.info('PROJAX extension deactivating...');
  workspaceDetector = null;
  projectsProvider = null;
  detailsProvider = null;
}

