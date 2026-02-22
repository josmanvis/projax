export enum AgentStatus {
  IDLE = 'IDLE',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export interface Worktree {
  path: string;
  branch: string;
}

export interface Agent {
  id: string;
  prompt: string;
  llm: string; // Assuming llm is a string for now, like 'mock'
  status: AgentStatus;
  worktree?: Worktree; // worktree is optional, as it's created during execution
  createdAt?: Date;
  updatedAt?: Date;
}
