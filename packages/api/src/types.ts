// Shared types matching @projax/core interfaces
export interface Project {
  id: number;
  name: string;
  path: string;
  description: string | null;
  framework: string | null;
  last_scanned: number | null;
  created_at: number;
  tags?: string[];
  git_branch?: string | null;
}

export interface Test {
  id: number;
  project_id: number;
  file_path: string;
  framework: string | null;
  status: string | null;
  last_run: number | null;
  created_at: number;
}

export interface JenkinsJob {
  id: number;
  project_id: number;
  job_name: string;
  job_url: string;
  last_build_status: string | null;
  last_build_number: number | null;
  last_updated: number | null;
  created_at: number;
}

export interface ProjectPort {
  id: number;
  project_id: number;
  port: number;
  script_name: string | null;
  config_source: string;
  last_detected: number;
  created_at: number;
}

export interface TestResult {
  id: number;
  project_id: number;
  script_name: string;
  framework: string | null;
  passed: number;
  failed: number;
  skipped: number;
  total: number;
  duration: number | null; // milliseconds
  coverage: number | null; // percentage
  timestamp: number;
  raw_output: string | null;
}

export interface Workspace {
  id: number;
  name: string;
  workspace_file_path: string;
  description: string | null;
  tags?: string[];
  created_at: number;
  last_opened: number | null;
}

export interface WorkspaceProject {
  id: number;
  workspace_id: number;
  project_path: string;
  order: number;
  created_at: number;
}

export interface ProjectSettings {
  id: number;
  project_id: number;
  script_sort_order: 'default' | 'alphabetical' | 'last-used';
  updated_at: number;
}

// Agent CLI types - supported AI coding assistants
export type AgentCliType =
  | 'claude'      // Claude Code CLI
  | 'gemini'      // Gemini CLI
  | 'openai'      // OpenAI CLI
  | 'xai'         // xAI/Grok CLI
  | 'ollama'      // Ollama (local)
  | 'aider'       // Aider
  | 'continue'    // Continue.dev
  | 'custom';     // Custom CLI command

export interface Agent {
  id: number;
  project_id: number;
  name: string;                           // User-friendly name (e.g., "Claude for Code Review")
  cli_type: AgentCliType;                 // Predefined CLI types
  cli_command: string | null;             // Custom command path (for 'custom' type)
  model: string | null;                   // Model name (e.g., "claude-3-opus", "gpt-4")
  api_key: string | null;                 // API key (stored locally)
  system_prompt: string | null;           // Custom system prompt
  temperature: number | null;             // Temperature setting (0.0-2.0)
  max_tokens: number | null;              // Max tokens limit
  additional_args: string | null;         // Extra CLI arguments
  created_at: number;
  updated_at: number;
}

export interface RunningAgent {
  pid: number;
  agentId: number;
  agentName: string;
  projectId: number;
  projectPath: string;
  cliType: AgentCliType;
  startedAt: number;
}

// Todo List types
export interface TodoList {
  id: number;
  project_id: number;
  name: string;
  description: string | null;
  created_at: number;
  updated_at: number;
}

// Task status type
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'blocked';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface TodoTask {
  id: number;
  list_id: number;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  order: number;                           // Order within the list
  assignee_agent_id: number | null;        // Agent assigned to task
  worktree_path: string | null;            // Sandbox path for this task
  worktree_branch: string | null;          // Git branch for sandbox
  created_at: number;
  updated_at: number;
  completed_at: number | null;
}

// Agent Task Run - tracks agent execution on a task
export type AgentTaskRunStatus = 'running' | 'completed' | 'failed' | 'aborted';

export interface AgentTaskRun {
  id: number;
  agent_id: number;
  task_id: number;
  worktree_path: string;
  worktree_branch: string;
  status: AgentTaskRunStatus;
  started_at: number;
  completed_at: number | null;
  output: string | null;                   // Last output from agent
  error_message: string | null;            // Error if failed
}

export interface DatabaseSchema {
  projects: Project[];
  tests: Test[];
  jenkins_jobs: JenkinsJob[];
  project_ports: ProjectPort[];
  test_results: TestResult[];
  settings: Array<{ key: string; value: string; updated_at: number }>;
  workspaces: Workspace[];
  workspace_projects: WorkspaceProject[];
  project_settings: ProjectSettings[];
  agents: Agent[];
  todo_lists: TodoList[];
  todo_tasks: TodoTask[];
  agent_task_runs: AgentTaskRun[];
}

