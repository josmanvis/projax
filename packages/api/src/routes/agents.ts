import { Router } from 'express';
import { getDatabase } from '../database';
import { Agent, AgentCliType, RunningAgent } from '../types';
import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';
import * as os from 'os';

const router: Router = Router();
const db = getDatabase();

// Track running agent processes
const runningAgents: Map<number, { process: ChildProcess; info: RunningAgent }> = new Map();

// CLI type to command mapping
const CLI_COMMANDS: Record<AgentCliType, string> = {
  claude: 'claude',
  gemini: 'gemini',
  openai: 'openai',
  xai: 'xai',
  ollama: 'ollama',
  aider: 'aider',
  continue: 'continue',
  custom: '',
};

// CLI type to environment variable mapping for API keys
const CLI_ENV_VARS: Record<AgentCliType, string | null> = {
  claude: 'ANTHROPIC_API_KEY',
  gemini: 'GOOGLE_API_KEY',
  openai: 'OPENAI_API_KEY',
  xai: 'XAI_API_KEY',
  ollama: null, // Local, no API key needed
  aider: null, // Uses OPENAI_API_KEY or ANTHROPIC_API_KEY depending on model
  continue: null, // IDE extension
  custom: null,
};

// Helper to build command and args for an agent
function buildAgentCommand(agent: Agent): { command: string; args: string[]; env: NodeJS.ProcessEnv } {
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
        // Custom or unknown - add as generic flag
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

// List agents for a project
router.get('/projects/:projectId/agents', (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId, 10);
    if (isNaN(projectId)) {
      return res.status(400).json({ error: 'Invalid project ID' });
    }

    // Verify project exists
    const project = db.getProject(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const agents = db.getAgentsByProject(projectId);
    res.json(agents);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Create agent for a project
router.post('/projects/:projectId/agents', (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId, 10);
    if (isNaN(projectId)) {
      return res.status(400).json({ error: 'Invalid project ID' });
    }

    // Verify project exists
    const project = db.getProject(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const { name, cli_type, cli_command, model, api_key, system_prompt, temperature, max_tokens, additional_args } = req.body;

    if (!name || !cli_type) {
      return res.status(400).json({ error: 'Name and cli_type are required' });
    }

    // Validate cli_type
    const validCliTypes: AgentCliType[] = ['claude', 'gemini', 'openai', 'xai', 'ollama', 'aider', 'continue', 'custom'];
    if (!validCliTypes.includes(cli_type)) {
      return res.status(400).json({ error: `Invalid cli_type. Must be one of: ${validCliTypes.join(', ')}` });
    }

    // Validate temperature if provided
    if (temperature !== undefined && temperature !== null) {
      if (typeof temperature !== 'number' || temperature < 0 || temperature > 2) {
        return res.status(400).json({ error: 'Temperature must be a number between 0 and 2' });
      }
    }

    // Validate max_tokens if provided
    if (max_tokens !== undefined && max_tokens !== null) {
      if (typeof max_tokens !== 'number' || max_tokens < 1) {
        return res.status(400).json({ error: 'max_tokens must be a positive number' });
      }
    }

    const agent = db.addAgent(projectId, {
      name,
      cli_type,
      cli_command: cli_command || null,
      model: model || null,
      api_key: api_key || null,
      system_prompt: system_prompt || null,
      temperature: temperature ?? null,
      max_tokens: max_tokens ?? null,
      additional_args: additional_args || null,
    });

    res.status(201).json(agent);
  } catch (error) {
    if (error instanceof Error && error.message.includes('already exists')) {
      return res.status(409).json({ error: error.message });
    }
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Get agent by ID
router.get('/agents/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid agent ID' });
    }

    const agent = db.getAgent(id);
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    res.json(agent);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Update agent
router.put('/agents/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid agent ID' });
    }

    const { name, cli_type, cli_command, model, api_key, system_prompt, temperature, max_tokens, additional_args } = req.body;

    // Validate cli_type if provided
    if (cli_type !== undefined) {
      const validCliTypes: AgentCliType[] = ['claude', 'gemini', 'openai', 'xai', 'ollama', 'aider', 'continue', 'custom'];
      if (!validCliTypes.includes(cli_type)) {
        return res.status(400).json({ error: `Invalid cli_type. Must be one of: ${validCliTypes.join(', ')}` });
      }
    }

    // Validate temperature if provided
    if (temperature !== undefined && temperature !== null) {
      if (typeof temperature !== 'number' || temperature < 0 || temperature > 2) {
        return res.status(400).json({ error: 'Temperature must be a number between 0 and 2' });
      }
    }

    // Validate max_tokens if provided
    if (max_tokens !== undefined && max_tokens !== null) {
      if (typeof max_tokens !== 'number' || max_tokens < 1) {
        return res.status(400).json({ error: 'max_tokens must be a positive number' });
      }
    }

    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (cli_type !== undefined) updates.cli_type = cli_type;
    if (cli_command !== undefined) updates.cli_command = cli_command;
    if (model !== undefined) updates.model = model;
    if (api_key !== undefined) updates.api_key = api_key;
    if (system_prompt !== undefined) updates.system_prompt = system_prompt;
    if (temperature !== undefined) updates.temperature = temperature;
    if (max_tokens !== undefined) updates.max_tokens = max_tokens;
    if (additional_args !== undefined) updates.additional_args = additional_args;

    const agent = db.updateAgent(id, updates);
    res.json(agent);
  } catch (error) {
    if (error instanceof Error && error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }
    if (error instanceof Error && error.message.includes('already exists')) {
      return res.status(409).json({ error: error.message });
    }
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Delete agent
router.delete('/agents/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid agent ID' });
    }

    // Stop agent if running
    const running = runningAgents.get(id);
    if (running) {
      running.process.kill();
      runningAgents.delete(id);
    }

    db.removeAgent(id);
    res.status(204).send();
  } catch (error) {
    if (error instanceof Error && error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Launch agent
router.post('/agents/:id/launch', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid agent ID' });
    }

    // Check if already running
    if (runningAgents.has(id)) {
      return res.status(409).json({ error: 'Agent is already running', running: runningAgents.get(id)!.info });
    }

    const agent = db.getAgent(id);
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    const project = db.getProject(agent.project_id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const { command, args, env } = buildAgentCommand(agent);

    if (!command) {
      return res.status(400).json({ error: 'No command configured for this agent' });
    }

    // Spawn the process
    const childProcess = spawn(command, args, {
      cwd: project.path,
      env,
      stdio: 'pipe',
      detached: true,
    });

    if (!childProcess.pid) {
      return res.status(500).json({ error: 'Failed to start agent process' });
    }

    const runningInfo: RunningAgent = {
      pid: childProcess.pid,
      agentId: agent.id,
      agentName: agent.name,
      projectId: project.id,
      projectPath: project.path,
      cliType: agent.cli_type,
      startedAt: Math.floor(Date.now() / 1000),
    };

    runningAgents.set(id, { process: childProcess, info: runningInfo });

    // Clean up when process exits
    childProcess.on('exit', () => {
      runningAgents.delete(id);
    });

    childProcess.on('error', () => {
      runningAgents.delete(id);
    });

    // Unref to allow the parent to exit independently
    childProcess.unref();

    res.status(201).json(runningInfo);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Stop agent
router.post('/agents/:id/stop', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid agent ID' });
    }

    const running = runningAgents.get(id);
    if (!running) {
      return res.status(404).json({ error: 'Agent is not running' });
    }

    running.process.kill();
    runningAgents.delete(id);

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Get all running agents
router.get('/agents/running', (req, res) => {
  try {
    const running: RunningAgent[] = Array.from(runningAgents.values()).map(r => r.info);
    res.json(running);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Get running status for specific agent
router.get('/agents/:id/status', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid agent ID' });
    }

    const running = runningAgents.get(id);
    if (running) {
      res.json({ running: true, info: running.info });
    } else {
      res.json({ running: false });
    }
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

export default router;
