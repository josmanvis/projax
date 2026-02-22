import { spawn, ChildProcess } from 'child_process';
import * as os from 'os';
import { getDatabaseManager, Agent, AgentCliType, RunningAgent } from './core-bridge';

/**
 * Safe console logging that handles EPIPE errors gracefully
 */
function safeLog(...args: any[]): void {
  try {
    console.log(...args);
  } catch (error: any) {
    if (error?.code !== 'EPIPE') {
      try {
        process.stderr.write(`[log] ${args.join(' ')}\n`);
      } catch {
        // Give up - output streams are not available
      }
    }
  }
}

function safeError(...args: any[]): void {
  try {
    console.error(...args);
  } catch (error: any) {
    // Silently ignore EPIPE errors
  }
}

// CLI type to default command mapping
export const CLI_COMMANDS: Record<AgentCliType, string> = {
  claude: 'claude',
  cline: 'cline',
  gemini: 'gemini',
  openai: 'openai',
  xai: 'xai',
  ollama: 'ollama',
  aider: 'aider',
  continue: 'continue',
  custom: '',
};

// CLI type to environment variable mapping for API keys
export const CLI_ENV_VARS: Record<AgentCliType, string | null> = {
  claude: 'ANTHROPIC_API_KEY',
  cline: 'ANTHROPIC_API_KEY', // Cline uses Anthropic API
  gemini: 'GOOGLE_API_KEY',
  openai: 'OPENAI_API_KEY',
  xai: 'XAI_API_KEY',
  ollama: null, // Local, no API key needed
  aider: null, // Uses OPENAI_API_KEY or ANTHROPIC_API_KEY depending on model
  continue: null, // IDE extension
  custom: null,
};

// CLI type display names
export const CLI_DISPLAY_NAMES: Record<AgentCliType, string> = {
  claude: 'Claude Code',
  cline: 'Cline',
  gemini: 'Gemini CLI',
  openai: 'OpenAI CLI',
  xai: 'xAI / Grok',
  ollama: 'Ollama',
  aider: 'Aider',
  continue: 'Continue.dev',
  custom: 'Custom',
};

// All valid CLI types
export const VALID_CLI_TYPES: AgentCliType[] = [
  'claude',
  'cline',
  'gemini',
  'openai',
  'xai',
  'ollama',
  'aider',
  'continue',
  'custom',
];

/**
 * Build command and arguments for launching an agent
 */
export function buildAgentCommand(agent: Agent): { command: string; args: string[]; env: NodeJS.ProcessEnv } {
  const command = agent.cli_type === 'custom' && agent.cli_command
    ? agent.cli_command
    : CLI_COMMANDS[agent.cli_type];

  const args: string[] = [];
  const env = { ...process.env };

  // Set API key in environment if available
  if (agent.api_key) {
    const envVar = CLI_ENV_VARS[agent.cli_type];
    if (envVar) {
      env[envVar] = agent.api_key;
    }
    // For aider, set both possible keys
    if (agent.cli_type === 'aider') {
      env['OPENAI_API_KEY'] = agent.api_key;
      env['ANTHROPIC_API_KEY'] = agent.api_key;
    }
  }

  // Add model flag if specified
  if (agent.model) {
    switch (agent.cli_type) {
      case 'claude':
        args.push('--model', agent.model);
        break;
      case 'cline':
        // Cline uses config file for model selection, but we can pass --model
        args.push('--model', agent.model);
        break;
      case 'openai':
        args.push('--model', agent.model);
        break;
      case 'gemini':
        args.push('--model', agent.model);
        break;
      case 'ollama':
        args.push('run', agent.model);
        break;
      case 'aider':
        args.push('--model', agent.model);
        break;
      default:
        if (agent.model) {
          args.push('--model', agent.model);
        }
    }
  }

  // Add system prompt if specified
  if (agent.system_prompt) {
    switch (agent.cli_type) {
      case 'claude':
        args.push('--system-prompt', agent.system_prompt);
        break;
      case 'aider':
        args.push('--message', agent.system_prompt);
        break;
      default:
        // Most CLIs don't support system prompt via CLI
        break;
    }
  }

  // Add additional args if specified
  if (agent.additional_args) {
    const additionalArgs = agent.additional_args.split(/\s+/).filter(Boolean);
    args.push(...additionalArgs);
  }

  return { command, args, env };
}

/**
 * Get agents for a project via API
 */
export function getAgentsByProject(projectId: number): Agent[] {
  try {
    const db = getDatabaseManager();
    return db.getAgentsByProject(projectId);
  } catch (error) {
    safeError('Failed to get agents:', error);
    return [];
  }
}

