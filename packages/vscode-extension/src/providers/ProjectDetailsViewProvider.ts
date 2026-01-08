/* eslint-disable @typescript-eslint/no-var-requires */
import * as vscode from 'vscode';
import * as fs from 'fs';
import { ProjaxDataProvider } from '../services/ConnectionManager';
import { WorkspaceDetector } from '../services/WorkspaceDetector';
import { ProjectsViewProvider } from './ProjectsViewProvider';
import { Project } from '../types';
import { getScriptRunner, RunningProcess } from '../services/ScriptRunner';

export class ProjectDetailsViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'projax.details';

  private _view?: vscode.WebviewView;
  private provider: ProjaxDataProvider;
  private workspaceDetector: WorkspaceDetector;
  private projectsProvider: ProjectsViewProvider;
  private currentProject: Project | null = null;
  private refreshInterval: NodeJS.Timeout | null = null;

  constructor(
    private readonly _extensionUri: vscode.Uri,
    provider: ProjaxDataProvider,
    workspaceDetector: WorkspaceDetector,
    projectsProvider: ProjectsViewProvider
  ) {
    this.provider = provider;
    this.workspaceDetector = workspaceDetector;
    this.projectsProvider = projectsProvider;

    // Listen for workspace changes
    workspaceDetector.onProjectChange((project) => {
      this.setProject(project);
    });

    // Start polling for running processes
    this.startPolling();
  }

  public setProvider(provider: ProjaxDataProvider): void {
    this.provider = provider;
    this.refresh();
  }

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    webviewView.webview.onDidReceiveMessage(async (message) => {
      switch (message.command) {
        case 'editName':
          await this.handleEditName(message.projectId, message.name);
          break;
        case 'editDescription':
          await this.handleEditDescription(message.projectId, message.description);
          break;
        case 'editTags':
          await this.handleEditTags(message.projectId, message.tags);
          break;
        case 'runScript':
          await this.handleRunScript(message.projectPath, message.scriptName);
          break;
        case 'stopScript':
          await this.handleStopScript(message.pid);
          break;
        case 'openUrl':
          await this.handleOpenUrl(message.url);
          break;
        case 'openInEditor':
          await this.handleOpenInEditor(message.projectPath);
          break;
        case 'scanProject':
          await this.handleScanProject(message.projectId);
          break;
        case 'deleteProject':
          await this.handleDeleteProject(message.projectId);
          break;
        case 'getScripts':
          if (message.projectPath) {
            await this.handleGetScripts(message.projectPath);
          }
          break;
      }
    });

    // Load current workspace project if it was already detected
    // This happens when the webview is created after workspace detection
    if (!this.currentProject) {
      const detectedProject = this.workspaceDetector.getCurrentProject();
      if (detectedProject) {
        this.currentProject = detectedProject;
      }
    }
    
    // Initial load - this will show current project or "no project selected"
    this.refresh();
  }

  private async handleEditName(projectId: number, name: string): Promise<void> {
    try {
      await this.provider.updateProject(projectId, { name });
      await this.refresh();
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to update name: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async handleEditDescription(projectId: number, description: string | null): Promise<void> {
    try {
      await this.provider.updateProject(projectId, { description });
      await this.refresh();
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to update description: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async handleEditTags(projectId: number, tags: string[]): Promise<void> {
    try {
      await this.provider.updateProject(projectId, { tags });
      await this.refresh();
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to update tags: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async handleRunScript(projectPath: string, scriptName: string): Promise<void> {
    try {
      const scriptRunner = getScriptRunner();
      await scriptRunner.runScript(projectPath, scriptName, true);
      await this.refresh();
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to run script: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async handleStopScript(pid: number): Promise<void> {
    try {
      const scriptRunner = getScriptRunner();
      await scriptRunner.stopScript(pid);
      await this.refresh();
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to stop script: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async handleOpenUrl(url: string): Promise<void> {
    try {
      await vscode.env.openExternal(vscode.Uri.parse(url));
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to open URL: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async handleOpenInEditor(projectPath: string): Promise<void> {
    try {
      const projectUri = vscode.Uri.file(projectPath);
      await vscode.commands.executeCommand('vscode.openFolder', projectUri, false);
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to open in editor: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async handleScanProject(projectId: number): Promise<void> {
    try {
      await this.provider.scanProject(projectId);
      vscode.window.showInformationMessage('Project scanned successfully');
      await this.refresh();
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to scan project: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async handleDeleteProject(projectId: number): Promise<void> {
    const project = await this.provider.getProject(projectId);
    if (!project) {
      return;
    }

    const confirmed = await vscode.window.showWarningMessage(
      `Are you sure you want to remove "${project.name}"?\n\nThis will delete the project from PROJAX (not from your filesystem).\n\nThis action cannot be undone.`,
      { modal: true },
      'Delete'
    );

    if (confirmed === 'Delete') {
      try {
        await this.provider.removeProject(projectId);
        vscode.window.showInformationMessage(`Removed project: ${project.name}`);
        this.currentProject = null;
        await this.refresh();
        this.projectsProvider.refresh();
      } catch (error) {
        vscode.window.showErrorMessage(`Failed to delete project: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  private async handleGetScripts(projectPath: string): Promise<void> {
    try {
      const scriptRunner = getScriptRunner();
      const scripts = await scriptRunner.getProjectScripts(projectPath);
      if (this._view) {
        this._view.webview.postMessage({
          command: 'updateScripts',
          scripts,
        });
      }
    } catch (error) {
      // Silently fail - scripts are optional
    }
  }

  public setProject(project: Project | null): void {
    this.currentProject = project;
    // Refresh to load project data - this works even if view hasn't loaded yet
    this.refresh();
  }

  private startPolling(): void {
    const config = vscode.workspace.getConfiguration('projax');
    const interval = config.get<number>('refreshInterval', 5000);

    this.refreshInterval = setInterval(() => {
      if (this.currentProject) {
        this.updateRunningProcesses();
      }
    }, interval);
  }

  private async updateRunningProcesses(): Promise<void> {
    if (!this._view || !this.currentProject) {
      return;
    }

    try {
      const scriptRunner = getScriptRunner();
      const processes = scriptRunner.getRunningProcessesForProject(this.currentProject.path);
      this._view.webview.postMessage({
        command: 'updateRunningProcesses',
        processes,
      });
    } catch (error) {
      // Silently fail
    }
  }

  public async refresh(): Promise<void> {
    const logger = require('../utils/logger').getLogger();
    
    if (!this._view) {
      logger.info('[ProjectDetails] View not ready yet');
      return;
    }

    if (!this.currentProject) {
      logger.info('[ProjectDetails] No current project set, checking detector...');
      // Check if workspace detector has a current project we haven't loaded yet
      const detectedProject = this.workspaceDetector.getCurrentProject();
      if (detectedProject) {
        logger.info(`[ProjectDetails] Found detected project: ${detectedProject.name}`);
        this.currentProject = detectedProject;
      } else {
        logger.info('[ProjectDetails] No project detected, sending null');
        this._view.webview.postMessage({
          command: 'updateProject',
          project: null,
        });
        return;
      }
    }

    try {
      logger.info(`[ProjectDetails] Loading project: ${this.currentProject.name} (ID: ${this.currentProject.id})`);
      const project = await this.provider.getProject(this.currentProject.id);
      if (!project) {
        logger.warn('[ProjectDetails] Project not found in database');
        this.currentProject = null;
        this._view.webview.postMessage({
          command: 'updateProject',
          project: null,
        });
        return;
      }

      const tests = await this.provider.getTestsByProject(project.id);
      const ports = await this.provider.getProjectPorts(project.id);
      
      // Get all tags - handle errors gracefully
      let tags: string[] = [];
      try {
        tags = await this.provider.getAllTags();
      } catch (tagError) {
        logger.warn('[ProjectDetails] Failed to load tags, continuing without them');
        // Continue without tags
      }
      
      const scriptRunner = getScriptRunner();
      const scripts = await scriptRunner.getProjectScripts(project.path);
      const runningProcesses = scriptRunner.getRunningProcessesForProject(project.path);

      logger.info(`[ProjectDetails] Sending project data: ${project.name}, ${tests.length} tests, ${ports.length} ports`);
      this._view.webview.postMessage({
        command: 'updateProject',
        project,
        tests,
        ports,
        tags,
        scripts,
        runningProcesses,
      });
    } catch (error) {
      logger.error('[ProjectDetails] Failed to refresh', error as Error);
      vscode.window.showErrorMessage(`Failed to refresh project details: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private _getHtmlForWebview(webview: vscode.Webview): string {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'dist', 'webview', 'details.js')
    );
    
    // Discover and include all chunk files and CSS files
    const chunksDir = vscode.Uri.joinPath(this._extensionUri, 'dist', 'webview', 'chunks');
    const assetsDir = vscode.Uri.joinPath(this._extensionUri, 'dist', 'webview', 'assets');
    const chunksDirPath = chunksDir.fsPath;
    const assetsDirPath = assetsDir.fsPath;
    
    let chunkScripts = '';
    let cssLinks = '';
    
    // Load CSS files
    try {
      if (fs.existsSync(assetsDirPath)) {
        const cssFiles = fs.readdirSync(assetsDirPath)
          .filter(file => file.endsWith('.css'))
          .sort();
        
        for (const cssFile of cssFiles) {
          const cssUri = webview.asWebviewUri(
            vscode.Uri.joinPath(assetsDir, cssFile)
          );
          cssLinks += `        <link href="${cssUri}" rel="stylesheet">\n`;
        }
      }
    } catch (error) {
      console.warn('Could not read assets directory:', error);
    }
    
    // Load chunk JS files
    try {
      if (fs.existsSync(chunksDirPath)) {
        const chunkFiles = fs.readdirSync(chunksDirPath)
          .filter(file => file.endsWith('.js'))
          .sort();
        
        for (const chunkFile of chunkFiles) {
          const chunkUri = webview.asWebviewUri(
            vscode.Uri.joinPath(chunksDir, chunkFile)
          );
          chunkScripts += `        <script type="module" src="${chunkUri}"></script>\n`;
        }
      }
    } catch (error) {
      console.warn('Could not read chunks directory:', error);
    }

    return `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
${cssLinks}        <style>
          body {
            padding: 0;
            margin: 0;
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
          }
        </style>
      </head>
      <body>
        <div id="root"></div>
${chunkScripts}        <script type="module" src="${scriptUri}"></script>
      </body>
      </html>`;
  }

  dispose(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }
}

