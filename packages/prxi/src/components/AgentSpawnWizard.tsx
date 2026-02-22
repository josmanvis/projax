import React, { useState, useEffect } from 'react';
import { Box, Text, Newline, useInput } from 'ink';
import { Wizard, WizardStep, useWizard } from './Wizard';
import { Agent, AgentCliType, Project } from 'projax-api/types';
import { AGENT_CONFIGS, SYSTEM_PROMPT_TEMPLATES, AgentConfig } from '../utils/agent-configs';

const colors = {
  textPrimary: '#c9d1d9',
  textSecondary: '#8b949e',
  textTertiary: '#6e7681',
  accentCyan: '#39c5cf',
  accentGreen: '#3fb950',
  accentYellow: '#d29922',
  accentOrange: '#ffa657',
  accentRed: '#f85149',
  accentPurple: '#bc8cff',
};

interface AgentSpawnWizardProps {
  project: Project;
  existingAgents: Agent[];
  onComplete: (data: AgentSpawnData) => void;
  onCancel: () => void;
}

export interface AgentSpawnData {
  name: string;
  cli_type: AgentCliType;
  cli_command: string | null;
  model: string | null;
  api_key: string | null;
  system_prompt: string | null;
  temperature: number | null;
  max_tokens: number | null;
  additional_args: string | null;
  launch_immediately: boolean;
}

// Get ordered list of agent types
const AGENT_TYPES = Object.values(AGENT_CONFIGS);

const STEPS: WizardStep[] = [
  { id: 'type', title: 'Choose Agent Type', description: 'Select an AI coding assistant' },
  { id: 'name', title: 'Agent Name', description: 'Give your agent a recognizable name' },
  { id: 'model', title: 'Select Model', description: 'Choose the AI model to use', optional: true },
  { id: 'api_key', title: 'API Key', description: 'Provide your API key (stored locally)', optional: true },
  { id: 'prompt', title: 'System Prompt', description: 'Customize the agent behavior', optional: true },
  { id: 'confirm', title: 'Ready to Spawn', description: 'Review and launch your agent' },
];

