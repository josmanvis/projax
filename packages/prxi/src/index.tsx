import React, { useState, useEffect, useCallback } from 'react';
import { render, Box, Text, useInput, useApp, Newline } from 'ink';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import { execSync } from 'child_process';
import { spawn } from 'child_process';

// Import components
import { Modal, ConfirmModal } from './components/Modal';
import { ProjectDetail } from './components/ProjectDetail';
import { TaskWizard, TaskWizardData } from './components/TaskWizard';
import { AgentSpawnWizard, AgentSpawnData } from './components/AgentSpawnWizard';
import { TaskDetail } from './components/TaskDetail';
import { STATUS_CONFIG, PRIORITY_COLORS, AGENT_CONFIGS } from './utils/agent-configs';

// Types
import { Project, TodoList, TodoTask, Agent, AgentTaskRun, AgentCliType } from 'projax-api/types';

// Color scheme
const colors = {
  bgPrimary: '#0d1117',
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

// API Client
class ApiClient {
  private baseUrl: string;

  constructor() {
    const dataDir = path.join(os.homedir(), '.projax');
    const portFile = path.join(dataDir, 'api-port.txt');
    let port = 38124;
    if (fs.existsSync(portFile)) {
      try { port = parseInt(fs.readFileSync(portFile, 'utf-8').trim(), 10) || 38124; } catch (e) { /* Ignore */ }
    }
    this.baseUrl = `http://localhost:${port}/api`;
  }

  private request<T>(endpoint: string, options: { method?: string; body?: string } = {}): T | undefined {
    const url = `${this.baseUrl}${endpoint}`;
    const method = options.method || 'GET';
    try {
      const curlCmd = method === 'GET'
        ? `curl -s -f "${url}"`
        : method === 'DELETE'
        ? `curl -s -f -X DELETE "${url}"`
        : `curl -s -f -X ${method} -H "Content-Type: application/json" ${options.body ? `-d '${options.body}'` : ''} "${url}"`;
      const result = execSync(curlCmd, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
      if (!result || result.trim() === '') return undefined;
      return JSON.parse(result) as T;
    } catch { return undefined; }
  }

  getProjects(): Project[] { return this.request<Project[]>('/projects') || []; }
  getProjectPorts(projectId: number): any[] { return this.request<any[]>(`/projects/${projectId}/ports`) || []; }
  updateProject(id: number, updates: any): Project | undefined { return this.request<Project>(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(updates) }); }
  removeProject(id: number): void { this.request(`/projects/${id}`, { method: 'DELETE' }); }

  getTodoLists(projectId: number): TodoList[] { return this.request<TodoList[]>(`/projects/${projectId}/todo-lists`) || []; }
  createTodoList(projectId: number, name: string): TodoList | undefined { return this.request<TodoList>(`/projects/${projectId}/todo-lists`, { method: 'POST', body: JSON.stringify({ name }) }); }
  deleteTodoList(id: number): void { this.request(`/todo-lists/${id}`, { method: 'DELETE' }); }

  getTasks(listId: number): TodoTask[] { return this.request<TodoTask[]>(`/todo-lists/${listId}/tasks`) || []; }
  getProjectTasks(projectId: number): TodoTask[] { return this.request<TodoTask[]>(`/projects/${projectId}/tasks`) || []; }
  createTask(listId: number, title: string, priority?: string, description?: string, assignee_agent_id?: number | null): TodoTask | undefined {
    return this.request<TodoTask>(`/todo-lists/${listId}/tasks`, {
      method: 'POST',
      body: JSON.stringify({ title, priority, description, assignee_agent_id })
    });
  }
  updateTask(id: number, updates: Partial<TodoTask>): TodoTask | undefined { return this.request<TodoTask>(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(updates) }); }
  deleteTask(id: number): void { this.request(`/tasks/${id}`, { method: 'DELETE' }); }
  toggleTask(id: number): TodoTask | undefined { return this.request<TodoTask>(`/tasks/${id}/toggle`, { method: 'POST' }); }

  getAgents(projectId: number): Agent[] { return this.request<Agent[]>(`/projects/${projectId}/agents`) || []; }
  createAgent(projectId: number, data: any): Agent | undefined { return this.request<Agent>(`/projects/${projectId}/agents`, { method: 'POST', body: JSON.stringify(data) }); }
  getAgent(id: number): Agent | undefined { return this.request<Agent>(`/agents/${id}`); }
  deleteAgent(id: number): void { this.request(`/agents/${id}`, { method: 'DELETE' }); }
  launchAgent(id: number): any { return this.request(`/agents/${id}/launch`, { method: 'POST' }); }
  stopAgent(id: number): void { this.request(`/agents/${id}/stop`, { method: 'POST' }); }
  getRunningAgents(): any[] { return this.request<any[]>('/agents/running') || []; }

  assignAgent(taskId: number, agentId: number | null): TodoTask | undefined { return this.request<TodoTask>(`/tasks/${taskId}/assign-agent`, { method: 'POST', body: JSON.stringify({ agent_id: agentId }) }); }
  startTask(taskId: number): any { return this.request(`/tasks/${taskId}/start`, { method: 'POST' }); }
  mergeTask(taskId: number): any { return this.request(`/tasks/${taskId}/merge`, { method: 'POST' }); }
  abortTask(taskId: number): any { return this.request(`/tasks/${taskId}/abort`, { method: 'POST' }); }
  getRunningRuns(): AgentTaskRun[] { return this.request<AgentTaskRun[]>('/runs/running') || []; }
}

