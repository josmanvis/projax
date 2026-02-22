import * as path from 'path';
import * as fs from 'fs';
import { Worktree } from './types';
import { executeCommand } from './shell';

const WORKTREE_DIR = path.resolve(process.cwd(), '.worktrees');

export async function createWorkspace(agentId: string): Promise<Worktree> {
  const branchName = `agent/${agentId}`;
  const worktreePath = path.join(WORKTREE_DIR, agentId);

  // Ensure the worktrees directory exists
  if (!fs.existsSync(WORKTREE_DIR)) {
    fs.mkdirSync(WORKTREE_DIR, { recursive: true });
  }

  // Create the worktree
  const command = `git worktree add -b ${branchName} ${worktreePath}`;
  try {
    await executeCommand(command, process.cwd());
  } catch (error: any) {
    throw new Error(`Failed to create worktree: ${error.message}`);
  }

  return {
    path: worktreePath,
    branch: branchName,
  };
}

export async function removeWorkspace(agentId: string): Promise<void> {
  const worktreePath = path.join(WORKTREE_DIR, agentId);
  const branchName = `agent/${agentId}`;

  // Remove the worktree
  const removeWorktreeCommand = `git worktree remove ${worktreePath}`;
  try {
    await executeCommand(removeWorktreeCommand, process.cwd());
  } catch (error: any) {
    // ignore if the worktree doesn't exist
    if (!error.message.includes('not a working tree')) {
        throw new Error(`Failed to remove worktree: ${error.message}`);
    }
  }

  // Remove the branch
  const removeBranchCommand = `git branch -D ${branchName}`;
  try {
    await executeCommand(removeBranchCommand, process.cwd());
  } catch (error: any) {
    // ignore if the branch doesn't exist
    if (!error.message.includes('not found')) {
      throw new Error(`Failed to remove branch: ${error.message}`);
    }
  }
}
