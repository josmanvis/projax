import { Agent } from './types';
import { executeCommand } from './shell';

export async function executeGitCommand(agent: Agent, command: string): Promise<{ stdout: string; stderr: string }> {
  if (command.startsWith('git push')) {
    // Basic protection: only allow pushing the agent's own branch
    const branch = agent.worktree!.branch;
    if (!command.includes(branch)) {
      throw new Error(`Git flow violation: an agent can only push to its own branch (${branch})`);
    }
  }

  return executeCommand(command, agent.worktree!.path);
}
