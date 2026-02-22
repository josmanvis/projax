import React from 'react';
import { Box, Text, Newline } from 'ink';
import { TodoTask, Agent } from 'projax-api/types';
import { PRIORITY_COLORS, STATUS_CONFIG, AGENT_CONFIGS } from '../utils/agent-configs';

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
  accentRed: '#f85149',
  accentPurple: '#bc8cff',
};

interface TaskDetailProps {
  task: TodoTask;
  assignedAgent: Agent | null;
  onStart?: () => void;
  onMerge?: () => void;
  onAbort?: () => void;
  onReassign?: () => void;
  onToggleStatus?: () => void;
  onDelete?: () => void;
  onBack?: () => void;
}

const truncate = (text: string, max: number) =>
  text?.length > max ? text.slice(0, max - 3) + '...' : text || '';

const formatDate = (timestamp: number | null) => {
  if (!timestamp) return 'N/A';
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const TaskDetail: React.FC<TaskDetailProps> = ({
  task,
  assignedAgent,
  onStart,
  onMerge,
  onAbort,
  onReassign,
  onToggleStatus,
  onDelete,
  onBack,
}) => {
  const statusConfig = STATUS_CONFIG[task.status] || STATUS_CONFIG.pending;
  const priorityColor = PRIORITY_COLORS[task.priority] || colors.textSecondary;

  return (
    <Box flexDirection="column" flexGrow={1} padding={1}>
      {/* Header with status icon */}
      <Box marginBottom={1}>
        <Text color={statusConfig.color} bold>
          {statusConfig.icon}{' '}
        </Text>
        <Text bold color={colors.textPrimary}>
          {task.title}
        </Text>
      </Box>

      {/* Status and Priority */}
      <Box marginBottom={1}>
        <Box marginRight={3}>
          <Text color={colors.textSecondary}>Status: </Text>
          <Text color={statusConfig.color}>{task.status.replace('_', ' ')}</Text>
        </Box>
        <Box>
          <Text color={colors.textSecondary}>Priority: </Text>
          <Text color={priorityColor}>{task.priority}</Text>
        </Box>
      </Box>

      {/* Description */}
      {task.description && (
        <Box flexDirection="column" marginBottom={1}>
          <Text color={colors.textSecondary}>Description:</Text>
          <Text color={colors.textPrimary}>  {task.description}</Text>
        </Box>
      )}

      <Newline />

      {/* Assigned Agent */}
      <Box flexDirection="column" borderStyle="round" borderColor={colors.borderColor} padding={1} marginBottom={1}>
        <Text bold color={colors.textPrimary}>
          🤖 Assigned Agent
        </Text>
        {assignedAgent ? (
          <Box marginTop={1}>
            <Text color={colors.accentCyan}>{assignedAgent.name}</Text>
            <Text color={colors.textSecondary}>
              {' '}
              ({AGENT_CONFIGS[assignedAgent.cli_type]?.icon || '◆'} {assignedAgent.cli_type}
              {assignedAgent.model && `, ${assignedAgent.model}`})
            </Text>
          </Box>
        ) : (
          <Text color={colors.textTertiary} marginTop={1}>
            No agent assigned
          </Text>
        )}
      </Box>

      {/* Worktree Status */}
      {task.worktree_path && (
        <Box flexDirection="column" borderStyle="round" borderColor={colors.accentGreen} padding={1} marginBottom={1}>
          <Text bold color={colors.textPrimary}>
            🌿 Active Worktree
          </Text>
          <Box marginTop={1}>
            <Text color={colors.textSecondary}>Path: </Text>
            <Text color={colors.textPrimary}>{truncate(task.worktree_path, 50)}</Text>
          </Box>
          {task.worktree_branch && (
            <Box>
              <Text color={colors.textSecondary}>Branch: </Text>
              <Text color={colors.accentCyan}>{task.worktree_branch}</Text>
            </Box>
          )}
        </Box>
      )}

      {/* Timestamps */}
      <Box flexDirection="column" marginBottom={1}>
        <Text color={colors.textSecondary}>
          Created: {formatDate(task.created_at)}
        </Text>
        {task.completed_at && (
          <Text color={colors.accentGreen}>
            Completed: {formatDate(task.completed_at)}
          </Text>
        )}
      </Box>

      <Newline />

      {/* Actions */}
      <Box flexDirection="column">
        <Text bold color={colors.textPrimary}>
          Actions
        </Text>
        <Box marginTop={1} flexWrap="wrap">
          {/* Status toggle */}
          {onToggleStatus && (
            <Box marginRight={3}>
              <Text bold color={colors.accentCyan}>
                [Space]
              </Text>
              <Text color={colors.textSecondary}> Toggle Status</Text>
            </Box>
          )}

          {/* Start agent */}
          {onStart && task.assignee_agent_id && !task.worktree_path && (
            <Box marginRight={3}>
              <Text bold color={colors.accentCyan}>
                [s]
              </Text>
              <Text color={colors.textSecondary}> Start Agent</Text>
            </Box>
          )}

          {/* Merge worktree */}
          {onMerge && task.worktree_path && (
            <Box marginRight={3}>
              <Text bold color={colors.accentGreen}>
                [m]
              </Text>
              <Text color={colors.textSecondary}> Merge</Text>
            </Box>
          )}

          {/* Abort worktree */}
          {onAbort && task.worktree_path && (
            <Box marginRight={3}>
              <Text bold color={colors.accentOrange}>
                [x]
              </Text>
              <Text color={colors.textSecondary}> Abort</Text>
            </Box>
          )}

          {/* Reassign */}
          {onReassign && (
            <Box marginRight={3}>
              <Text bold color={colors.accentCyan}>
                [g]
              </Text>
              <Text color={colors.textSecondary}> Reassign</Text>
            </Box>
          )}

          {/* Delete */}
          {onDelete && (
            <Box marginRight={3}>
              <Text bold color={colors.accentRed}>
                [d]
              </Text>
              <Text color={colors.textSecondary}> Delete</Text>
            </Box>
          )}

          {/* Back */}
          {onBack && (
            <Box>
              <Text bold color={colors.accentCyan}>
                [Esc]
              </Text>
              <Text color={colors.textSecondary}> Back</Text>
            </Box>
          )}
        </Box>
      </Box>

      {/* Context-sensitive help */}
      {task.status === 'in_progress' && task.worktree_path && (
        <Box marginTop={1}>
          <Text color={colors.textTertiary}>
            💡 The agent is working in a sandbox. Merge when done or Abort to discard.
          </Text>
        </Box>
      )}

      {task.status === 'pending' && !task.assignee_agent_id && (
        <Box marginTop={1}>
          <Text color={colors.textTertiary}>
            💡 Assign an agent first to start working on this task.
          </Text>
        </Box>
      )}
    </Box>
  );
};

export default TaskDetail;