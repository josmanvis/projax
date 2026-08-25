import React, { useState, useEffect } from 'react';
import { Box, Text, Newline, useInput } from 'ink';
import { Wizard, WizardStep, useWizard } from './Wizard';
import { Agent, TodoList } from 'projax-api/types';
import { PRIORITY_COLORS, STATUS_CONFIG } from '../utils/agent-configs';

const colors = {
  textPrimary: '#c9d1d9',
  textSecondary: '#8b949e',
  textTertiary: '#6e7681',
  accentCyan: '#39c5cf',
  accentGreen: '#3fb950',
  accentYellow: '#d29922',
  accentOrange: '#ffa657',
  accentRed: '#f85149',
};

interface TaskWizardProps {
  agents: Agent[];
  todoLists: TodoList[];
  onComplete: (data: TaskWizardData) => void;
  onCancel: () => void;
}

export interface TaskWizardData {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignee_agent_id: number | null;
  list_id: number | null;
}

const STEPS: WizardStep[] = [
  { id: 'title', title: 'Task Title', description: 'Enter a descriptive title for the task' },
  { id: 'description', title: 'Description', description: 'Add more details about the task', optional: true },
  { id: 'priority', title: 'Priority Level', description: 'How important is this task?' },
  { id: 'assign', title: 'Assign Agent', description: 'Assign an AI agent to work on this task', optional: true },
  { id: 'confirm', title: 'Confirm', description: 'Review your task before creating' },
];

const PRIORITIES = [
  { value: 'low', label: 'Low', description: 'Nice to have, no urgency' },
  { value: 'medium', label: 'Medium', description: 'Normal priority' },
  { value: 'high', label: 'High', description: 'Important, should be done soon' },
  { value: 'urgent', label: 'Urgent', description: 'Critical, needs immediate attention' },
];

