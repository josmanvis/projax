import { Agent, AgentStatus } from './types';
import { createWorkspace, removeWorkspace } from './workspace';
import { getLlmClient } from './llm';
import { executeGitCommand } from './git-flow';

function parseCommands(llmResponse: string): string[] {
    const commandBlock = llmResponse.match(/```bash\n([\s\S]*?)```/);
    if (!commandBlock) {
        return [];
    }
    return commandBlock[1].split('\n').map(cmd => cmd.trim()).filter(cmd => cmd.length > 0);
}

async function executeTask(agent: Agent): Promise<void> {
  console.log(`[${agent.id}] Executing task in ${agent.worktree!.path}`);
  
  const llmClient = getLlmClient(agent.llm);
  const llmResponse = await llmClient.generate(agent);
  const commands = parseCommands(llmResponse);

  console.log(`[${agent.id}] Received commands from LLM:`, commands);

  for (const command of commands) {
    console.log(`[${agent.id}] Executing command: ${command}`);
    const { stdout, stderr } = await executeGitCommand(agent, command);
    if (stdout) console.log(`[${agent.id}] stdout:`, stdout);
    if (stderr) console.error(`[${agent.id}] stderr:`, stderr);
  }

  console.log(`[${agent.id}] Task finished`);
}

export async function runAgent(agent: Agent): Promise<void> {
  try {
    // 1. Update agent status to RUNNING
    agent.status = AgentStatus.RUNNING;
    console.log(`[${agent.id}] Agent is running`);

    // 2. Create the workspace
    agent.worktree = await createWorkspace(agent.id);
    console.log(`[${agent.id}] Workspace created at ${agent.worktree.path}`);

    // 3. Execute the task
    await executeTask(agent);

    // 4. Update agent status to COMPLETED
    agent.status = AgentStatus.COMPLETED;
    console.log(`[${agent.id}] Agent has completed its task`);

  } catch (error: any) {
    // 5. Update agent status to FAILED
    agent.status = AgentStatus.FAILED;
    console.error(`[${agent.id}] Agent has failed: ${error.message}`);
  } finally {
    // 6. Clean up the workspace
    if (agent.worktree) {
      await removeWorkspace(agent.id);
      console.log(`[${agent.id}] Workspace cleaned up`);
    }
  }
}