export const AgentSpawnWizard: React.FC<AgentSpawnWizardProps> = ({
  project,
  existingAgents,
  onComplete,
  onCancel,
}) => {
  const wizard = useWizard({
    name: '',
    cli_type: 'claude' as AgentCliType,
    cli_command: null as string | null,
    model: null as string | null,
    api_key: null as string | null,
    system_prompt: null as string | null,
    temperature: null as number | null,
    max_tokens: null as number | null,
    additional_args: null as string | null,
    launch_immediately: false,
  });

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [showTemplates, setShowTemplates] = useState(false);

  // Get current agent config
  const currentConfig = AGENT_CONFIGS[wizard.data.cli_type];

  // Reset and initialize when step changes
  useEffect(() => {
    setInputValue('');
    setSelectedIndex(0);
    setShowTemplates(false);

    // Set default name based on agent type
    if (wizard.currentStep === 1 && !wizard.data.name) {
      const agentConfig = AGENT_CONFIGS[wizard.data.cli_type];
      const defaultName = `${agentConfig.name} - ${project.name}`;
      setInputValue(defaultName);
    }
    
    // Set default model
    if (wizard.currentStep === 2) {
      const agentConfig = AGENT_CONFIGS[wizard.data.cli_type];
      if (agentConfig.models.length > 0 && !wizard.data.model) {
        wizard.updateData('model', agentConfig.defaultModel);
      }
    }
  }, [wizard.currentStep, wizard.data.cli_type]);

  // Input handling
  useInput((input, key) => {
    const step = STEPS[wizard.currentStep];

    // Type selection
    if (step.id === 'type') {
      if (key.escape) {
        onCancel();
        return;
      }
      if (key.upArrow) {
        setSelectedIndex((i) => Math.max(0, i - 1));
        return;
      }
      if (key.downArrow) {
        setSelectedIndex((i) => Math.min(AGENT_TYPES.length - 1, i + 1));
        return;
      }
      if (key.return) {
        const selectedType = AGENT_TYPES[selectedIndex].type;
        wizard.setDataFields({
          cli_type: selectedType,
          model: AGENT_CONFIGS[selectedType].defaultModel || null,
        });
        wizard.goNext();
        return;
      }
    }

    // Name input
    if (step.id === 'name') {
      if (key.escape) {
        if (wizard.currentStep > 0) wizard.goBack();
        else onCancel();
        return;
      }
      if (key.backspace || key.delete) {
        setInputValue((v) => v.slice(0, -1));
        return;
      }
      if (key.return && inputValue.trim()) {
        wizard.updateData('name', inputValue.trim());
        wizard.goNext();
        return;
      }
      if (input && input.length === 1) {
        setInputValue((v) => v + input);
        return;
      }
    }

    // Model selection
    if (step.id === 'model') {
      const config = AGENT_CONFIGS[wizard.data.cli_type];
      const models = config.models;
      
      if (key.escape) {
        wizard.goBack();
        return;
      }
      if (key.upArrow) {
        setSelectedIndex((i) => Math.max(0, i - 1));
        return;
      }
      if (key.downArrow) {
        setSelectedIndex((i) => Math.min(models.length - 1, i + 1));
        return;
      }
      if (key.return) {
        if (models.length > 0) {
          wizard.updateData('model', models[selectedIndex]);
        }
        wizard.goNext();
        return;
      }
      // Skip for types without models or custom
      if (input === 's' || input === 'S' || models.length === 0) {
        wizard.goNext();
        return;
      }
    }

    // API Key input
    if (step.id === 'api_key') {
      const config = AGENT_CONFIGS[wizard.data.cli_type];
      
      if (key.escape) {
        wizard.goBack();
        return;
      }
      if (key.backspace || key.delete) {
        setInputValue((v) => v.slice(0, -1));
        return;
      }
      if (key.return) {
        wizard.updateData('api_key', inputValue.trim() || null);
        wizard.goNext();
        return;
      }
      if (input && input.length === 1) {
        setInputValue((v) => v + input);
        return;
      }
    }

    // System prompt selection/input
    if (step.id === 'prompt') {
      const config = AGENT_CONFIGS[wizard.data.cli_type];
      const templates = Object.entries(SYSTEM_PROMPT_TEMPLATES);
      
      if (key.escape) {
        if (showTemplates) {
          setShowTemplates(false);
        } else {
          wizard.goBack();
        }
        return;
      }
      
      if (!showTemplates) {
        if (key.backspace || key.delete) {
          setInputValue((v) => v.slice(0, -1));
          return;
        }
        if (key.return) {
          wizard.updateData('system_prompt', inputValue.trim() || null);
          wizard.goNext();
          return;
        }
        if (input === 't' || input === 'T') {
          setShowTemplates(true);
          setSelectedIndex(0);
          return;
        }
        if (input && input.length === 1) {
          setInputValue((v) => v + input);
          return;
        }
      } else {
        // Template selection mode
        if (key.upArrow) {
          setSelectedIndex((i) => Math.max(0, i - 1));
          return;
        }
        if (key.downArrow) {
          setSelectedIndex((i) => Math.min(templates.length - 1, i + 1));
          return;
        }
        if (key.return) {
          const [, templateValue] = templates[selectedIndex];
          setInputValue(templateValue);
          setShowTemplates(false);
          return;
        }
      }
      
      // Skip if agent doesn't support system prompts
      if (!config.supportsSystemPrompt) {
        wizard.goNext();
        return;
      }
    }

    // Confirm step
    if (step.id === 'confirm') {
      if (key.escape) {
        wizard.goBack();
        return;
      }
      if (key.return) {
        wizard.updateData('launch_immediately', false);
        onComplete(wizard.data as AgentSpawnData);
        return;
      }
      if (input === 'l' || input === 'L') {
        wizard.updateData('launch_immediately', true);
        onComplete(wizard.data as AgentSpawnData);
        return;
      }
      if (input === 'b' || input === 'B') {
        wizard.goBack();
        return;
      }
    }
  });

  // Render step content
  const renderStepContent = () => {
    const step = STEPS[wizard.currentStep];

    if (step.id === 'type') {
      return (
        <Box flexDirection="column">
          {AGENT_TYPES.map((config, idx) => {
            const isSelected = idx === selectedIndex;
            return (
              <Box key={config.type}>
                <Text color={isSelected ? colors.accentCyan : colors.textTertiary}>
                  {isSelected ? '▶ ' : '  '}
                </Text>
                <Text> {config.icon} </Text>
                <Text color={isSelected ? colors.accentCyan : colors.textPrimary} bold={isSelected}>
                  {config.name.padEnd(16)}
                </Text>
                <Text color={colors.textSecondary}> ({config.provider})</Text>
              </Box>
            );
          })}
          <Newline />
          {currentConfig && (
            <Box flexDirection="column">
              <Text color={colors.textSecondary}>{currentConfig.description}</Text>
              {currentConfig.requiresApiKey && currentConfig.envVar && (
                <Text color={colors.accentYellow}>
                  Requires API key ({currentConfig.envVar})
                </Text>
              )}
              {!currentConfig.requiresApiKey && (
                <Text color={colors.accentGreen}>No API key required</Text>
              )}
              <Text color={colors.textTertiary}>Install: {currentConfig.installHint}</Text>
            </Box>
          )}
        </Box>
      );
    }

    if (step.id === 'name') {
      return (
        <Box flexDirection="column">
          <Box>
            <Text color={colors.textSecondary}>Name: </Text>
            <Text color={colors.textPrimary}>{inputValue}</Text>
            <Text color={colors.accentCyan}>_</Text>
          </Box>
          <Newline />
          <Text color={colors.textTertiary}>
            Give your agent a descriptive name for easy identification
          </Text>
        </Box>
      );
    }

    if (step.id === 'model') {
      const config = AGENT_CONFIGS[wizard.data.cli_type];
      const models = config.models;

      if (models.length === 0) {
        return (
          <Box flexDirection="column">
            <Text color={colors.textSecondary}>
              No model selection needed for {config.name}
            </Text>
            <Newline />
            <Text color={colors.textTertiary}>Press Enter to continue</Text>
          </Box>
        );
      }

      return (
        <Box flexDirection="column">
          <Text color={colors.textSecondary}>Available Models:</Text>
          <Newline />
          {models.map((model, idx) => {
            const isSelected = idx === selectedIndex;
            const isDefault = model === config.defaultModel;
            return (
              <Box key={model}>
                <Text color={isSelected ? colors.accentCyan : colors.textTertiary}>
                  {isSelected ? '▶ ' : '  '}
                </Text>
                <Text color={isSelected ? colors.accentCyan : colors.textPrimary} bold={isSelected}>
                  {model}
                </Text>
                {isDefault && (
                  <Text color={colors.accentGreen}> (recommended)</Text>
                )}
              </Box>
            );
          })}
          <Newline />
          <Text color={colors.textTertiary}>↑↓ to select, Enter to confirm</Text>
        </Box>
      );
    }

    if (step.id === 'api_key') {
      const config = AGENT_CONFIGS[wizard.data.cli_type];

      if (!config.requiresApiKey) {
        return (
          <Box flexDirection="column">
            <Text color={colors.accentGreen}>
              ✓ {config.name} doesn't require an API key
            </Text>
            <Newline />
            <Text color={colors.textTertiary}>Press Enter to continue</Text>
          </Box>
        );
      }

      const maskedValue = '*'.repeat(inputValue.length);

      return (
        <Box flexDirection="column">
          <Text color={colors.textSecondary}>
            Enter your {config.envVar}:
          </Text>
          <Box>
            <Text color={colors.textPrimary}>{maskedValue}</Text>
            <Text color={colors.accentCyan}>_</Text>
          </Box>
          <Newline />
          <Text color={colors.textTertiary}>
            Your API key is stored locally and never shared
          </Text>
          <Text color={colors.textTertiary}>
            Press Enter to skip if already set in environment
          </Text>
        </Box>
      );
    }

    if (step.id === 'prompt') {
      const config = AGENT_CONFIGS[wizard.data.cli_type];
      const templates = Object.entries(SYSTEM_PROMPT_TEMPLATES);

      if (!config.supportsSystemPrompt) {
        return (
          <Box flexDirection="column">
            <Text color={colors.textSecondary}>
              System prompts not supported by {config.name}
            </Text>
            <Newline />
            <Text color={colors.textTertiary}>Press Enter to continue</Text>
          </Box>
        );
      }

      if (showTemplates) {
        return (
          <Box flexDirection="column">
            <Text color={colors.textSecondary}>Select a Template:</Text>
            <Newline />
            {templates.map(([name, template], idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <Box key={name}>
                  <Text color={isSelected ? colors.accentCyan : colors.textTertiary}>
                    {isSelected ? '▶ ' : '  '}
                  </Text>
                  <Text color={isSelected ? colors.accentCyan : colors.textPrimary} bold={isSelected}>
                    {name}
                  </Text>
                </Box>
              );
            })}
            <Newline />
            <Text color={colors.textTertiary}>↑↓ to select, Enter to use, Esc to cancel</Text>
          </Box>
        );
      }

      return (
        <Box flexDirection="column">
          <Text color={colors.textSecondary}>System Prompt (optional):</Text>
          <Box>
            <Text color={colors.textPrimary}>{inputValue}</Text>
            <Text color={colors.accentCyan}>_</Text>
          </Box>
          <Newline />
          <Text color={colors.textTertiary}>Type a custom prompt or:</Text>
          <Text color={colors.accentCyan}>Press 't' to use a template</Text>
          <Text color={colors.textTertiary}>Press Enter to skip</Text>
        </Box>
      );
    }

    if (step.id === 'confirm') {
      const config = AGENT_CONFIGS[wizard.data.cli_type];

      return (
        <Box flexDirection="column">
          <Text bold color={colors.textPrimary}>
            {wizard.data.name || 'New Agent'}
          </Text>
          <Newline />
          
          <Box>
            <Text color={colors.textSecondary}>Type: </Text>
            <Text color={colors.accentCyan}>{config.icon} {config.name}</Text>
          </Box>

          {wizard.data.model && (
            <Box>
              <Text color={colors.textSecondary}>Model: </Text>
              <Text color={colors.textPrimary}>{wizard.data.model}</Text>
            </Box>
          )}

          {wizard.data.api_key && (
            <Box>
              <Text color={colors.textSecondary}>API Key: </Text>
              <Text color={colors.accentGreen}>✓ Provided</Text>
            </Box>
          )}

          {wizard.data.system_prompt && (
            <Box flexDirection="column">
              <Text color={colors.textSecondary}>System Prompt:</Text>
              <Text color={colors.textPrimary}>  {wizard.data.system_prompt.substring(0, 50)}...</Text>
            </Box>
          )}

          <Newline />
          <Box flexDirection="column">
            <Text color={colors.accentGreen}>Press Enter to save agent</Text>
            <Text color={colors.accentCyan}>Press 'l' to save and launch immediately</Text>
            <Text color={colors.textTertiary}>Press 'b' to go back</Text>
          </Box>
        </Box>
      );
    }

    return null;
  };

  return (
    <Box padding={1}>
      <Wizard
        steps={STEPS}
        currentStep={wizard.currentStep}
        title="Spawn New Agent"
        onCancel={onCancel}
        onBack={wizard.currentStep > 0 ? wizard.goBack : undefined}
        isLastStep={wizard.isLastStep(STEPS.length)}
      >
        {renderStepContent()}
      </Wizard>
    </Box>
  );
};

export default AgentSpawnWizard;