export const TaskWizard: React.FC<TaskWizardProps> = ({
  agents,
  todoLists,
  onComplete,
  onCancel,
}) => {
  const wizard = useWizard({
    title: '',
    description: '',
    priority: 'medium' as const,
    assignee_agent_id: null as number | null,
    list_id: todoLists[0]?.id || null,
  });

  const [inputValue, setInputValue] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [inputFocused, setInputFocused] = useState(true);

  // Reset state when step changes
  useEffect(() => {
    setInputValue('');
    setSelectedIndex(0);
    setInputFocused(true);
    
    // Restore saved values
    if (wizard.currentStep === 0 && wizard.data.title) {
      setInputValue(wizard.data.title);
    } else if (wizard.currentStep === 1 && wizard.data.description) {
      setInputValue(wizard.data.description);
    }
  }, [wizard.currentStep]);

  // Input handling
  useInput((input, key) => {
    const step = STEPS[wizard.currentStep];

    // Title and Description input
    if (step.id === 'title' || step.id === 'description') {
      if (key.escape) {
        onCancel();
        return;
      }
      if (key.return) {
        if (step.id === 'title') {
          if (inputValue.trim()) {
            wizard.updateData('title', inputValue.trim());
            wizard.goNext();
          }
        } else {
          wizard.updateData('description', inputValue.trim());
          wizard.goNext();
        }
        return;
      }
      if (key.backspace || key.delete) {
        setInputValue((v) => v.slice(0, -1));
        return;
      }
      if (input && input.length === 1) {
        setInputValue((v) => v + input);
        return;
      }
    }

    // Priority selection
    if (step.id === 'priority') {
      if (key.escape) {
        if (wizard.currentStep > 0) wizard.goBack();
        else onCancel();
        return;
      }
      if (key.upArrow) {
        setSelectedIndex((i) => Math.max(0, i - 1));
        return;
      }
      if (key.downArrow) {
        setSelectedIndex((i) => Math.min(PRIORITIES.length - 1, i + 1));
        return;
      }
      if (key.return) {
        wizard.updateData('priority', PRIORITIES[selectedIndex].value);
        wizard.goNext();
        return;
      }
    }

    // Agent assignment
    if (step.id === 'assign') {
      const totalOptions = agents.length + 1; // +1 for "No agent" option
      if (key.escape) {
        if (wizard.currentStep > 0) wizard.goBack();
        else onCancel();
        return;
      }
      if (key.upArrow) {
        setSelectedIndex((i) => Math.max(0, i - 1));
        return;
      }
      if (key.downArrow) {
        setSelectedIndex((i) => Math.min(totalOptions - 1, i + 1));
        return;
      }
      if (key.return) {
        if (selectedIndex === 0) {
          wizard.updateData('assignee_agent_id', null);
        } else {
          wizard.updateData('assignee_agent_id', agents[selectedIndex - 1].id);
        }
        wizard.goNext();
        return;
      }
      // Skip this step
      if (input === 's' || input === 'S') {
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
        onComplete(wizard.data as TaskWizardData);
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

    if (step.id === 'title') {
      return (
        <Box flexDirection="column">
          <Box>
            <Text color={colors.textSecondary}>Title: </Text>
            <Text color={colors.textPrimary}>{inputValue}</Text>
            <Text color={colors.accentCyan}>_</Text>
          </Box>
          <Newline />
          <Text color={colors.textTertiary}>
            Type a descriptive title for your task
          </Text>
        </Box>
      );
    }

    if (step.id === 'description') {
      return (
        <Box flexDirection="column">
          <Box>
            <Text color={colors.textSecondary}>Description: </Text>
            <Text color={colors.textPrimary}>{inputValue}</Text>
            <Text color={colors.accentCyan}>_</Text>
          </Box>
          <Newline />
          <Text color={colors.textTertiary}>
            Add details, acceptance criteria, or context
          </Text>
          <Text color={colors.textTertiary}>
            Press Enter to skip if not needed
          </Text>
        </Box>
      );
    }

    if (step.id === 'priority') {
      return (
        <Box flexDirection="column">
          {PRIORITIES.map((p, idx) => {
            const color = PRIORITY_COLORS[p.value] || colors.textSecondary;
            const isSelected = idx === selectedIndex;
            return (
              <Box key={p.value}>
                <Text color={isSelected ? colors.accentCyan : colors.textTertiary}>
                  {isSelected ? '▶ ' : '  '}
                </Text>
                <Text color={color} bold={isSelected}>
                  {p.label}
                </Text>
                <Text color={colors.textSecondary}> - {p.description}</Text>
              </Box>
            );
          })}
          <Newline />
          <Text color={colors.textTertiary}>↑↓ to select, Enter to confirm</Text>
        </Box>
      );
    }

    if (step.id === 'assign') {
      return (
        <Box flexDirection="column">
          <Text color={colors.textSecondary}>Available Agents:</Text>
          <Newline />
          
          {/* No agent option */}
          <Box>
            <Text color={selectedIndex === 0 ? colors.accentCyan : colors.textTertiary}>
              {selectedIndex === 0 ? '▶ ' : '  '}
            </Text>
            <Text color={colors.textTertiary}>No agent (assign later)</Text>
          </Box>

          {/* Agent options */}
          {agents.map((agent, idx) => {
            const isSelected = idx + 1 === selectedIndex;
            return (
              <Box key={agent.id}>
                <Text color={isSelected ? colors.accentCyan : colors.textTertiary}>
                  {isSelected ? '▶ ' : '  '}
                </Text>
                <Text color={isSelected ? colors.accentCyan : colors.textPrimary} bold={isSelected}>
                  {agent.name}
                </Text>
                <Text color={colors.textSecondary}> ({agent.cli_type}</Text>
                {agent.model && (
                  <Text color={colors.textSecondary}>, {agent.model}</Text>
                )}
                <Text color={colors.textSecondary}>)</Text>
              </Box>
            );
          })}

          {agents.length === 0 && (
            <Text color={colors.textTertiary}>No agents available</Text>
          )}

          <Newline />
          <Text color={colors.textTertiary}>↑↓ to select, Enter to confirm, s to skip</Text>
        </Box>
      );
    }

    if (step.id === 'confirm') {
      const assignedAgent = agents.find((a) => a.id === wizard.data.assignee_agent_id);
      const priority = PRIORITIES.find((p) => p.value === wizard.data.priority);

      return (
        <Box flexDirection="column">
          <Text bold color={colors.textPrimary}>
            {wizard.data.title || '(Untitled)'}
          </Text>
          {wizard.data.description && (
            <Text color={colors.textSecondary}>{wizard.data.description}</Text>
          )}
          <Newline />
          
          <Box>
            <Text color={colors.textSecondary}>Priority: </Text>
            <Text color={PRIORITY_COLORS[wizard.data.priority]}>
              {priority?.label || wizard.data.priority}
            </Text>
          </Box>

          <Box>
            <Text color={colors.textSecondary}>Agent: </Text>
            {assignedAgent ? (
              <Text color={colors.accentCyan}>{assignedAgent.name}</Text>
            ) : (
              <Text color={colors.textTertiary}>None assigned</Text>
            )}
          </Box>

          <Newline />
          <Text color={colors.accentGreen}>Press Enter to create task</Text>
          <Text color={colors.textTertiary}>Press b to go back and make changes</Text>
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
        title="Create New Task"
        onCancel={onCancel}
        onBack={wizard.currentStep > 0 ? wizard.goBack : undefined}
        isLastStep={wizard.isLastStep(STEPS.length)}
      >
        {renderStepContent()}
      </Wizard>
    </Box>
  );
};

export default TaskWizard;