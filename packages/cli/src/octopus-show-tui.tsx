import React, { useState, useEffect, useCallback } from 'react';
import {
  render,
  Box,
  Text,
  useInput,
  useApp,
  Newline,
} from 'ink';
import TextInput from 'ink-text-input';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import { execSync } from 'child_process';

// Color scheme
const colors = {
  bgPrimary: '#0d1117',
  bgSecondary: '#161b22',
  borderColor: '#30363d',
  textPrimary: '#c9d1d9',
  textSecondary: '#8b949e',
  textTertiary: '#6e7681',
  accentCyan: '#39c5cf',
  accentBlue: '#58a6ff',
  accentGreen: '#3fb950',
  accentPurple: '#bc8cff',
  accentOrange: '#ffa657',
  accentRed: '#f85149',
  accentYellow: '#d29922',
};

// Types
interface Project {
  id: number;
  name: string;
  path: string;
  description: string | null;
  framework: string | null;
  tags?: string[];
}

interface TodoList {
  id: number;
  project_id: number;
  name: string;
  description: string | null;
  task_count?: number;
  completed_count?: number;
  in_progress_count?: number;
}

interface TodoTask {
  id: number;
  list_id: number;
  title: string;
  description: string | null;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  order: number;
  assignee_agent_id: number | null;
  worktree_path: string | null;
  worktree_branch: string | null;
  created_at: number;
  updated_at: number;
  completed_at: number | null;
}

interface Agent {
  id: number;
  project_id: number;
  name: string;
  cli_type: string;
  model: string | null;
}

interface AgentTaskRun {
  id: number;
  agent_id: number;
  task_id: number;
  worktree_path: string;
  worktree_branch: string;
  status: 'running' | 'completed' | 'failed' | 'aborted';
  started_at: number;
  completed_at: number | null;
}

// API helper
class ApiClient {
  private baseUrl: string;

  constructor() {
    const dataDir = path.join(os.homedir(), '.projax');
    const portFile = path.join(dataDir, 'api-port.txt');
    let port = 38124;
    
    if (fs.existsSync(portFile)) {
      try {
        port = parseInt(fs.readFileSync(portFile, 'utf-8').trim(), 10) || 38124;
      } catch (e) { /* Ignore error, use default port */ }
    }
    
    this.baseUrl = `http://localhost:${port}/api`;
  }