/**
 * Get running agents via API
 */
export function getRunningAgents(): RunningAgent[] {
  try {
    const db = getDatabaseManager();
    return db.getRunningAgents();
  } catch (error) {
    safeError('Failed to get running agents:', error);
    return [];
  }
}

/**
 * Check if an agent is running
 */
export function isAgentRunning(agentId: number): boolean {
  try {
    const db = getDatabaseManager();
    const status = db.getAgentStatus(agentId);
    return status.running;
  } catch {
    return false;
  }
}

/**
 * Launch an agent via API
 */
export function launchAgent(agentId: number): RunningAgent | null {
  try {
    const db = getDatabaseManager();
    return db.launchAgent(agentId);
  } catch (error) {
    safeError('Failed to launch agent:', error);
    return null;
  }
}

/**
 * Stop an agent via API
 */
export function stopAgent(agentId: number): boolean {
  try {
    const db = getDatabaseManager();
    db.stopAgent(agentId);
    return true;
  } catch (error) {
    safeError('Failed to stop agent:', error);
    return false;
  }
}

/**
 * Launch an agent in a new terminal window (for TUI use)
 * This opens a new terminal with the agent CLI running in the project directory
 */
export function launchAgentInTerminal(agent: Agent, projectPath: string): boolean {
  try {
    const { command, args, env } = buildAgentCommand(agent);

    if (!command) {
      safeError('No command configured for this agent');
      return false;
    }

    const fullCommand = [command, ...args].join(' ');
    const platform = os.platform();

    let terminalProcess: ChildProcess;

    if (platform === 'darwin') {
      // macOS - use Terminal.app or iTerm
      const script = `
        tell application "Terminal"
          do script "cd '${projectPath}' && ${fullCommand}"
          activate
        end tell
      `;
      terminalProcess = spawn('osascript', ['-e', script], {
        env,
        detached: true,
        stdio: 'ignore',
      });
    } else if (platform === 'win32') {
      // Windows - use cmd
      terminalProcess = spawn('cmd', ['/c', 'start', 'cmd', '/k', `cd /d "${projectPath}" && ${fullCommand}`], {
        env,
        detached: true,
        stdio: 'ignore',
      });
    } else {
      // Linux - try common terminal emulators
      const terminals = ['gnome-terminal', 'konsole', 'xfce4-terminal', 'xterm'];
      let launched = false;

      for (const term of terminals) {
        try {
          if (term === 'gnome-terminal') {
            terminalProcess = spawn(term, ['--', 'bash', '-c', `cd "${projectPath}" && ${fullCommand}; exec bash`], {
              env,
              detached: true,
              stdio: 'ignore',
            });
          } else if (term === 'konsole') {
            terminalProcess = spawn(term, ['-e', 'bash', '-c', `cd "${projectPath}" && ${fullCommand}; exec bash`], {
              env,
              detached: true,
              stdio: 'ignore',
            });
          } else {
            terminalProcess = spawn(term, ['-e', `cd "${projectPath}" && ${fullCommand}`], {
              env,
              detached: true,
              stdio: 'ignore',
            });
          }
          launched = true;
          break;
        } catch {
          continue;
        }
      }

      if (!launched) {
        safeError('Could not find a terminal emulator');
        return false;
      }
    }

    terminalProcess!.unref();
    return true;
  } catch (error) {
    safeError('Failed to launch agent in terminal:', error);
    return false;
  }
}

/**
 * Create a new agent
 */
export function createAgent(
  projectId: number,
  data: {
    name: string;
    cli_type: AgentCliType;
    cli_command?: string | null;
    model?: string | null;
    api_key?: string | null;
    system_prompt?: string | null;
    temperature?: number | null;
    max_tokens?: number | null;
    additional_args?: string | null;
  }
): Agent | null {
  try {
    const db = getDatabaseManager();
    return db.addAgent(projectId, data);
  } catch (error) {
    safeError('Failed to create agent:', error);
    return null;
  }
}

/**
 * Update an agent
 */
export function updateAgent(
  agentId: number,
  updates: Partial<Omit<Agent, 'id' | 'project_id' | 'created_at' | 'updated_at'>>
): Agent | null {
  try {
    const db = getDatabaseManager();
    return db.updateAgent(agentId, updates);
  } catch (error) {
    safeError('Failed to update agent:', error);
    return null;
  }
}

/**
 * Delete an agent
 */
export function deleteAgent(agentId: number): boolean {
  try {
    const db = getDatabaseManager();
    db.removeAgent(agentId);
    return true;
  } catch (error) {
    safeError('Failed to delete agent:', error);
    return false;
  }
}
