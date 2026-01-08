/* eslint-disable @typescript-eslint/no-var-requires */
import * as vscode from 'vscode';
import * as path from 'path';
import { ProjaxDataProvider } from './ConnectionManager';
import { Project } from '../types';

export class WorkspaceDetector {
  private provider: ProjaxDataProvider | null = null;
  private currentProject: Project | null = null;
  private onProjectChangeCallbacks: Array<(project: Project | null) => void> = [];

  constructor(provider: ProjaxDataProvider) {
    this.provider = provider;
  }

  /**
   * Update the provider (when connection changes)
   */
  setProvider(provider: ProjaxDataProvider): void {
    this.provider = provider;
    this.detectCurrentProject();
  }

  /**
   * Detect if current workspace is a PROJAX project
   */
  async detectCurrentProject(): Promise<Project | null> {
    const logger = require('../utils/logger').getLogger();
    
    if (!this.provider) {
      logger.warn('[WorkspaceDetector] No provider available');
      return null;
    }

    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      logger.info('[WorkspaceDetector] No workspace folders open');
      this.currentProject = null;
      this.notifyCallbacks();
      return null;
    }

    // Use the first workspace folder
    const workspacePath = workspaceFolders[0].uri.fsPath;
    const normalizedPath = path.normalize(workspacePath);
    logger.info(`[WorkspaceDetector] Checking workspace: ${normalizedPath}`);

    try {
      const projects = await this.provider.getProjects();
      logger.info(`[WorkspaceDetector] Found ${projects.length} projects in PROJAX`);
      
      const project = projects.find(p => {
        const projectPath = path.normalize(p.path);
        const matches = projectPath === normalizedPath || normalizedPath.startsWith(projectPath + path.sep);
        logger.info(`[WorkspaceDetector] Comparing "${p.name}": ${projectPath} === ${normalizedPath} ? ${matches}`);
        return matches;
      });

      this.currentProject = project || null;
      if (project) {
        logger.info(`[WorkspaceDetector] ✓ Matched project: ${project.name} (ID: ${project.id})`);
      } else {
        logger.info('[WorkspaceDetector] ✗ No matching project found');
      }
      
      this.notifyCallbacks();
      return this.currentProject;
    } catch (error) {
      logger.error('[WorkspaceDetector] Error detecting project', error as Error);
      this.currentProject = null;
      this.notifyCallbacks();
      return null;
    }
  }

  /**
   * Get current detected project
   */
  getCurrentProject(): Project | null {
    return this.currentProject;
  }

  /**
   * Subscribe to project changes
   */
  onProjectChange(callback: (project: Project | null) => void): vscode.Disposable {
    this.onProjectChangeCallbacks.push(callback);
    return new vscode.Disposable(() => {
      const index = this.onProjectChangeCallbacks.indexOf(callback);
      if (index > -1) {
        this.onProjectChangeCallbacks.splice(index, 1);
      }
    });
  }

  /**
   * Notify all callbacks of project change
   */
  private notifyCallbacks(): void {
    for (const callback of this.onProjectChangeCallbacks) {
      callback(this.currentProject);
    }
  }

  /**
   * Watch for workspace changes
   */
  watchWorkspaceChanges(): vscode.Disposable {
    const disposable = vscode.workspace.onDidChangeWorkspaceFolders(() => {
      this.detectCurrentProject();
    });

    return disposable;
  }
}