const api = new ApiClient();

const truncate = (text: string, max: number) => (text?.length > max ? text.slice(0, max - 3) + '...' : text || '');

// View types
type ViewMode = 'projects' | 'tasks' | 'agents' | 'settings' | 'project-detail' | 'task-detail';
type ModalType = 'none' | 'help' | 'task-wizard' | 'agent-wizard' | 'confirm' | 'input' | 'search';

// Help Modal
const HelpModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  useInput((input, key) => { if (input === 'q' || key.escape || key.return) onClose(); });
  return (
    <Box flexDirection="column" borderStyle="round" borderColor={colors.accentCyan} padding={1} width={80}>
      <Text bold color={colors.accentCyan}>PROJAX Terminal UI - Help</Text>
      <Newline />
      <Text color={colors.accentCyan}>Navigation:</Text>
      <Text>  ↑/k  ↓/j      Move up/down</Text>
      <Text>  Tab/←→        Switch panels</Text>
      <Text>  Enter         Select / Drill down</Text>
      <Text>  Esc           Back / Close</Text>
      <Newline />
      <Text color={colors.accentCyan}>Project Mode:</Text>
      <Text>  Enter         View project details</Text>
      <Text>  o             Open in editor</Text>
      <Text>  a             Add task</Text>
      <Text>  s             Spawn agent</Text>
      <Text>  d             Delete project</Text>
      <Newline />
      <Text color={colors.accentCyan}>Task Mode:</Text>
      <Text>  Enter         View task details</Text>
      <Text>  a             Add task (wizard)</Text>
      <Text>  Space         Toggle task status</Text>
      <Text>  g             Assign/reassign agent</Text>
      <Text>  s             Start agent on task</Text>
      <Text>  m             Merge worktree</Text>
      <Text>  x             Abort worktree</Text>
      <Text>  d             Delete task</Text>
      <Newline />
      <Text color={colors.accentCyan}>Agent Mode:</Text>
      <Text>  Enter         View agent details</Text>
      <Text>  l             Launch agent</Text>
      <Newline />
      <Text color={colors.textSecondary}>Press any key to close...</Text>
    </Box>
  );
};

