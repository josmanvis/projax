// Agent CLI configurations and metadata
import { AgentCliType } from 'projax-api/types';

export interface AgentConfig {
  type: AgentCliType;
  name: string;
  description: string;
  provider: string;
  envVar: string | null;
  models: string[];
  defaultModel: string;
  requiresApiKey: boolean;
  supportsSystemPrompt: boolean;
  installHint: string;
  icon: string;
}

export const AGENT_CONFIGS: Record<AgentCliType, AgentConfig> = {
  claude: {
    type: 'claude',
    name: 'Claude Code',
    description: 'Anthropic official CLI for Claude',
    provider: 'Anthropic',
    envVar: 'ANTHROPIC_API_KEY',
    models: ['claude-sonnet-4-20250514', 'claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022', 'claude-3-opus-20240229'],
    defaultModel: 'claude-sonnet-4-20250514',
    requiresApiKey: true,
    supportsSystemPrompt: true,
    installHint: 'npm install -g @anthropic-ai/claude-code',
    icon: '🤖',
  },
  gemini: {
    type: 'gemini',
    name: 'Gemini CLI',
    description: 'Google Gemini command line interface',
    provider: 'Google',
    envVar: 'GOOGLE_API_KEY',
    models: ['gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash'],
    defaultModel: 'gemini-2.0-flash',
    requiresApiKey: true,
    supportsSystemPrompt: false,
    installHint: 'npm install -g @google/gemini-cli',
    icon: '✨',
  },
  openai: {
    type: 'openai',
    name: 'OpenAI CLI',
    description: 'OpenAI official command line tool',
    provider: 'OpenAI',
    envVar: 'OPENAI_API_KEY',
    models: ['gpt-4o', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'],
    defaultModel: 'gpt-4o',
    requiresApiKey: true,
    supportsSystemPrompt: false,
    installHint: 'pip install openai',
    icon: '🧠',
  },
  xai: {
    type: 'xai',
    name: 'xAI/Grok CLI',
    description: 'xAI Grok command line interface',
    provider: 'xAI',
    envVar: 'XAI_API_KEY',
    models: ['grok-2-latest', 'grok-2-1212', 'grok-beta'],
    defaultModel: 'grok-2-latest',
    requiresApiKey: true,
    supportsSystemPrompt: false,
    installHint: 'See xAI documentation',
    icon: '🔮',
  },
  ollama: {
    type: 'ollama',
    name: 'Ollama',
    description: 'Run LLMs locally on your machine',
    provider: 'Local',
    envVar: null,
    models: ['llama3.2', 'llama3.1', 'codellama', 'mistral', 'deepseek-coder'],
    defaultModel: 'llama3.2',
    requiresApiKey: false,
    supportsSystemPrompt: false,
    installHint: 'curl -fsSL https://ollama.com/install.sh | sh',
    icon: '🦙',
  },
  aider: {
    type: 'aider',
    name: 'Aider',
    description: 'AI pair programming in your terminal',
    provider: 'Multi-model',
    envVar: 'OPENAI_API_KEY',
    models: ['gpt-4o', 'claude-3-5-sonnet-20241022', 'deepseek/deepseek-coder'],
    defaultModel: 'gpt-4o',
    requiresApiKey: true,
    supportsSystemPrompt: true,
    installHint: 'pip install aider-chat',
    icon: '🤝',
  },
  continue: {
    type: 'continue',
    name: 'Continue',
    description: 'VS Code extension for AI code assistance',
    provider: 'Continue.dev',
    envVar: null,
    models: [],
    defaultModel: '',
    requiresApiKey: false,
    supportsSystemPrompt: true,
    installHint: 'Install from VS Code marketplace',
    icon: '▶️',
  },
  custom: {
    type: 'custom',
    name: 'Custom Command',
    description: 'Use your own CLI command',
    provider: 'Custom',
    envVar: null,
    models: [],
    defaultModel: '',
    requiresApiKey: false,
    supportsSystemPrompt: false,
    installHint: 'Configure your custom command',
    icon: '⚙️',
  },
};

// System prompt templates
export const SYSTEM_PROMPT_TEMPLATES = {
  default: 'You are a helpful AI coding assistant.',
  codeReview: 'You are a code reviewer. Analyze code for bugs, security issues, and improvements. Be thorough but constructive.',
  feature: 'You are implementing new features. Write clean, tested, well-documented code following project conventions.',
  refactor: 'You are refactoring code. Improve code quality while preserving functionality. Focus on readability and maintainability.',
  debug: 'You are debugging code. Identify and fix issues systematically. Explain your reasoning.',
  docs: 'You are writing documentation. Create clear, comprehensive documentation for code.',
  tests: 'You are writing tests. Create thorough test coverage including edge cases.',
};

// Priority colors for UI
export const PRIORITY_COLORS: Record<string, string> = {
  low: '#6e7681',
  medium: '#d29922',
  high: '#ffa657',
  urgent: '#f85149',
};

// Status config for UI
export const STATUS_CONFIG: Record<string, { color: string; icon: string }> = {
  pending: { color: '#6e7681', icon: '○' },
  in_progress: { color: '#d29922', icon: '◐' },
  completed: { color: '#3fb950', icon: '●' },
  blocked: { color: '#f85149', icon: '✗' },
};