import React from 'react';
import { Box, Text, Newline } from 'ink';
import { Project, TodoTask, Agent } from 'projax-api/types';

const colors = {
  bgPrimary: '#0d1117',
  borderColor: '#30363d',
  textPrimary: '#c9d1d9',
  textSecondary: '#8b949e',
  textTertiary: '#6e7681',
  accentCyan: '#39c5cf',
  accentGreen: '#3fb950',
  accentYellow: '#d29922',
  accentOrange: '#ffa657',
  accentPurple: '#bc8cff',
};

interface ProjectDetailProps {
  project: Project;
  tasks: TodoTask[];
  agents: Agent[];
  ports: any[];
  onOpenInEditor?: () => void;
  onCreateTask?: () => void;
  onSpawnAgent?: () => void;
  onBack?: () => void;
}

const truncate = (text: string, max: number) =>
  text?.length > max ? text.slice(0, max - 3) + '...' : text || '';

const formatDate = (timestamp: number | null) => {
  if (!timestamp) return 'Never';
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export const ProjectDetail: React.FC<ProjectDetailProps> = ({
  project,
  tasks,
  agents,
  ports,
  onOpenInEditor,
  onCreateTask,
  onSpawnAgent,
  onBack,
}) => {
  // Task statistics
  const taskStats = {
    total: tasks.length,
    pending: tasks.filter((t) => t.status === 'pending').length,
    inProgress: tasks.filter((t) => t.status === 'in_progress').length,
    completed: tasks.filter((t) => t.status === 'completed').length,
    blocked: tasks.filter((t) => t.status === 'blocked').length,
  };

  // Agent statistics
  const agentStats = {
    total: agents.length,
    byType: agents.reduce(
      (acc, a) => {
        acc[a.cli_type] = (acc[a.cli_type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    ),
  };

  return (
    <Box flexDirection="column" flexGrow={1} padding={1}>
      {/* Header */}
      <Box marginBottom={1}>
        <Text bold color={colors.accentCyan} size={2}>
          📁 {project.name}
        </Text>
      </Box>

      {/* Project Info */}
      <Box flexDirection="column" marginBottom={1}>
        <Text color={colors.textSecondary}>
          Path:{' '}
          <Text color={colors.textPrimary}>{truncate(project.path, 60)}</Text>
        </Text>
        {project.description && (
          <Text color={colors.textSecondary}>
            Description:{' '}
            <Text color={colors.textPrimary}>{project.description}</Text>
          </Text>
        )}
        <Box>
          <Text color={colors.textSecondary}>Framework: </Text>
          <Text color={colors.accentPurple}>
            {project.framework || 'Unknown'}
          </Text>
          <Text color={colors.textSecondary}>  |  Last Scanned: </Text>
          <Text color={colors.textPrimary}>
            {formatDate(project.last_scanned)}
          </Text>
        </Box>
        {project.tags && project.tags.length > 0 && (
          <Box>
            <Text color={colors.textSecondary}>Tags: </Text>
            {project.tags.map((tag, i) => (
              <Text key={i} color={colors.accentCyan}>
                {' '}
                [{tag}]
              </Text>
            ))}
          </Box>
        )}
      </Box>

      <Newline />

      {/* Task Statistics */}
      <Box flexDirection="column" borderStyle="round" borderColor={colors.borderColor} padding={1} marginBottom={1}>
        <Text bold color={colors.textPrimary}>
          📋 Tasks
        </Text>
        <Box marginTop={1}>
          <Box marginRight={3}>
            <Text color={colors.textSecondary}>Total: </Text>
            <Text bold color={colors.accentCyan}>
              {taskStats.total}
            </Text>
          </Box>
          <Box marginRight={2}>
            <Text color={colors.textTertiary}>○ {taskStats.pending}</Text>
          </Box>
          <Box marginRight={2}>
            <Text color={colors.accentYellow}>◐ {taskStats.inProgress}</Text>
          </Box>
          <Box marginRight={2}>
            <Text color={colors.accentGreen}>● {taskStats.completed}</Text>
          </Box>
          <Box>
            <Text color={colors.accentOrange}>✗ {taskStats.blocked}</Text>
          </Box>
        </Box>

        {/* Progress bar */}
        {taskStats.total > 0 && (
          <Box marginTop={1}>
            <Text color={colors.textSecondary}>Progress: </Text>
            <Text color={colors.accentGreen}>
              {'█'.repeat(
                Math.round((taskStats.completed / taskStats.total) * 10)
              )}
            </Text>
            <Text color={colors.textTertiary}>
              {'░'.repeat(
                10 - Math.round((taskStats.completed / taskStats.total) * 10)
              )}
            </Text>
            <Text color={colors.textSecondary}>
              {' '}
              {Math.round((taskStats.completed / taskStats.total) * 100)}%
            </Text>
          </Box>
        )}
      </Box>

      {/* Agents */}
      <Box flexDirection="column" borderStyle="round" borderColor={colors.borderColor} padding={1} marginBottom={1}>
        <Text bold color={colors.textPrimary}>
          🤖 Agents ({agentStats.total})
        </Text>
        {agents.length > 0 ? (
          <Box marginTop={1} flexWrap="wrap">
            {agents.slice(0, 5).map((agent) => (
              <Box key={agent.id} marginRight={2}>
                <Text color={colors.accentCyan}>• {agent.name}</Text>
                <Text color={colors.textTertiary}> ({agent.cli_type})</Text>
              </Box>
            ))}
            {agents.length > 5 && (
              <Text color={colors.textTertiary}>
                +{agents.length - 5} more
              </Text>
            )}
          </Box>
        ) : (
          <Text color={colors.textTertiary}>No agents configured</Text>
        )}
      </Box>

      {/* Ports */}
      {ports.length > 0 && (
        <Box flexDirection="column" borderStyle="round" borderColor={colors.borderColor} padding={1} marginBottom={1}>
          <Text bold color={colors.textPrimary}>
            🔌 Active Ports ({ports.length})
          </Text>
          <Box marginTop={1}>
            {ports.slice(0, 6).map((port, i) => (
              <Text key={i} color={colors.accentCyan}>
                :{port.port}
                {i < Math.min(ports.length, 6) - 1 ? '  ' : ''}
              </Text>
            ))}
            {ports.length > 6 && (
              <Text color={colors.textTertiary}>+{ports.length - 6}</Text>
            )}
          </Box>
        </Box>
      )}

      <Newline />

      {/* Actions */}
      <Box flexDirection="column">
        <Text bold color={colors.textPrimary}>
          Quick Actions
        </Text>
        <Box marginTop={1}>
          <Box marginRight={3}>
            <Text bold color={colors.accentCyan}>
              [o]
            </Text>
            <Text color={colors.textSecondary}> Open in Editor</Text>
          </Box>
          <Box marginRight={3}>
            <Text bold color={colors.accentCyan}>
              [a]
            </Text>
            <Text color={colors.textSecondary}> Add Task</Text>
          </Box>
          <Box marginRight={3}>
            <Text bold color={colors.accentCyan}>
              [s]
            </Text>
            <Text color={colors.textSecondary}> Spawn Agent</Text>
          </Box>
          <Box>
            <Text bold color={colors.accentCyan}>
              [Esc]
            </Text>
            <Text color={colors.textSecondary}> Back</Text>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default ProjectDetail;