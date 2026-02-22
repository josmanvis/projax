import * as path from 'path';
import * as fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface WorktreeInfo {
  path: string;
  branch: string;
  taskId: number;
  projectId: number;
  createdAt: number;
}

export interface ConflictInfo {
  hasConflicts: boolean;
  files: string[];
  message: string;
}

export interface MergeResult {
  success: boolean;
  message: string;
  conflicts?: ConflictInfo;
}

/**
 * SandboxManager handles git worktree operations for task isolation.
 * Each task gets its own worktree, allowing multiple agents to work
 * on different tasks without affecting each other's code.
 */
export class SandboxManager {
  private projectPath: string;

  constructor(projectPath: string) {
    this.projectPath = projectPath;
  }

  /**
   * Create a new worktree for a task
   */
  async createTaskSandbox(taskId: number, taskTitle: string): Promise<WorktreeInfo> {
    const worktreeDir = path.join(this.projectPath, '.worktrees');
    const taskSlug = this.slugify(taskTitle);
    const branchName = `task/${taskId}-${taskSlug}`;
    const worktreePath = path.join(worktreeDir, `task-${taskId}`);

    // Ensure worktrees directory exists
    if (!fs.existsSync(worktreeDir)) {
      fs.mkdirSync(worktreeDir, { recursive: true });
    }

    // Check if worktree already exists
    if (fs.existsSync(worktreePath)) {
      throw new Error(`Worktree already exists at ${worktreePath}`);
    }

    try {
      // Create the worktree with a new branch
      await execAsync(`git worktree add -b ${branchName} ${worktreePath}`, {
        cwd: this.projectPath,
      });
    } catch (error: any) {
      // If branch already exists, checkout existing branch
      if (error.message.includes('already exists')) {
        await execAsync(`git worktree add ${worktreePath} ${branchName}`, {
          cwd: this.projectPath,
        });
      } else {
        throw new Error(`Failed to create worktree: ${error.message}`);
      }
    }

    return {
      path: worktreePath,
      branch: branchName,
      taskId,
      projectId: 0, // Will be set by caller
      createdAt: Date.now(),
    };
  }

  /**
   * Merge a task's worktree changes back to the main branch
   */
  async mergeSandbox(
    worktreePath: string,
    branchName: string,
    taskTitle: string
  ): Promise<MergeResult> {
    try {
      // Get current branch
      const { stdout: currentBranch } = await execAsync(
        'git rev-parse --abbrev-ref HEAD',
        { cwd: this.projectPath }
      );
      const mainBranch = currentBranch.trim() === branchName ? 'main' : currentBranch.trim();

      // Commit any pending changes in worktree
      try {
        await execAsync('git add -A', { cwd: worktreePath });
        await execAsync(`git commit -m "Complete task: ${taskTitle}"`, { cwd: worktreePath });
      } catch {
        // No changes to commit, continue
      }

      // Switch to main branch
      await execAsync(`git checkout ${mainBranch}`, { cwd: this.projectPath });

      // Try to merge
      try {
        await execAsync(`git merge ${branchName}`, { cwd: this.projectPath });
        
        // Clean up worktree and branch after successful merge
        await this.cleanupSandbox(worktreePath, branchName);

        return {
          success: true,
          message: `Successfully merged ${branchName} into ${mainBranch}`,
        };
      } catch (mergeError: any) {
        // Check for conflicts
        const conflicts = await this.detectConflicts();
        
        return {
          success: false,
          message: 'Merge failed due to conflicts',
          conflicts,
        };
      }
    } catch (error: any) {
      return {
        success: false,
        message: `Merge failed: ${error.message}`,
      };
    }
  }

  /**
   * Abort and cleanup a worktree without merging
   */
  async abortSandbox(worktreePath: string, branchName: string): Promise<void> {
    await this.cleanupSandbox(worktreePath, branchName);
  }

