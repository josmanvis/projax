import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { ProjaxDataProvider } from '../services/ConnectionManager';
import { WorkspaceDetector } from '../services/WorkspaceDetector';
import { Project } from '../types';
import { ProjectDetailsViewProvider } from './ProjectDetailsViewProvider';

export class ProjectsViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'projax.projects';

  private _view?: vscode.WebviewView;
  private provider: ProjaxDataProvider;
  private workspaceDetector: WorkspaceDetector;
  private selectedProject: Project | null = null;
  private detailsProvider: ProjectDetailsViewProvider | null = null;

  constructor(
    private readonly _extensionUri: vscode.Uri,
    provider: ProjaxDataProvider,
    workspaceDetector: WorkspaceDetector,
    detailsProvider?: ProjectDetailsViewProvider
  ) {
    this.provider = provider;
    this.workspaceDetector = workspaceDetector;
    this.detailsProvider = detailsProvider || null;

    // Listen for workspace changes
    workspaceDetector.onProjectChange((project) => {
      this.updateCurrentProject(project);
    });
  }

  public setDetailsProvider(detailsProvider: ProjectDetailsViewProvider): void {
    this.detailsProvider = detailsProvider;
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
        case 'searchProjects':
          await this.handleSearch(message.query);
          break;
        case 'openProject':
          await this.openProject(message.project);
          break;
        case 'selectCurrentProject':
          // Auto-select and show details for current project
          if (message.projectId) {
            const project = await this.provider.getProject(message.projectId);
            if (project && this.detailsProvider) {
              this.selectedProject = project;
              this.detailsProvider.setProject(project);
            }
          }
          break;
        case 'refreshProjects':
          await this.refresh();
          break;
        case 'addProject':
          await this.handleAddProject();
          break;
        case 'openWorkspace':
          await this.openWorkspace(message.workspace);
          break;
      }
    });

    // Initial load
    this.refresh();
  }

  private async handleSearch(query: string): Promise<void> {
    await this.refresh();
  }

  public async openProject(project: Project): Promise<void> {
    const config = vscode.workspace.getConfiguration('projax');
    const preferredMode = config.get<string>('preferredOpenMode', 'ask');

    let action: string;
    if (preferredMode === 'ask') {
      const items = [
        { label: '$(window) New Window', description: 'Open in a new window', action: 'newWindow' },
        { label: '$(folder-opened) Current Window', description: 'Open in current window', action: 'currentWindow' },
        { label: '$(add) Add to Workspace', description: 'Add to current workspace', action: 'addToWorkspace' },
      ];
      const selected = await vscode.window.showQuickPick(items, {
        placeHolder: `How would you like to open "${project.name}"?`,
      });
      if (!selected) {
        return;
      }
      action = selected.action;
    } else {
      action = preferredMode;
    }

    const projectUri = vscode.Uri.file(project.path);

    try {
      switch (action) {
        case 'newWindow':
          await vscode.commands.executeCommand('vscode.openFolder', projectUri, true);
          break;
        case 'currentWindow':
          await vscode.commands.executeCommand('vscode.openFolder', projectUri, false);
          break;
        case 'addToWorkspace':
          {
            const workspaceFolders = vscode.workspace.workspaceFolders || [];
            if (workspaceFolders.length === 0) {
              // No workspace, just open it
              await vscode.commands.executeCommand('vscode.openFolder', projectUri, false);
            } else {
              // Add to existing workspace
              vscode.workspace.updateWorkspaceFolders(workspaceFolders.length, 0, { uri: projectUri });
            }
          }
          break;
      }
      this.selectedProject = project;
      this.updateSelectedProject();
      // Notify details provider
      if (this.detailsProvider) {
        this.detailsProvider.setProject(project);
      }
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to open project: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async openWorkspace(workspace: any): Promise<void> {
    const config = vscode.workspace.getConfiguration('projax');
    const preferredMode = config.get<string>('preferredOpenMode', 'ask');

    let action: string;
    if (preferredMode === 'ask') {
      const items = [
        { label: '$(window) New Window', description: 'Open in a new window', action: 'newWindow' },
        { label: '$(folder-opened) Current Window', description: 'Open in current window', action: 'currentWindow' },
        { label: '$(add) Add to Workspace', description: 'Add to current workspace', action: 'addToWorkspace' },
      ];
      const selected = await vscode.window.showQuickPick(items, {
        placeHolder: 'How would you like to open this workspace?',
      });
      if (!selected) return;
      action = selected.action;
    } else {
      action = preferredMode;
    }

    const workspaceUri = vscode.Uri.file(workspace.workspace_file_path);
    
    if (!fs.existsSync(workspace.workspace_file_path)) {
      vscode.window.showErrorMessage(`Workspace file not found: ${workspace.workspace_file_path}`);
      return;
    }

    try {
      if (action === 'newWindow') {
        await vscode.commands.executeCommand('vscode.openFolder', workspaceUri, true);
      } else if (action === 'addToWorkspace') {
        await vscode.commands.executeCommand('vscode.openFolder', workspaceUri, false);
      } else {
        // currentWindow
        await vscode.commands.executeCommand('vscode.openFolder', workspaceUri, false);
      }
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to open workspace: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async handleAddProject(): Promise<void> {
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
        value: path.basename(folderPath),
      });
      if (name) {
        try {
          await this.provider.addProject(name, folderPath);
          vscode.window.showInformationMessage(`Added project: ${name}`);
          await this.refresh();
        } catch (error) {
          vscode.window.showErrorMessage(`Failed to add project: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    }
  }

  private updateCurrentProject(project: Project | null): void {
    if (this._view) {
      this._view.webview.postMessage({
        command: 'updateCurrentProject',
        project: project ? { id: project.id, path: project.path } : null,
      });
    }
  }

  private updateSelectedProject(): void {
    if (this._view) {
      this._view.webview.postMessage({
        command: 'updateSelectedProject',
        project: this.selectedProject ? { id: this.selectedProject.id } : null,
      });
    }
  }

  public async refresh(): Promise<void> {
    if (!this._view) {
      return;
    }

    try {
      const projects = await this.provider.getProjects();
      
      // Re-detect current project in case it wasn't detected yet
      await this.workspaceDetector.detectCurrentProject();
      const currentProject = this.workspaceDetector.getCurrentProject();

      this._view.webview.postMessage({
        command: 'updateProjects',
        projects,
        currentProject: currentProject ? { id: currentProject.id, path: currentProject.path } : null,
      });
      
      // If there's a current project and details provider, update it
      if (currentProject && this.detailsProvider) {
        this.detailsProvider.setProject(currentProject);
      }
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to refresh projects: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private _getHtmlForWebview(webview: vscode.Webview): string {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'dist', 'webview', 'projects.js')
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
}