// Main App
const App: React.FC = () => {
  const { exit } = useApp();
  
  // View state
  const [viewMode, setViewMode] = useState<ViewMode>('projects');
  const [focusedPanel, setFocusedPanel] = useState<'left' | 'right'>('left');
  const [modal, setModal] = useState<ModalType>('none');
  
  // Data state
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectIdx, setSelectedProjectIdx] = useState(0);
  const [todoLists, setTodoLists] = useState<TodoList[]>([]);
  const [tasks, setTasks] = useState<TodoTask[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [runningRuns, setRunningRuns] = useState<AgentTaskRun[]>([]);
  const [ports, setPorts] = useState<any[]>([]);
  
  // Selection state
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal state
  const [confirmAction, setConfirmAction] = useState<{ message: string; action: () => void } | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const terminalHeight = process.stdout.rows || 24;
  const panelHeight = terminalHeight - 6;

  const selectedProject = projects[selectedProjectIdx];
  const selectedTask = tasks[selectedIdx];
  const selectedAgent = agents[selectedIdx];

  // Load initial data
  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      const runs = api.getRunningRuns();
      setRunningRuns(runs);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Load project data when project selection changes
  useEffect(() => {
    if (projects.length > 0) loadProjectData();
  }, [selectedProjectIdx, projects]);

  // Reset selection when view changes
  useEffect(() => {
    setSelectedIdx(0);
    setScrollOffset(0);
  }, [viewMode]);

  const loadData = () => {
    const projs = api.getProjects();
    setProjects(projs);
    if (projs.length > 0 && selectedProjectIdx >= projs.length) setSelectedProjectIdx(0);
  };

  const loadProjectData = () => {
    if (!selectedProject) return;
    const lists = api.getTodoLists(selectedProject.id);
    setTodoLists(lists);
    const allTasks: TodoTask[] = [];
    lists.forEach(l => allTasks.push(...(api.getTasks(l.id) || [])));
    setTasks(allTasks);
    setAgents(api.getAgents(selectedProject.id) || []);
    setPorts(api.getProjectPorts(selectedProject.id) || []);
  };

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // Input handling
  useInput((input, key) => {
    // Handle modals first
    if (modal === 'help') {
      if (key.escape || input === 'q' || key.return) setModal('none');
      return;
    }
    if (modal === 'search') {
      if (key.escape) { setModal('none'); setSearchQuery(''); return; }
      if (key.return) { setModal('none'); return; }
      if (key.backspace || key.delete) { setSearchQuery(q => q.slice(0, -1)); return; }
      if (input?.length === 1) setSearchQuery(q => q + input);
      return;
    }
    if (modal === 'confirm' && confirmAction) {
      if (input === 'y' || input === 'Y') { confirmAction.action(); setModal('none'); setConfirmAction(null); return; }
      if (input === 'n' || input === 'N' || key.escape) { setModal('none'); setConfirmAction(null); return; }
      return;
    }
    if (modal !== 'none') return; // Let wizard handle input

    // Handle errors/notifications
    if (error) { if (key.escape || key.return) setError(null); return; }

    // Global shortcuts
    if (input === 'q' || (key.escape && viewMode === 'projects')) { exit(); return; }
    if (key.escape) { setViewMode('projects'); return; }
    if (input === '?') { setModal('help'); return; }

    // Number keys for quick navigation
    if (input === '1') { setViewMode('projects'); return; }
    if (input === '2') { setViewMode('tasks'); return; }
    if (input === '3') { setViewMode('agents'); return; }
    if (input === '4') { setViewMode('settings'); return; }

    // Tab between panels
    if (key.tab || key.leftArrow || key.rightArrow) {
      setFocusedPanel(p => p === 'left' ? 'right' : 'left');
      return;
    }

    // Search
    if (input === '/' && viewMode === 'projects') {
      setModal('search');
      setSearchQuery('');
      return;
    }

    // Navigation within lists
    const currentItems = getCurrentItems();
    if (key.upArrow || input === 'k') {
      setSelectedIdx(i => {
        const n = Math.max(0, i - 1);
        if (n < scrollOffset) setScrollOffset(n);
        return n;
      });
      return;
    }
    if (key.downArrow || input === 'j') {
      setSelectedIdx(i => {
        const n = Math.min(currentItems.length - 1, i + 1);
        if (n >= scrollOffset + panelHeight - 4) setScrollOffset(Math.max(0, n - panelHeight + 5));
        return n;
      });
      return;
    }

    // Mode-specific actions
    handleModeInput(input, key);
  });

  const getCurrentItems = () => {
    if (viewMode === 'projects') {
      const filtered = searchQuery ? projects.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())) : projects;
      return filtered;
    }
    if (viewMode === 'tasks') return tasks;
    if (viewMode === 'agents') return agents;
    return [];
  };

  const handleModeInput = (input: string, key: any) => {
    // Projects mode
    if (viewMode === 'projects' && focusedPanel === 'left') {
      if (key.return && selectedProject) {
        setViewMode('project-detail');
        return;
      }
      if (input === 'o' && selectedProject) {
        spawn('code', [selectedProject.path], { detached: true, stdio: 'ignore' }).unref();
        showNotification(`Opening ${selectedProject.name} in VS Code...`);
        return;
      }
      if (input === 'a' && selectedProject) {
        if (todoLists.length === 0) {
          // Create a default todo list first
          const list = api.createTodoList(selectedProject.id, 'Tasks');
          if (list) {
            setTodoLists([list]);
            setModal('task-wizard');
          }
        } else {
          setModal('task-wizard');
        }
        return;
      }
      if (input === 's' && selectedProject) {
        setModal('agent-wizard');
        return;
      }
      if (input === 'd' && selectedProject) {
        setConfirmAction({
          message: `Delete project "${selectedProject.name}"? This removes it from tracking only.`,
          action: () => {
            api.removeProject(selectedProject.id);
            loadData();
            setSelectedIdx(Math.max(0, selectedProjectIdx - 1));
            showNotification('Project removed');
          }
        });
        setModal('confirm');
        return;
      }
    }

    // Project detail view
    if (viewMode === 'project-detail') {
      if (input === 'o' && selectedProject) {
        spawn('code', [selectedProject.path], { detached: true, stdio: 'ignore' }).unref();
        showNotification(`Opening ${selectedProject.name} in VS Code...`);
        return;
      }
      if (input === 'a') {
        if (todoLists.length === 0) {
          const list = api.createTodoList(selectedProject.id, 'Tasks');
          if (list) {
            setTodoLists([list]);
            setModal('task-wizard');
          }
        } else {
          setModal('task-wizard');
        }
        return;
      }
      if (input === 's') {
        setModal('agent-wizard');
        return;
      }
    }

    // Tasks mode
    if (viewMode === 'tasks') {
      if (key.return && selectedTask) {
        setViewMode('task-detail');
        return;
      }
      if (input === 'a' && todoLists.length > 0) {
        setModal('task-wizard');
        return;
      }
      if ((input === ' ' || key.space) && selectedTask) {
        api.toggleTask(selectedTask.id);
        loadProjectData();
        return;
      }
      if (input === 'g' && selectedTask && agents.length > 0) {
        const currentIdx = agents.findIndex(a => a.id === selectedTask.assignee_agent_id);
        const nextIdx = (currentIdx + 1) % (agents.length + 1);
        api.assignAgent(selectedTask.id, nextIdx === agents.length ? null : agents[nextIdx].id);
        loadProjectData();
        return;
      }
      if (input === 's' && selectedTask?.assignee_agent_id) {
        api.startTask(selectedTask.id);
        loadProjectData();
        showNotification('Agent started on task');
        return;
      }
      if (input === 'm' && selectedTask?.worktree_path) {
        setConfirmAction({
          message: `Merge worktree for "${selectedTask.title}"?`,
          action: () => {
            api.mergeTask(selectedTask.id);
            loadProjectData();
            showNotification('Worktree merged successfully');
          }
        });
        setModal('confirm');
        return;
      }
      if (input === 'x' && selectedTask?.worktree_path) {
        setConfirmAction({
          message: `Abort worktree for "${selectedTask.title}"? Changes will be lost.`,
          action: () => {
            api.abortTask(selectedTask.id);
            loadProjectData();
            showNotification('Worktree aborted');
          }
        });
        setModal('confirm');
        return;
      }
      if (input === 'd' && selectedTask) {
        setConfirmAction({
          message: `Delete task "${selectedTask.title}"?`,
          action: () => {
            api.deleteTask(selectedTask.id);
            loadProjectData();
            setSelectedIdx(Math.max(0, selectedIdx - 1));
            showNotification('Task deleted');
          }
        });
        setModal('confirm');
        return;
      }
    }

    // Task detail view
    if (viewMode === 'task-detail' && selectedTask) {
      if (input === ' ' || key.space) {
        api.toggleTask(selectedTask.id);
        loadProjectData();
        return;
      }
      if (input === 's' && selectedTask.assignee_agent_id && !selectedTask.worktree_path) {
        api.startTask(selectedTask.id);
        loadProjectData();
        showNotification('Agent started on task');
        return;
      }
      if (input === 'm' && selectedTask.worktree_path) {
        setConfirmAction({
          message: `Merge worktree for "${selectedTask.title}"?`,
          action: () => {
            api.mergeTask(selectedTask.id);
            loadProjectData();
            setViewMode('tasks');
            showNotification('Worktree merged successfully');
          }
        });
        setModal('confirm');
        return;
      }
      if (input === 'x' && selectedTask.worktree_path) {
        setConfirmAction({
          message: `Abort worktree for "${selectedTask.title}"? Changes will be lost.`,
          action: () => {
            api.abortTask(selectedTask.id);
            loadProjectData();
            setViewMode('tasks');
            showNotification('Worktree aborted');
          }
        });
        setModal('confirm');
        return;
      }
      if (input === 'g' && agents.length > 0) {
        const currentIdx = agents.findIndex(a => a.id === selectedTask.assignee_agent_id);
        const nextIdx = (currentIdx + 1) % (agents.length + 1);
        api.assignAgent(selectedTask.id, nextIdx === agents.length ? null : agents[nextIdx].id);
        loadProjectData();
        return;
      }
      if (input === 'd') {
        setConfirmAction({
          message: `Delete task "${selectedTask.title}"?`,
          action: () => {
            api.deleteTask(selectedTask.id);
            loadProjectData();
            setViewMode('tasks');
            setSelectedIdx(Math.max(0, selectedIdx - 1));
            showNotification('Task deleted');
          }
        });
        setModal('confirm');
        return;
      }
    }

    // Agents mode
    if (viewMode === 'agents') {
      if (input === 'l' && selectedAgent) {
        api.launchAgent(selectedAgent.id);
        showNotification(`Launching ${selectedAgent.name}...`);
        return;
      }
      if (input === 'd' && selectedAgent) {
        setConfirmAction({
          message: `Delete agent "${selectedAgent.name}"?`,
          action: () => {
            api.deleteAgent(selectedAgent.id);
            loadProjectData();
            setSelectedIdx(Math.max(0, selectedIdx - 1));
            showNotification('Agent deleted');
          }
        });
        setModal('confirm');
        return;
      }
    }
  };

  // Task wizard completion
  const handleTaskWizardComplete = (data: TaskWizardData) => {
    if (!selectedProject || todoLists.length === 0) {
      setModal('none');
      return;
    }
    
    const task = api.createTask(
      todoLists[0].id,
      data.title,
      data.priority,
      data.description || undefined,
      data.assignee_agent_id
    );
    
    if (task) {
      loadProjectData();
      showNotification(`Task "${data.title}" created`);
    }
    setModal('none');
  };

  // Agent wizard completion
  const handleAgentWizardComplete = (data: AgentSpawnData) => {
    if (!selectedProject) {
      setModal('none');
      return;
    }

    const agent = api.createAgent(selectedProject.id, {
      name: data.name,
      cli_type: data.cli_type,
      cli_command: data.cli_command,
      model: data.model,
      api_key: data.api_key,
      system_prompt: data.system_prompt,
      temperature: data.temperature,
      max_tokens: data.max_tokens,
      additional_args: data.additional_args,
    });

    if (agent) {
      loadProjectData();
      if (data.launch_immediately) {
        api.launchAgent(agent.id);
        showNotification(`Agent "${data.name}" created and launched`);
      } else {
        showNotification(`Agent "${data.name}" created`);
      }
    }
    setModal('none');
  };

  // Render modals
  if (modal === 'help') {
    return <Box padding={1}><HelpModal onClose={() => setModal('none')} /></Box>;
  }

  if (modal === 'search') {
    const filtered = projects.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
    return (
      <Box padding={1}>
        <Box flexDirection="column" borderStyle="round" borderColor={colors.accentCyan} padding={1} width={60}>
          <Text bold color={colors.accentCyan}>Search Projects</Text>
          <Newline />
          <Text>/{searchQuery}_</Text>
          <Newline />
          <Text color={colors.textSecondary}>Found {filtered.length} projects. Enter to confirm, Esc to cancel</Text>
        </Box>
      </Box>
    );
  }

  if (modal === 'confirm' && confirmAction) {
    return (
      <Box padding={1}>
        <ConfirmModal
          title="Confirm Action"
          message={confirmAction.message}
          onConfirm={() => {}}
          onCancel={() => { setModal('none'); setConfirmAction(null); }}
        />
      </Box>
    );
  }

  if (modal === 'task-wizard' && selectedProject) {
    return (
      <TaskWizard
        agents={agents}
        todoLists={todoLists}
        onComplete={handleTaskWizardComplete}
        onCancel={() => setModal('none')}
      />
    );
  }

  if (modal === 'agent-wizard' && selectedProject) {
    return (
      <AgentSpawnWizard
        project={selectedProject}
        existingAgents={agents}
        onComplete={handleAgentWizardComplete}
        onCancel={() => setModal('none')}
      />
    );
  }

  if (error) {
    return (
      <Box padding={1}>
        <Box flexDirection="column" borderStyle="round" borderColor={colors.accentRed} padding={1} width={60}>
          <Text bold color={colors.accentRed}>Error</Text>
          <Newline />
          <Text>{error}</Text>
          <Newline />
          <Text color={colors.textSecondary}>Press any key to dismiss...</Text>
        </Box>
      </Box>
    );
  }

  // Mode tab bar
  const ModeTabBar = () => (
    <Box>
      <Text color={viewMode === 'projects' || viewMode === 'project-detail' ? colors.accentCyan : colors.textSecondary} bold={viewMode === 'projects' || viewMode === 'project-detail'}> [1] Projects </Text>
      <Text color={colors.textTertiary}>|</Text>
      <Text color={viewMode === 'tasks' || viewMode === 'task-detail' ? colors.accentCyan : colors.textSecondary} bold={viewMode === 'tasks' || viewMode === 'task-detail'}> [2] Tasks ({tasks.length}) </Text>
      <Text color={colors.textTertiary}>|</Text>
      <Text color={viewMode === 'agents' ? colors.accentCyan : colors.textSecondary} bold={viewMode === 'agents'}> [3] Agents ({agents.length}) </Text>
      <Text color={colors.textTertiary}>|</Text>
      <Text color={viewMode === 'settings' ? colors.accentCyan : colors.textSecondary} bold={viewMode === 'settings'}> [4] Settings </Text>
      {runningRuns.length > 0 && (
        <Text color={colors.accentGreen}> | ● {runningRuns.length} running</Text>
      )}
      {notification && (
        <Text color={colors.accentGreen}> | {notification}</Text>
      )}
    </Box>
  );

  // Left Panel Content
  const LeftPanel = () => {
    const filteredProjects = searchQuery ? projects.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())) : projects;
    let items: any[] = [];
    
    if (viewMode === 'projects' || viewMode === 'project-detail') items = filteredProjects;
    else if (viewMode === 'tasks' || viewMode === 'task-detail') items = tasks;
    else if (viewMode === 'agents') items = agents;

    const visibleItems = items.slice(scrollOffset, scrollOffset + panelHeight - 2);
    const isDetailView = viewMode === 'project-detail' || viewMode === 'task-detail';

    // Settings mode - full width
    if (viewMode === 'settings') {
      return (
        <Box flexDirection="column" flexGrow={1} height={panelHeight} borderStyle="round" borderColor={focusedPanel === 'left' ? colors.accentCyan : colors.borderColor} padding={1}>
          <Text bold color={colors.textPrimary}>Settings</Text>
          <Newline />
          <Text color={colors.accentCyan}>General</Text>
          <Text color={colors.textSecondary}>  Editor: <Text color={colors.textPrimary}>VS Code</Text></Text>
          <Text color={colors.textSecondary}>  Data Directory: <Text color={colors.textPrimary}>~/.projax</Text></Text>
          <Newline />
          <Text color={colors.accentCyan}>API Server</Text>
          <Text color={colors.textSecondary}>  Port: <Text color={colors.textPrimary}>38124</Text></Text>
          <Text color={colors.textSecondary}>  Status: <Text color={colors.accentGreen}>Running</Text></Text>
          <Newline />
          <Text color={colors.accentCyan}>Statistics</Text>
          <Text color={colors.textSecondary}>  Projects: <Text color={colors.textPrimary}>{projects.length}</Text></Text>
          <Text color={colors.textSecondary}>  Total Tasks: <Text color={colors.textPrimary}>{tasks.length}</Text></Text>
          <Text color={colors.textSecondary}>  Running Agents: <Text color={colors.textPrimary}>{runningRuns.length}</Text></Text>
          <Newline />
          <Text color={colors.textTertiary}>Press ? for help</Text>
        </Box>
      );
    }

    return (
      <Box flexDirection="column" width={isDetailView ? "30%" : "35%"} height={panelHeight} borderStyle="round" borderColor={focusedPanel === 'left' ? colors.accentCyan : colors.borderColor} padding={1}>
        <Text bold color={colors.textPrimary}>
          {viewMode === 'projects' || viewMode === 'project-detail' ? `Projects (${filteredProjects.length})` : 
           viewMode === 'tasks' || viewMode === 'task-detail' ? `Tasks (${tasks.length})` : 
           `Agents (${agents.length})`}
        </Text>
        <Newline />
        {items.length === 0 ? (
          <Text color={colors.textTertiary}>No items</Text>
        ) : (
          visibleItems.map((item, idx) => {
            const actualIdx = scrollOffset + idx;
            const isSelected = actualIdx === selectedIdx && focusedPanel === 'left';

            if (viewMode === 'projects' || viewMode === 'project-detail') {
              const p = item as Project;
              return (
                <Text key={p.id} color={isSelected ? colors.accentCyan : colors.textPrimary} bold={isSelected}>
                  {isSelected ? '▶ ' : '  '}{truncate(p.name, isDetailView ? 20 : 25)}
                </Text>
              );
            }
            if (viewMode === 'tasks' || viewMode === 'task-detail') {
              const t = item as TodoTask;
              const cfg = STATUS_CONFIG[t.status];
              return (
                <Box key={t.id}>
                  <Text color={isSelected ? colors.accentCyan : colors.textPrimary} bold={isSelected}>
                    {isSelected ? '▶ ' : '  '}
                    <Text color={cfg.color}>{cfg.icon}</Text> {truncate(t.title, isDetailView ? 20 : 25)}
                  </Text>
                  {t.worktree_path && <Text color={colors.accentGreen}> 🌿</Text>}
                </Box>
              );
            }
            const a = item as Agent;
            const agentConfig = AGENT_CONFIGS[a.cli_type];
            return (
              <Text key={a.id} color={isSelected ? colors.accentCyan : colors.textPrimary} bold={isSelected}>
                {isSelected ? '▶ ' : '  '}{agentConfig?.icon || '◆'} {truncate(a.name, isDetailView ? 20 : 25)}
              </Text>
            );
          })
        )}
      </Box>
    );
  };

  // Right Panel Content
  const RightPanel = () => {
    // Project Detail View
    if (viewMode === 'project-detail' && selectedProject) {
      return (
        <ProjectDetail
          project={selectedProject}
          tasks={tasks}
          agents={agents}
          ports={ports}
          onOpenInEditor={() => {
            spawn('code', [selectedProject.path], { detached: true, stdio: 'ignore' }).unref();
            showNotification(`Opening ${selectedProject.name} in VS Code...`);
          }}
          onCreateTask={() => {
            if (todoLists.length === 0) {
              const list = api.createTodoList(selectedProject.id, 'Tasks');
              if (list) setTodoLists([list]);
            }
            setModal('task-wizard');
          }}
          onSpawnAgent={() => setModal('agent-wizard')}
          onBack={() => setViewMode('projects')}
        />
      );
    }

    // Task Detail View
    if (viewMode === 'task-detail' && selectedTask) {
      const assignedAgent = selectedTask.assignee_agent_id ? agents.find(a => a.id === selectedTask.assignee_agent_id) || null : null;
      return (
        <TaskDetail
          task={selectedTask}
          assignedAgent={assignedAgent}
          onToggleStatus={() => { api.toggleTask(selectedTask.id); loadProjectData(); }}
          onStart={() => { api.startTask(selectedTask.id); loadProjectData(); showNotification('Agent started'); }}
          onMerge={() => {
            setConfirmAction({
              message: `Merge worktree for "${selectedTask.title}"?`,
              action: () => { api.mergeTask(selectedTask.id); loadProjectData(); setViewMode('tasks'); showNotification('Merged'); }
            });
            setModal('confirm');
          }}
          onAbort={() => {
            setConfirmAction({
              message: `Abort worktree for "${selectedTask.title}"?`,
              action: () => { api.abortTask(selectedTask.id); loadProjectData(); setViewMode('tasks'); showNotification('Aborted'); }
            });
            setModal('confirm');
          }}
          onReassign={() => {
            if (agents.length > 0) {
              const currentIdx = agents.findIndex(a => a.id === selectedTask.assignee_agent_id);
              const nextIdx = (currentIdx + 1) % (agents.length + 1);
              api.assignAgent(selectedTask.id, nextIdx === agents.length ? null : agents[nextIdx].id);
              loadProjectData();
            }
          }}
          onDelete={() => {
            setConfirmAction({
              message: `Delete task "${selectedTask.title}"?`,
              action: () => { api.deleteTask(selectedTask.id); loadProjectData(); setViewMode('tasks'); showNotification('Deleted'); }
            });
            setModal('confirm');
          }}
          onBack={() => setViewMode('tasks')}
        />
      );
    }

    // Default right panel for list views
    const item = viewMode === 'projects' ? selectedProject :
                 viewMode === 'tasks' ? selectedTask :
                 selectedAgent;

    return (
      <Box flexDirection="column" flexGrow={1} height={panelHeight} borderStyle="round" borderColor={focusedPanel === 'right' ? colors.accentCyan : colors.borderColor} padding={1}>
        {!item ? (
          <Text color={colors.textSecondary}>Select an item to view details</Text>
        ) : viewMode === 'projects' ? (
          <>
            <Text bold color={colors.textPrimary}>{(item as Project).name}</Text>
            <Text color={colors.textTertiary}>{(item as Project).path}</Text>
            <Newline />
            <Text color={colors.textSecondary}>Framework: <Text color={colors.accentCyan}>{(item as Project).framework || 'Unknown'}</Text></Text>
            <Text color={colors.textSecondary}>Ports: <Text color={colors.accentCyan}>{ports.length}</Text></Text>
            <Text color={colors.textSecondary}>Tasks: <Text color={colors.accentCyan}>{tasks.length}</Text> (<Text color={colors.accentGreen}>{tasks.filter(t => t.status === 'completed').length}</Text> done)</Text>
            <Text color={colors.textSecondary}>Agents: <Text color={colors.accentCyan}>{agents.length}</Text></Text>
            <Newline />
            <Text color={colors.accentCyan}>Press Enter to view details</Text>
            <Text color={colors.textTertiary}>o: open | a: add task | s: spawn agent | d: delete</Text>
          </>
        ) : viewMode === 'tasks' ? (
          <>
            <Text bold color={colors.textPrimary}>{(item as TodoTask).title}</Text>
            <Box>
              <Text color={colors.textSecondary}>Status: </Text>
              <Text color={STATUS_CONFIG[(item as TodoTask).status].color}>{(item as TodoTask).status}</Text>
              <Text color={colors.textSecondary}> | Priority: </Text>
              <Text color={PRIORITY_COLORS[(item as TodoTask).priority]}>{(item as TodoTask).priority}</Text>
            </Box>
            {(item as TodoTask).worktree_path && (
              <Text color={colors.accentGreen}>🌿 Worktree: {truncate((item as TodoTask).worktree_path, 50)}</Text>
            )}
            <Newline />
            <Text color={colors.accentCyan}>Press Enter to view details</Text>
            <Text color={colors.textTertiary}>Space: toggle | g: assign | s: start | m: merge | x: abort | d: delete</Text>
          </>
        ) : (
          <>
            <Text bold color={colors.textPrimary}>{(item as Agent).name}</Text>
            <Text color={colors.textSecondary}>CLI: <Text color={colors.accentCyan}>{AGENT_CONFIGS[(item as Agent).cli_type]?.icon || '◆'} {(item as Agent).cli_type}</Text></Text>
            <Text color={colors.textSecondary}>Model: <Text color={colors.accentCyan}>{(item as Agent).model || 'default'}</Text></Text>
            <Newline />
            <Text color={colors.textTertiary}>l: launch agent | d: delete</Text>
          </>
        )}
      </Box>
    );
  };

  // Status bar
  const StatusBar = () => (
    <Box flexDirection="column">
      <Box>
        <Text color={colors.accentGreen}>● API</Text>
        <Text color={colors.textSecondary}> | Focus: </Text>
        <Text color={colors.accentCyan}>
          {focusedPanel === 'left' ? 
            (viewMode === 'projects' ? 'Projects' : viewMode === 'tasks' ? 'Tasks' : viewMode === 'agents' ? 'Agents' : 'Settings') : 
            'Details'}
        </Text>
        {selectedProject && <Text color={colors.textSecondary}> | Project: </Text>}
        {selectedProject && <Text color={colors.textPrimary}>{selectedProject.name}</Text>}
        {viewMode === 'project-detail' && <Text color={colors.accentCyan}> (detail view)</Text>}
        {viewMode === 'task-detail' && <Text color={colors.accentCyan}> (task detail)</Text>}
      </Box>
      <Box>
        <Text bold>1/2/3/4</Text><Text color={colors.textSecondary}> Mode | </Text>
        <Text bold>↑↓/jk</Text><Text color={colors.textSecondary}> Navigate | </Text>
        <Text bold>Enter</Text><Text color={colors.textSecondary}> Select | </Text>
        <Text bold>Tab</Text><Text color={colors.textSecondary}> Panel | </Text>
        <Text bold>?</Text><Text color={colors.textSecondary}> Help | </Text>
        <Text bold>Esc</Text><Text color={colors.textSecondary}> Back | </Text>
        <Text bold>q</Text><Text color={colors.textSecondary}> Quit</Text>
      </Box>
    </Box>
  );

  return (
    <Box flexDirection="column" height={terminalHeight}>
      <Box paddingX={1}><ModeTabBar /></Box>
      <Box flexDirection="row" height={panelHeight} flexGrow={0}>
        <LeftPanel />
        {viewMode !== 'settings' && <Box width={1} />}
        {viewMode !== 'settings' && <RightPanel />}
      </Box>
      <Box paddingX={1} borderStyle="single" borderColor={colors.borderColor} flexShrink={0}>
        <StatusBar />
      </Box>
    </Box>
  );
};

render(<App />);