  /**
   * Detect merge conflicts
   */
  async detectConflicts(): Promise<ConflictInfo> {
    try {
      const { stdout } = await execAsync('git diff --name-only --diff-filter=U', {
        cwd: this.projectPath,
      });

      const files = stdout.trim().split('\n').filter(Boolean);

      return {
        hasConflicts: files.length > 0,
        files,
        message: files.length > 0
          ? `Found conflicts in ${files.length} file(s)`
          : 'No conflicts detected',
      };
    } catch (error) {
      return {
        hasConflicts: false,
        files: [],
        message: 'Unable to detect conflicts',
      };
    }
  }

  /**
   * List all active worktrees for a project
   */
  async listSandboxes(): Promise<WorktreeInfo[]> {
    try {
      const { stdout } = await execAsync('git worktree list --porcelain', {
        cwd: this.projectPath,
      });

      const worktrees: WorktreeInfo[] = [];
      const lines = stdout.split('\n');
      let currentPath = '';
      let currentBranch = '';

      for (const line of lines) {
        if (line.startsWith('worktree ')) {
          currentPath = line.substring(9);
        } else if (line.startsWith('branch ')) {
          currentBranch = line.substring(7);
          // Extract task ID from branch name if it matches pattern
          const match = currentBranch.match(/task\/(\d+)-/);
          if (match && currentPath.includes('.worktrees')) {
            worktrees.push({
              path: currentPath,
              branch: currentBranch,
              taskId: parseInt(match[1], 10),
              projectId: 0,
              createdAt: 0, // Would need to stat the directory for actual time
            });
          }
        }
      }

      return worktrees;
    } catch (error) {
      return [];
    }
  }

  /**
   * Check if a worktree has uncommitted changes
   */
  async hasUncommittedChanges(worktreePath: string): Promise<boolean> {
    try {
      const { stdout } = await execAsync('git status --porcelain', {
        cwd: worktreePath,
      });
      return stdout.trim().length > 0;
    } catch {
      return false;
    }
  }

  /**
   * Get the status of a worktree
   */
  async getSandboxStatus(worktreePath: string): Promise<{
    exists: boolean;
    hasChanges: boolean;
    branch: string | null;
    ahead: number;
    behind: number;
  }> {
    try {
      if (!fs.existsSync(worktreePath)) {
        return {
          exists: false,
          hasChanges: false,
          branch: null,
          ahead: 0,
          behind: 0,
        };
      }

      const { stdout: branch } = await execAsync('git rev-parse --abbrev-ref HEAD', {
        cwd: worktreePath,
      });

      const hasChanges = await this.hasUncommittedChanges(worktreePath);

      // Get ahead/behind count
      let ahead = 0;
      let behind = 0;
      try {
        const { stdout: counts } = await execAsync(
          'git rev-list --left-right --count HEAD...@{upstream}',
          { cwd: worktreePath }
        );
        const [aheadStr, behindStr] = counts.trim().split('\t');
        ahead = parseInt(aheadStr, 10) || 0;
        behind = parseInt(behindStr, 10) || 0;
      } catch {
        // No upstream set
      }

      return {
        exists: true,
        hasChanges,
        branch: branch.trim(),
        ahead,
        behind,
      };
    } catch {
      return {
        exists: false,
        hasChanges: false,
        branch: null,
        ahead: 0,
        behind: 0,
      };
    }
  }

  /**
   * Clean up a worktree and its branch
   */
  private async cleanupSandbox(worktreePath: string, branchName: string): Promise<void> {
    // Remove worktree
    try {
      await execAsync(`git worktree remove --force ${worktreePath}`, {
        cwd: this.projectPath,
      });
    } catch {
      // Worktree might not exist or already removed
    }

    // Delete the branch
    try {
      await execAsync(`git branch -D ${branchName}`, {
        cwd: this.projectPath,
      });
    } catch {
      // Branch might not exist or already deleted
    }
  }

  /**
   * Convert a string to a URL-safe slug
   */
  private slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 30);
  }
}

// Factory function for convenience
export function createSandboxManager(projectPath: string): SandboxManager {
  return new SandboxManager(projectPath);
}