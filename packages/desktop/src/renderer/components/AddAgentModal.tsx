import React, { useState } from 'react';
import './AddAgentModal.css';

// Agent CLI types
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

const VALID_CLI_TYPES: AgentCliType[] = ['claude', 'gemini', 'openai', 'xai', 'ollama', 'aider', 'continue', 'custom'];

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

interface AddAgentModalProps {
  projectId: number;
  editAgent?: Agent | null;
  onAdd: (agent: Agent) => void;
  onClose: () => void;
}

const AddAgentModal: React.FC<AddAgentModalProps> = ({ projectId, editAgent, onAdd, onClose }) => {
  const isEditing = !!editAgent;
  const [name, setName] = useState(editAgent?.name || '');
  const [cliType, setCliType] = useState<AgentCliType>(editAgent?.cli_type || 'claude');
  const [cliCommand, setCliCommand] = useState(editAgent?.cli_command || '');
  const [model, setModel] = useState(editAgent?.model || '');
  const [apiKey, setApiKey] = useState(editAgent?.api_key || '');
  const [systemPrompt, setSystemPrompt] = useState(editAgent?.system_prompt || '');
  const [temperature, setTemperature] = useState(editAgent?.temperature?.toString() || '');
  const [maxTokens, setMaxTokens] = useState(editAgent?.max_tokens?.toString() || '');
  const [additionalArgs, setAdditionalArgs] = useState(editAgent?.additional_args || '');
  const [showApiKey, setShowApiKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    try {
      setLoading(true);

      // Find API port
      const ports = [38124, 38125, 38126, 38127, 38128, 3001];
      let apiBaseUrl = '';
      for (const port of ports) {
        try {
          const healthResponse = await fetch(`http://localhost:${port}/health`, { signal: AbortSignal.timeout(500) });
          if (healthResponse.ok) {
            apiBaseUrl = `http://localhost:${port}/api`;
            break;
          }
        } catch {
          continue;
        }
      }
      if (!apiBaseUrl) {
        throw new Error('PROJAX API server not found');
      }

      const agentData = {
        name: name.trim(),
        cli_type: cliType,
        cli_command: cliType === 'custom' && cliCommand.trim() ? cliCommand.trim() : null,
        model: model.trim() || null,
        api_key: apiKey.trim() || null,
        system_prompt: systemPrompt.trim() || null,
        temperature: temperature ? parseFloat(temperature) : null,
        max_tokens: maxTokens ? parseInt(maxTokens, 10) : null,
        additional_args: additionalArgs.trim() || null,
      };

      let response;
      if (isEditing && editAgent) {
        response = await fetch(`${apiBaseUrl}/agents/${editAgent.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(agentData),
        });
      } else {
        response = await fetch(`${apiBaseUrl}/projects/${projectId}/agents`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(agentData),
        });
      }

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Failed to ${isEditing ? 'update' : 'create'} agent`);
        } else {
          const text = await response.text();
          throw new Error(`Server returned ${response.status}: ${text.substring(0, 100)}`);
        }
      }

      const agent = await response.json();
      onAdd(agent);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content agent-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEditing ? 'Edit Agent' : 'Add Agent'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="agent-name">Name *</label>
            <input
              id="agent-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Claude for Code Review"
              disabled={loading}
              required
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="agent-cli-type">CLI Type *</label>
            <select
              id="agent-cli-type"
              value={cliType}
              onChange={(e) => setCliType(e.target.value as AgentCliType)}
              disabled={loading}
              className="form-select"
            >
              {VALID_CLI_TYPES.map((type) => (
                <option key={type} value={type}>
                  {CLI_DISPLAY_NAMES[type]}
                </option>
              ))}
            </select>
          </div>

          {cliType === 'custom' && (
            <div className="form-group">
              <label htmlFor="agent-cli-command">Custom Command</label>
              <input
                id="agent-cli-command"
                type="text"
                value={cliCommand}
                onChange={(e) => setCliCommand(e.target.value)}
                placeholder="e.g., /usr/local/bin/my-ai-cli"
                disabled={loading}
                className="form-input"
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="agent-model">Model</label>
            <input
              id="agent-model"
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="e.g., claude-3-opus, gpt-4, gemini-pro"
              disabled={loading}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="agent-api-key">API Key</label>
            <div className="api-key-input">
              <input
                id="agent-api-key"
                type={showApiKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
                disabled={loading}
                className="form-input"
              />
              <button
                type="button"
                className="toggle-visibility"
                onClick={() => setShowApiKey(!showApiKey)}
                tabIndex={-1}
              >
                {showApiKey ? 'Hide' : 'Show'}
              </button>
            </div>
            <p className="form-hint">Stored locally in ~/.projax/data.json</p>
          </div>

          <div className="form-group">
            <label htmlFor="agent-system-prompt">System Prompt</label>
            <textarea
              id="agent-system-prompt"
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="Custom system prompt for this agent"
              disabled={loading}
              rows={3}
              className="form-input"
            />
          </div>

          <div className="form-row">
            <div className="form-group half">
              <label htmlFor="agent-temperature">Temperature</label>
              <input
                id="agent-temperature"
                type="number"
                step="0.1"
                min="0"
                max="2"
                value={temperature}
                onChange={(e) => setTemperature(e.target.value)}
                placeholder="0.0 - 2.0"
                disabled={loading}
                className="form-input"
              />
            </div>
            <div className="form-group half">
              <label htmlFor="agent-max-tokens">Max Tokens</label>
              <input
                id="agent-max-tokens"
                type="number"
                min="1"
                value={maxTokens}
                onChange={(e) => setMaxTokens(e.target.value)}
                placeholder="e.g., 4096"
                disabled={loading}
                className="form-input"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="agent-additional-args">Additional Arguments</label>
            <input
              id="agent-additional-args"
              type="text"
              value={additionalArgs}
              onChange={(e) => setAdditionalArgs(e.target.value)}
              placeholder="e.g., --verbose --no-stream"
              disabled={loading}
              className="form-input"
            />
          </div>

          <div className="modal-actions">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
            >
              {loading ? (isEditing ? 'Updating...' : 'Adding...') : (isEditing ? 'Update' : 'Add Agent')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddAgentModal;