  private request<T>(endpoint: string, options: { method?: string; body?: string } = {}): T {
    const url = `${this.baseUrl}${endpoint}`;
    const method = options.method || 'GET';
    
    const curlCmd = method === 'GET' 
      ? `curl -s -f "${url}"`
      : method === 'DELETE'
      ? `curl -s -f -X DELETE "${url}"`
      : `curl -s -f -X ${method} -H "Content-Type: application/json" ${options.body ? `-d '${options.body}'` : ''} "${url}"`;

    const result = execSync(curlCmd, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
    
    if (!result || result.trim() === '') {
      return undefined as T;
    }
    
    return JSON.parse(result) as T;
  }

  // Projects
  getProjects(): Project[] {
    return this.request<Project[]>('/projects') || [];
  }

  // Todo Lists
  getTodoLists(projectId: number): TodoList[] {
    return this.request<TodoList[]>(`/projects/${projectId}/todo-lists`) || [];
  }

  createTodoList(projectId: number, name: string, description?: string): TodoList {
    return this.request<TodoList>(`/projects/${projectId}/todo-lists`, {
      method: 'POST',
      body: JSON.stringify({ name, description }),
    });
  }

  updateTodoList(id: number, updates: { name?: string; description?: string }): TodoList {
    return this.request<TodoList>(`/todo-lists/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  deleteTodoList(id: number): void {
    this.request(`/todo-lists/${id}`, { method: 'DELETE' });
  }

  // Tasks
  getTasks(listId: number): TodoTask[] {
    return this.request<TodoTask[]>(`/todo-lists/${listId}/tasks`) || [];
  }

  getProjectTasks(projectId: number): TodoTask[] {
    return this.request<TodoTask[]>(`/projects/${projectId}/tasks`) || [];
  }

  createTask(listId: number, title: string, priority?: string, description?: string): TodoTask {
    return this.request<TodoTask>(`/todo-lists/${listId}/tasks`, {
      method: 'POST',
      body: JSON.stringify({ title, priority, description }),
    });
  }

  updateTask(id: number, updates: Partial<TodoTask>): TodoTask {
    return this.request<TodoTask>(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  deleteTask(id: number): void {
    this.request(`/tasks/${id}`, { method: 'DELETE' });
  }

  toggleTask(id: number): TodoTask {
    return this.request<TodoTask>(`/tasks/${id}/toggle`, { method: 'POST' });
  }

  // Agents
  getAgents(projectId: number): Agent[] {
    return this.request<Agent[]>(`/projects/${projectId}/agents`) || [];
  }

  assignAgent(taskId: number, agentId: number | null): TodoTask {
    return this.request<TodoTask>(`/tasks/${taskId}/assign-agent`, {
      method: 'POST',
      body: JSON.stringify({ agent_id: agentId }),
    });
  }

  startTask(taskId: number): { task: TodoTask; run: AgentTaskRun; worktree: { path: string; branch: string } } {
    return this.request(`/tasks/${taskId}/start`, { method: 'POST' });
  }

  mergeTask(taskId: number): { task: TodoTask; merged: boolean; branch: string } {
    return this.request(`/tasks/${taskId}/merge`, { method: 'POST' });
  }

  abortTask(taskId: number): { task: TodoTask; aborted: boolean } {
    return this.request(`/tasks/${taskId}/abort`, { method: 'POST' });
  }

  getRunningRuns(): AgentTaskRun[] {
    return this.request<AgentTaskRun[]>('/runs/running') || [];
  }
}

const api = new ApiClient();

// Priority colors
const priorityColors: Record<string, string> = {
  low: colors.textTertiary,
  medium: colors.accentYellow,
  high: colors.accentOrange,
  urgent: colors.accentRed,
};

// Status colors and icons
const statusConfig: Record<string, { color: string; icon: string }> = {
  pending: { color: colors.textTertiary, icon: '○' },
  in_progress: { color: colors.accentYellow, icon: '◐' },
  completed: { color: colors.accentGreen, icon: '●' },
  blocked: { color: colors.accentRed, icon: '✗' },
};

// Help Modal
const HelpModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  useInput((input, key) => {
    if (key.escape || input === 'q' || key.return) {
      onClose();
    }
  });

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor={colors.accentCyan}
      padding={1}
      width={80}
    >
      <Text bold color={colors.accentCyan}>
        🐙 Octopus - Task Manager Help
      </Text>
      <Newline />
      <Text color={colors.accentCyan}>Navigation:</Text>
      <Text>  ↑/k  ↓/j      Move up/down in lists</Text>
      <Text>  Tab/←→        Switch between panels</Text>
      <Text>  Enter         Select / Toggle task status</Text>
      <Newline />
      <Text color={colors.accentCyan}>Project Panel:</Text>
      <Text>  n             Create new todo list</Text>
      <Text>  d             Delete todo list</Text>
      <Text>  r             Rename todo list</Text>
      <Newline />
      <Text color={colors.accentCyan}>Task Panel:</Text>
      <Text>  a             Add new task</Text>
      <Text>  e             Edit task title</Text>
      <Text>  d             Delete task</Text>
      <Text>  Space         Toggle task status</Text>
      <Text>  g             Assign agent to task</Text>
      <Text>  s             Start agent (creates worktree)</Text>
      <Text>  m             Merge worktree back</Text>
      <Text>  x             Abort worktree</Text>
      <Newline />
      <Text color={colors.accentCyan}>General:</Text>
      <Text>  ?             Show this help</Text>
      <Text>  q/Esc         Quit</Text>
      <Newline />
      <Text color={colors.textSecondary}>Press any key to close...</Text>
    </Box>
  );
};

// Input Modal
const InputModal: React.FC<{
  title: string;
  initialValue?: string;
  onSubmit: (value: string) => void;
  onCancel: () => void;
}> = ({ title, initialValue = '', onSubmit, onCancel }) => {
  const [value, setValue] = useState(initialValue);

  useInput((input, key) => {
    if (key.escape) {
      onCancel();
    }
    if (key.return) {
      if (value.trim()) {
        onSubmit(value.trim());
      }
    }
  });

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor={colors.accentCyan}
      padding={1}
      width={60}
    >
      <Text bold color={colors.accentCyan}>
        {title}
      </Text>
      <Newline />
      <Box>
        <Text color={colors.textSecondary}> </Text>
        <TextInput value={value} onChange={setValue} placeholder="Enter value..." />
      </Box>
      <Newline />
      <Text color={colors.textSecondary}>Press Enter to confirm, Esc to cancel</Text>
    </Box>
  );
};

// Confirm Modal
const ConfirmModal: React.FC<{
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ message, onConfirm, onCancel }) => {
  useInput((input, key) => {
    if (key.escape || input === 'n') {
      onCancel();
    }
    if (input === 'y' || key.return) {
      onConfirm();
    }
  });

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor={colors.accentRed}
      padding={1}
      width={60}
    >
      <Text bold color={colors.accentRed}>
        Confirm Action
      </Text>
      <Newline />
      <Text>{message}</Text>
      <Newline />
      <Text color={colors.textSecondary}>Press y/Enter to confirm, n/Esc to cancel</Text>
    </Box>
  );
};

// Project List Panel
const ProjectListPanel: React.FC<{
  projects: Project[];
  todoLists: TodoList[];
  selectedProjectIndex: number;
  selectedListIndex: number;
  isFocused: boolean;
  height: number;
  onSelectProject: (index: number) => void;
  onSelectList: (index: number) => void;
}> = ({
  projects,
  todoLists,
  selectedProjectIndex,
  selectedListIndex,
  isFocused,
  height,
  onSelectProject,
  onSelectList,
}) => {
  const scrollOffset = Math.max(0, selectedProjectIndex - Math.floor(height / 3));
  const visibleProjects = projects.slice(scrollOffset, scrollOffset + height - 6);

  return (
    <Box
      flexDirection="column"
      width="30%"
      height={height}
      borderStyle="round"
      borderColor={isFocused ? colors.accentCyan : colors.borderColor}
      padding={1}
    >
      <Text bold color={colors.textPrimary}>
        Projects ({projects.length})
      </Text>
      <Newline />
      
      {projects.length === 0 ? (
        <Text color={colors.textTertiary}>No projects found</Text>
      ) : (
        <Box flexDirection="column">
          {visibleProjects.map((project, idx) => {
            const actualIndex = scrollOffset + idx;
            const isSelected = actualIndex === selectedProjectIndex;
            const listCount = todoLists.filter(l => l.project_id === project.id).length;
            
            return (
              <Box key={project.id}>
                <Text
                  color={isSelected ? colors.accentCyan : colors.textPrimary}
                  bold={isSelected}
                >
                  {isSelected ? '▶ ' : '  '}
                  {project.name}
                </Text>
                {listCount > 0 && (
                  <Text color={colors.textTertiary}> [{listCount}]</Text>
                )}
              </Box>
            );
          })}
        </Box>
      )}
      
      {todoLists.length > 0 && selectedProjectIndex < projects.length && (
        <>
          <Newline />
          <Text bold color={colors.accentPurple}>
            Todo Lists
          </Text>
          {todoLists
            .filter(l => l.project_id === projects[selectedProjectIndex]?.id)
            .map((list, idx) => {
              const isSelected = idx === selectedListIndex;
              return (
                <Box key={list.id}>
                  <Text
                    color={isSelected ? colors.accentPurple : colors.textSecondary}
                    bold={isSelected}
                  >
                    {isSelected ? '▶ ' : '  '}
                    {list.name}
                  </Text>
                  {list.task_count !== undefined && (
                    <Text color={colors.textTertiary}>
                      {' '}
                      [{list.completed_count || 0}/{list.task_count}]
                    </Text>
                  )}
                </Box>
              );
            })}
        </>
      )}
    </Box>
  );
};

// Task Panel
const TaskPanel: React.FC<{
  tasks: TodoTask[];
  agents: Agent[];
  runningRuns: AgentTaskRun[];
  selectedTaskIndex: number;
  selectedList: TodoList | null;
  isFocused: boolean;
  height: number;
  onSelectTask: (index: number) => void;
}> = ({
  tasks,
  agents,
  runningRuns,
  selectedTaskIndex,
  selectedList,
  isFocused,
  height,
  onSelectTask,
}) => {
  const scrollOffset = Math.max(0, selectedTaskIndex - Math.floor(height / 3));
  const visibleTasks = tasks.slice(scrollOffset, scrollOffset + height - 10);

  const getAgentName = (agentId: number | null) => {
    if (!agentId) return null;
    const agent = agents.find(a => a.id === agentId);
    return agent?.name || `Agent ${agentId}`;
  };

  const isTaskRunning = (taskId: number) => {
    return runningRuns.some(r => r.task_id === taskId && r.status === 'running');
  };

  return (
    <Box
      flexDirection="column"
      width="70%"
      height={height}
      borderStyle="round"
      borderColor={isFocused ? colors.accentCyan : colors.borderColor}
      padding={1}
    >
      <Box justifyContent="space-between">
        <Text bold color={colors.textPrimary}>
          {selectedList?.name || 'Tasks'}
        </Text>
        <Text color={colors.textSecondary}>
          {tasks.filter(t => t.status === 'completed').length}/{tasks.length} completed
        </Text>
      </Box>
      <Newline />

      {tasks.length === 0 ? (
        <Text color={colors.textTertiary}>
          No tasks. Press 'a' to add a new task.
        </Text>
      ) : (
        <Box flexDirection="column">
          {visibleTasks.map((task, idx) => {
            const actualIndex = scrollOffset + idx;
            const isSelected = actualIndex === selectedTaskIndex;
            const config = statusConfig[task.status];
            const isRunning = isTaskRunning(task.id);
            const agentName = getAgentName(task.assignee_agent_id);

            return (
              <Box key={task.id} flexDirection="column">
                <Box>
                  <Text
                    color={isSelected ? colors.accentCyan : colors.textPrimary}
                    bold={isSelected}
                  >
                    {isSelected ? '▶ ' : '  '}
                    <Text color={config.color}>{config.icon}</Text>
                    {' '}
                    {task.title}
                  </Text>
                  {isRunning && (
                    <Text color={colors.accentGreen}> ●</Text>
                  )}
                </Box>
                <Box marginLeft={4}>
                  <Text color={priorityColors[task.priority]}>
                    [{task.priority}]
                  </Text>
                  {agentName && (
                    <Text color={colors.accentPurple}> @{agentName}</Text>
                  )}
                  {task.worktree_path && (
                    <Text color={colors.accentBlue}> 🌿</Text>
                  )}
                </Box>
              </Box>
            );
          })}
        </Box>
      )}

      {/* Running Agents Section */}
      {runningRuns.length > 0 && (
        <>
          <Newline />
          <Text bold color={colors.accentGreen}>
            Running Agents ({runningRuns.length})
          </Text>
          {runningRuns.map(run => {
            const task = tasks.find(t => t.id === run.task_id);
            const agent = agents.find(a => a.id === run.agent_id);
            const elapsed = Math.floor((Date.now() - run.started_at * 1000) / 1000);
            const minutes = Math.floor(elapsed / 60);
            const seconds = elapsed % 60;

            return (
              <Box key={run.id}>
                <Text color={colors.accentGreen}>● </Text>
                <Text color={colors.textPrimary}>
                  {agent?.name || `Agent ${run.agent_id}`}
                </Text>
                <Text color={colors.textSecondary}>
                  {' → '}
                  {task?.title || `Task ${run.task_id}`}
                </Text>
                <Text color={colors.textTertiary}>
                  {' '}
                  ({minutes}m {seconds}s)
                </Text>
              </Box>
            );
          })}
        </>
      )}
    </Box>
  );
};

// Status Bar
const StatusBar: React.FC<{
  focusedPanel: 'projects' | 'tasks';
  selectedTask: TodoTask | null;
}> = ({ focusedPanel, selectedTask }) => {
  if (focusedPanel === 'projects') {
    return (
      <Box flexDirection="column">
        <Box>
          <Text color={colors.accentGreen}>● API</Text>
          <Text color={colors.textSecondary}> | </Text>
          <Text color={colors.accentCyan}>Focus: Projects</Text>
        </Box>
        <Box>
          <Text bold>↑↓/jk</Text>
          <Text color={colors.textSecondary}> Navigate | </Text>
          <Text bold>n</Text>
          <Text color={colors.textSecondary}> New list | </Text>
          <Text bold>d</Text>
          <Text color={colors.textSecondary}> Delete | </Text>
          <Text bold>Tab</Text>
          <Text color={colors.textSecondary}> Switch | </Text>
          <Text bold>?</Text>
          <Text color={colors.textSecondary}> Help | </Text>
          <Text bold>q</Text>
          <Text color={colors.textSecondary}> Quit</Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <Box>
        <Text color={colors.accentGreen}>● API</Text>
        <Text color={colors.textSecondary}> | </Text>
        <Text color={colors.accentCyan}>Focus: Tasks</Text>
        {selectedTask && (
          <>
            <Text color={colors.textSecondary}> | </Text>
            <Text color={colors.textPrimary}>{selectedTask.title}</Text>
          </>
        )}
      </Box>
      <Box>
        <Text bold>↑↓/jk</Text>
        <Text color={colors.textSecondary}> Navigate | </Text>
        <Text bold>Space</Text>
        <Text color={colors.textSecondary}> Toggle | </Text>
        <Text bold>a</Text>
        <Text color={colors.textSecondary}> Add | </Text>
        <Text bold>s</Text>
        <Text color={colors.textSecondary}> Start | </Text>
        <Text bold>m</Text>
        <Text color={colors.textSecondary}> Merge | </Text>
        <Text bold>g</Text>
        <Text color={colors.textSecondary}> Assign | </Text>
        <Text bold>Tab</Text>
        <Text color={colors.textSecondary}> Switch | </Text>
        <Text bold>?</Text>
        <Text color={colors.textSecondary}> Help</Text>
      </Box>
    </Box>
  );
};

// Main App
const App: React.FC = () => {
  const { exit } = useApp();
  
  // Data state
  const [projects, setProjects] = useState<Project[]>([]);
  const [todoLists, setTodoLists] = useState<TodoList[]>([]);
  const [tasks, setTasks] = useState<TodoTask[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [runningRuns, setRunningRuns] = useState<AgentTaskRun[]>([]);
  
  // UI state
  const [focusedPanel, setFocusedPanel] = useState<'projects' | 'tasks'>('projects');
  const [selectedProjectIndex, setSelectedProjectIndex] = useState(0);
  const [selectedListIndex, setSelectedListIndex] = useState(0);
  const [selectedTaskIndex, setSelectedTaskIndex] = useState(0);
  
  // Modal state
  const [showHelp, setShowHelp] = useState(false);
  const [showInput, setShowInput] = useState<{
    type: 'newList' | 'newTask' | 'editTask' | 'renameList';
    title: string;
    initialValue?: string;
  } | null>(null);
  const [showConfirm, setShowConfirm] = useState<{
    message: string;
    action: () => void;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const terminalHeight = process.stdout.rows || 24;
  const panelHeight = terminalHeight - 6;

  // Load initial data
  useEffect(() => {
    loadData();
    const interval = setInterval(loadRunningRuns, 5000);
    return () => clearInterval(interval);
  }, []);

  // Load tasks when list selection changes
  useEffect(() => {
    loadTasks();
    loadAgents();
  }, [selectedProjectIndex, selectedListIndex, todoLists]);

  const loadData = useCallback(() => {
    try {
      const projs = api.getProjects();
      setProjects(projs);
      
      // Load all todo lists
      const allLists: TodoList[] = [];
      projs.forEach(p => {
        const lists = api.getTodoLists(p.id);
        allLists.push(...lists);
      });
      setTodoLists(allLists);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    }
  }, []);

  const loadTasks = useCallback(() => {
    if (projects.length === 0) return;
    
    const project = projects[selectedProjectIndex];
    if (!project) return;

    const projectLists = todoLists.filter(l => l.project_id === project.id);
    const selectedList = projectLists[selectedListIndex];
    
    if (selectedList) {
      try {
        const taskList = api.getTasks(selectedList.id);
        setTasks(taskList);
      } catch (err) {
        setTasks([]);
      }
    } else {
      // Show all tasks for project
      try {
        const allTasks = api.getProjectTasks(project.id);
        setTasks(allTasks);
      } catch (err) {
        setTasks([]);
      }
    }
    setSelectedTaskIndex(0);
  }, [projects, selectedProjectIndex, selectedListIndex, todoLists]);

  const loadAgents = useCallback(() => {
    if (projects.length === 0) return;
    
    const project = projects[selectedProjectIndex];
    if (!project) return;

    try {
      const agentList = api.getAgents(project.id);
      setAgents(agentList);
    } catch (err) {
      setAgents([]);
    }
  }, [projects, selectedProjectIndex]);

  const loadRunningRuns = useCallback(() => {
    try {
      const runs = api.getRunningRuns();
      setRunningRuns(runs);
    } catch {
      setRunningRuns([]);
    }
  }, []);

  // Get selected items
  const selectedProject = projects[selectedProjectIndex];
  const projectLists = todoLists.filter(l => l.project_id === selectedProject?.id);
  const selectedList = projectLists[selectedListIndex] || null;
  const selectedTask = tasks[selectedTaskIndex] || null;

  // Input handling
  useInput((input, key) => {
    // Handle modals
    if (showHelp) {
      if (key.escape || input === 'q' || key.return) {
        setShowHelp(false);
      }
      return;
    }

    if (showInput) {
      return; // Input modal handles its own input
    }

    if (showConfirm) {
      return; // Confirm modal handles its own input
    }

    if (error) {
      if (key.escape || key.return) {
        setError(null);
      }
      return;
    }

    // Quit
    if (input === 'q' || key.escape) {
      exit();
      return;
    }

    // Help
    if (input === '?') {
      setShowHelp(true);
      return;
    }

    // Switch panels
    if (key.tab || key.leftArrow || key.rightArrow) {
      setFocusedPanel(prev => prev === 'projects' ? 'tasks' : 'projects');
      return;
    }

    // Project panel navigation
    if (focusedPanel === 'projects') {
      if (key.upArrow || input === 'k') {
        if (key.shift || selectedListIndex === 0) {
          setSelectedProjectIndex(prev => Math.max(0, prev - 1));
          setSelectedListIndex(0);
        } else {
          setSelectedListIndex(prev => Math.max(0, prev - 1));
        }
        return;
      }

      if (key.downArrow || input === 'j') {
        const projectListsCount = todoLists.filter(l => l.project_id === selectedProject?.id).length;
        if (key.shift || selectedListIndex >= projectListsCount - 1) {
          setSelectedProjectIndex(prev => Math.min(projects.length - 1, prev + 1));
          setSelectedListIndex(0);
        } else {
          setSelectedListIndex(prev => Math.min(projectListsCount - 1, prev + 1));
        }
        return;
      }

      // New list
      if (input === 'n' && selectedProject) {
        setShowInput({
          type: 'newList',
          title: `New Todo List for ${selectedProject.name}`,
        });
        return;
      }

      // Delete list
      if (input === 'd' && selectedList) {
        setShowConfirm({
          message: `Delete "${selectedList.name}" and all its tasks?`,
          action: () => {
            try {
              api.deleteTodoList(selectedList.id);
              loadData();
              setSelectedListIndex(0);
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Failed to delete list');
            }
          },
        });
        return;
      }

      // Rename list
      if (input === 'r' && selectedList) {
        setShowInput({
          type: 'renameList',
          title: 'Rename Todo List',
          initialValue: selectedList.name,
        });
        return;
      }
    }

    // Task panel navigation
    if (focusedPanel === 'tasks') {
      if (key.upArrow || input === 'k') {
        setSelectedTaskIndex(prev => Math.max(0, prev - 1));
        return;
      }

      if (key.downArrow || input === 'j') {
        setSelectedTaskIndex(prev => Math.min(tasks.length - 1, prev + 1));
        return;
      }

      // Toggle task status
      if (key.return || input === ' ') {
        if (selectedTask) {
          try {
            api.toggleTask(selectedTask.id);
            loadTasks();
            loadRunningRuns();
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to toggle task');
          }
        }
        return;
      }

      // Add task
      if (input === 'a' && selectedList) {
        setShowInput({
          type: 'newTask',
          title: `New Task in ${selectedList.name}`,
        });
        return;
      }

      // Edit task
      if (input === 'e' && selectedTask) {
        setShowInput({
          type: 'editTask',
          title: 'Edit Task',
          initialValue: selectedTask.title,
        });
        return;
      }

      // Delete task
      if (input === 'd' && selectedTask) {
        setShowConfirm({
          message: `Delete task "${selectedTask.title}"?`,
          action: () => {
            try {
              api.deleteTask(selectedTask.id);
              loadTasks();
              setSelectedTaskIndex(Math.max(0, selectedTaskIndex - 1));
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Failed to delete task');
            }
          },
        });
        return;
      }

      // Assign agent
      if (input === 'g' && selectedTask && agents.length > 0) {
        // Cycle through agents
        const currentIdx = agents.findIndex(a => a.id === selectedTask.assignee_agent_id);
        const nextIdx = (currentIdx + 1) % (agents.length + 1);
        const nextAgentId = nextIdx === agents.length ? null : agents[nextIdx].id;
        
        try {
          api.assignAgent(selectedTask.id, nextAgentId);
          loadTasks();
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to assign agent');
        }
        return;
      }

      // Start agent on task
      if (input === 's' && selectedTask && selectedTask.assignee_agent_id) {
        try {
          api.startTask(selectedTask.id);
          loadTasks();
          loadRunningRuns();
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to start task');
        }
        return;
      }

      // Merge task worktree
      if (input === 'm' && selectedTask && selectedTask.worktree_path) {
        setShowConfirm({
          message: `Merge worktree for "${selectedTask.title}"?`,
          action: () => {
            try {
              api.mergeTask(selectedTask.id);
              loadTasks();
              loadRunningRuns();
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Failed to merge task');
            }
          },
        });
        return;
      }

      // Abort task worktree
      if (input === 'x' && selectedTask && selectedTask.worktree_path) {
        setShowConfirm({
          message: `Abort worktree for "${selectedTask.title}"? Changes will be lost.`,
          action: () => {
            try {
              api.abortTask(selectedTask.id);
              loadTasks();
              loadRunningRuns();
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Failed to abort task');
            }
          },
        });
        return;
      }
    }
  });

  // Handle input modal submit
  const handleInputSubmit = (value: string) => {
    if (!showInput) return;

    try {
      if (showInput.type === 'newList' && selectedProject) {
        api.createTodoList(selectedProject.id, value);
        loadData();
      } else if (showInput.type === 'renameList' && selectedList) {
        api.updateTodoList(selectedList.id, { name: value });
        loadData();
      } else if (showInput.type === 'newTask' && selectedList) {
        api.createTask(selectedList.id, value);
        loadTasks();
      } else if (showInput.type === 'editTask' && selectedTask) {
        api.updateTask(selectedTask.id, { title: value });
        loadTasks();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Operation failed');
    }

    setShowInput(null);
  };

  // Render modals
  if (showHelp) {
    return (
      <Box padding={1}>
        <HelpModal onClose={() => setShowHelp(false)} />
      </Box>
    );
  }

  if (showInput) {
    return (
      <Box padding={1}>
        <InputModal
          title={showInput.title}
          initialValue={showInput.initialValue}
          onSubmit={handleInputSubmit}
          onCancel={() => setShowInput(null)}
        />
      </Box>
    );
  }

  if (showConfirm) {
    return (
      <Box padding={1}>
        <ConfirmModal
          message={showConfirm.message}
          onConfirm={() => {
            showConfirm.action();
            setShowConfirm(null);
          }}
          onCancel={() => setShowConfirm(null)}
        />
      </Box>
    );
  }

  if (error) {
    return (
      <Box padding={1}>
        <Box
          flexDirection="column"
          borderStyle="round"
          borderColor={colors.accentRed}
          padding={1}
          width={60}
        >
          <Text bold color={colors.accentRed}>Error</Text>
          <Newline />
          <Text>{error}</Text>
          <Newline />
          <Text color={colors.textSecondary}>Press any key to dismiss...</Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" height={terminalHeight}>
      {/* Header */}
      <Box paddingX={1}>
        <Text bold color={colors.accentCyan}>
          🐙 Octopus Task Manager
        </Text>
        <Text color={colors.textSecondary}> - Manage project tasks with AI agents</Text>
      </Box>

      {/* Main Content */}
      <Box flexDirection="row" height={panelHeight} flexGrow={0} flexShrink={0}>
        <ProjectListPanel
          projects={projects}
          todoLists={todoLists}
          selectedProjectIndex={selectedProjectIndex}
          selectedListIndex={selectedListIndex}
          isFocused={focusedPanel === 'projects'}
          height={panelHeight}
          onSelectProject={setSelectedProjectIndex}
          onSelectList={setSelectedListIndex}
        />
        <Box width={1} />
        <TaskPanel
          tasks={tasks}
          agents={agents}
          runningRuns={runningRuns}
          selectedTaskIndex={selectedTaskIndex}
          selectedList={selectedList}
          isFocused={focusedPanel === 'tasks'}
          height={panelHeight}
          onSelectTask={setSelectedTaskIndex}
        />
      </Box>

      {/* Status Bar */}
      <Box paddingX={1} borderStyle="single" borderColor={colors.borderColor} flexShrink={0} height={4}>
        <StatusBar focusedPanel={focusedPanel} selectedTask={selectedTask} />
      </Box>
    </Box>
  );
};

export function launchOctopusShowTUI() {
  render(<App />);
}