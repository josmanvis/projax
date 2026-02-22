import { Command } from 'commander';
import { runAgent, Agent, AgentStatus } from 'octopus';
import { v4 as uuidv4 } from 'uuid';
import { launchOctopusTUI } from './octopus-tui';
import { launchOctopusShowTUI } from './octopus-show-tui';

export function createOctopusCommand(): Command {
  const octopusCommand = new Command('octopus');

  octopusCommand
    .description('Manage AI agents and project tasks');

  octopusCommand
    .command('create-agent')
    .description('Create and run a new agent')
    .requiredOption('-p, --prompt <prompt>', 'The prompt for the agent')
    .option('-l, --llm <llm>', 'The LLM to use', 'mock')
    .action(async (options) => {
      const agent: Agent = {
        id: uuidv4(),

        prompt: options.prompt,
        llm: options.llm,
        status: AgentStatus.IDLE,

        createdAt: new Date(),
        updatedAt: new Date(),
      };

      console.log(`Creating agent ${agent.id} with prompt: "${agent.prompt}"`);

      await runAgent(agent);
    });

  // 'ui' subcommand - simple agent UI
  octopusCommand
    .command('ui')
    .description('Launch the simple Octopus agent TUI')
    .action(() => {
      launchOctopusTUI();
    });

  // 'show' subcommand - rich task management TUI
  octopusCommand
    .command('show')
    .description('Launch the Octopus Task Manager TUI - manage todo lists and spawn AI agents for tasks')
    .action(() => {
      launchOctopusShowTUI();
    });

  return octopusCommand;
}
