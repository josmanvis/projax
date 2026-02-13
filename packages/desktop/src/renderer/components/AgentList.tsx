import React, { useState, useEffect } from 'react';
import './AgentList.css';

type AgentCliType = 'claude' | 'gemini' | 'openai' | 'xai' | 'ollama' | 'aider' | 'continue' | 'custom';

const CLI_DISPLAY_NAMES: Record<AgentCliType, string> = {
  claude: 'Claude Code',
  gemini: 'Gemini CLI',
  openai: 'OpenAI CLI',
  xai: 'xAI / Grok',
  ollama: 'Ollama',
  aider: 'Aider',
  continue: 'Continue.dev',
  custom: 'Custom',
};

const CLI_ICONS: Record<AgentCliType, string> = {
  claude: 'C',
  gemini: 'G',
  openai: 'O',
  xai: 'X',
  ollama: 'L',
  aider: 'A',
  continue: 'c',
  custom: '*',
};

interface Agent {
  id: number;
  project_id: number;
  name: string;
  cli_type: AgentCliType;
  cli_command: string | null;
  model: string | null;
  api_key: string | null;
  system_prompt: string | null;
  temperature: number | null;
  max_tokens: number | null;
  additional_args: string | null;
  created_at: number;
  updated_at: number;
}

interface RunningAgent {
  pid: number;
  agentId: number;
  agentName: string;
  projectId: number;
  projectPath: string;
  cliType: AgentCliType;
  startedAt: number;
}

interface AgentListProps {
  projectId: number;
  projectPath: string;
  onAddAgent: () => void;
  onEditAgent: (agent: Agent) => void;
}

const AgentList: React.FC<AgentListProps> = ({ projectId, projectPath, onAddAgent, onEditAgent }) => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [runningAgents, setRunningAgents] = useState<RunningAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const findApiBaseUrl = async (): Promise<string | null> => {
    const ports = [38124, 38125, 38126, 38127, 38128, 3001];
    for (const port of ports) {
      try {
        const response = await fetch(`http://localhost:${port}/health`, { signal: AbortSignal.timeout(500) });
        if (response.ok) {
          return `http://localhost:${port}/api`;
        }
      } catch {
        continue;
      }
    }
    return null;
  };

  const loadAgents = async () => {
    try {
      const apiBaseUrl = await findApiBaseUrl();
      if (!apiBaseUrl) {
        setError('API server not found');
        setLoading(false);
        return;
      }

      const response = await fetch(`${apiBaseUrl}/projects/${projectId}/agents`);
      if (response.ok) {
        const data = await response.json();
        setAgents(data);
      } else {
        setError('Failed to load agents');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load agents');
    } finally {
      setLoading(false);
    }
  };

  const loadRunningAgents = async () => {
    try {
      const apiBaseUrl = await findApiBaseUrl();
      if (!apiBaseUrl) return;

      const response = await fetch(`${apiBaseUrl}/agents/running`);
      if (response.ok) {
        const data = await response.json();
        setRunningAgents(data);
      }
    } catch {
      // Ignore errors for running agents check
    }
  };

  useEffect(() => {
    loadAgents();
    loadRunningAgents();

    // Refresh running agents status periodically
    const interval = setInterval(loadRunningAgents, 5000);
    return () => clearInterval(interval);
  }, [projectId]);

  const handleLaunch = async (agent: Agent) => {
    try {
      setActionLoading(agent.id);
      const apiBaseUrl = await findApiBaseUrl();
      if (!apiBaseUrl) {
        alert('API server not found');
        return;
      }

      const response = await fetch(`${apiBaseUrl}/agents/${agent.id}/launch`, {
        method: 'POST',
      });

      if (response.ok) {
        await loadRunningAgents();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to launch agent');
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to launch agent');
    } finally {
      setActionLoading(null);
    }
  };

  const handleStop = async (agent: Agent) => {
    try {
      setActionLoading(agent.id);
      const apiBaseUrl = await findApiBaseUrl();
      if (!apiBaseUrl) {
        alert('API server not found');
        return;
      }

      const response = await fetch(`${apiBaseUrl}/agents/${agent.id}/stop`, {
        method: 'POST',
      });

      if (response.ok) {
        await loadRunningAgents();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to stop agent');
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to stop agent');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (agent: Agent) => {
    if (!confirm(`Are you sure you want to delete "${agent.name}"?`)) {
      return;
    }

    try {
      setActionLoading(agent.id);
      const apiBaseUrl = await findApiBaseUrl();
      if (!apiBaseUrl) {
        alert('API server not found');
        return;
      }

      const response = await fetch(`${apiBaseUrl}/agents/${agent.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await loadAgents();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete agent');
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete agent');
    } finally {
      setActionLoading(null);
    }
  };

  const isRunning = (agentId: number): boolean => {
    return runningAgents.some(r => r.agentId === agentId);
  };

  if (loading) {
    return (
      <div className="agent-list">
        <div className="agent-list-header">
          <h3>Agents</h3>
        </div>
        <div className="agent-list-loading">Loading agents...</div>
      </div>
    );
  }

  return (
    <div className="agent-list">
      <div className="agent-list-header">
        <h3>Agents ({agents.length})</h3>
        <button className="btn-add-agent" onClick={onAddAgent} title="Add Agent">
          +
        </button>
      </div>

      {error && <div className="agent-list-error">{error}</div>}

      {agents.length === 0 ? (
        <div className="agent-list-empty">
          No agents configured
          <button className="btn-link" onClick={onAddAgent}>
            Add your first agent
          </button>
        </div>
      ) : (
        <div className="agent-list-items">
          {agents.map((agent) => {
            const running = isRunning(agent.id);
            const isLoading = actionLoading === agent.id;

            return (
              <div key={agent.id} className={`agent-item ${running ? 'running' : ''}`}>
                <div className="agent-icon" data-cli={agent.cli_type}>
                  {CLI_ICONS[agent.cli_type]}
                </div>
                <div className="agent-info">
                  <div className="agent-name">{agent.name}</div>
                  <div className="agent-meta">
                    <span className="agent-cli-type">{CLI_DISPLAY_NAMES[agent.cli_type]}</span>
                    {agent.model && <span className="agent-model">{agent.model}</span>}
                    {agent.api_key && <span className="agent-has-key" title="API key configured">key</span>}
                  </div>
                </div>
                <div className="agent-status">
                  {running && <span className="status-indicator running" title="Running" />}
                </div>
                <div className="agent-actions">
                  {running ? (
                    <button
                      className="btn-agent-action btn-stop"
                      onClick={() => handleStop(agent)}
                      disabled={isLoading}
                      title="Stop"
                    >
                      Stop
                    </button>
                  ) : (
                    <button
                      className="btn-agent-action btn-launch"
                      onClick={() => handleLaunch(agent)}
                      disabled={isLoading}
                      title="Launch"
                    >
                      Launch
                    </button>
                  )}
                  <button
                    className="btn-agent-action btn-edit"
                    onClick={() => onEditAgent(agent)}
                    disabled={isLoading}
                    title="Edit"
                  >
                    Edit
                  </button>
                  <button
                    className="btn-agent-action btn-delete"
                    onClick={() => handleDelete(agent)}
                    disabled={isLoading}
                    title="Delete"
                  >
                    ×
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AgentList;
