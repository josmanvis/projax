import React, { useState } from 'react';
import './AddWorkspaceModal.css';

interface AddWorkspaceModalProps {
  onAdd: (workspace: any) => Promise<void>;
  onClose: () => void;
  existingProjects?: any[];
}

const AddWorkspaceModal: React.FC<AddWorkspaceModalProps> = ({ onAdd, onClose, existingProjects = [] }) => {
  const [mode, setMode] = useState<'import' | 'create'>('import');
  const [workspaceFilePath, setWorkspaceFilePath] = useState('');
  const [workspaceName, setWorkspaceName] = useState('');
  const [workspaceDescription, setWorkspaceDescription] = useState('');
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSelectWorkspaceFile = async () => {
    try {
      const selectedPath = await window.electronAPI.selectFile({
        filters: [{ name: 'Workspace Files', extensions: ['code-workspace'] }],
      });
      if (selectedPath) {
        setWorkspaceFilePath(selectedPath);
      }
    } catch (error) {
      console.error('Error selecting workspace file:', error);
    }
  };


  const handleToggleProject = (projectPath: string) => {
    setSelectedProjects((prev) =>
      prev.includes(projectPath)
        ? prev.filter((p) => p !== projectPath)
        : [...prev, projectPath]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);

      if (mode === 'import') {
        if (!workspaceFilePath) {
          alert('Please select a workspace file');
          return;
        }

        // Try to find API port
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
        
        const response = await fetch(`${apiBaseUrl}/workspaces/import`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ workspace_file_path: workspaceFilePath }),
        });

        if (!response.ok) {
          // Check if response is JSON
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to import workspace');
          } else {
            // If not JSON, read as text to see what we got
            const text = await response.text();
            throw new Error(`Server returned ${response.status}: ${text.substring(0, 100)}`);
          }
        }

        const workspace = await response.json();
        await onAdd(workspace);
      } else {
        // Create mode
        if (!workspaceName) {
          alert('Please provide workspace name');
          return;
        }

        // Try to find API port
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
        
        const response = await fetch(`${apiBaseUrl}/workspaces/create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: workspaceName,
            description: workspaceDescription,
            projects: selectedProjects,
            // output_path is no longer required - workspace files are stored in ~/.projax/workspaces/
          }),
        });

        if (!response.ok) {
          // Check if response is JSON
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to create workspace');
          } else {
            // If not JSON, read as text to see what we got
            const text = await response.text();
            throw new Error(`Server returned ${response.status}: ${text.substring(0, 100)}`);
          }
        }

        const workspace = await response.json();
        await onAdd(workspace);
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to add workspace');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content workspace-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add Workspace</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="workspace-mode-selector">
          <button
            type="button"
            className={`mode-button ${mode === 'import' ? 'active' : ''}`}
            onClick={() => setMode('import')}
          >
            Import from File
          </button>
          <button
            type="button"
            className={`mode-button ${mode === 'create' ? 'active' : ''}`}
            onClick={() => setMode('create')}
          >
            Create New
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {mode === 'import' ? (
            <div className="form-group">
              <label htmlFor="workspace-file">Workspace File (.code-workspace)</label>
              <div className="path-input-group">
                <input
                  id="workspace-file"
                  type="text"
                  value={workspaceFilePath}
                  onChange={(e) => setWorkspaceFilePath(e.target.value)}
                  placeholder="Select workspace file"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={handleSelectWorkspaceFile}
                  disabled={loading}
                  className="btn btn-secondary"
                >
                  Browse
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="form-group">
                <label htmlFor="workspace-name">Workspace Name *</label>
                <input
                  id="workspace-name"
                  type="text"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  placeholder="My Workspace"
                  disabled={loading}
                  required
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="workspace-description">Description</label>
                <textarea
                  id="workspace-description"
                  value={workspaceDescription}
                  onChange={(e) => setWorkspaceDescription(e.target.value)}
                  placeholder="Optional description"
                  disabled={loading}
                  rows={3}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <p className="form-hint" style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                  Workspace files are automatically stored in ~/.projax/workspaces/
                </p>
              </div>

              <div className="form-group">
                <label>Add Projects</label>
                <div className="projects-selector">
                  {existingProjects.length === 0 ? (
                    <p className="empty-state">No projects available</p>
                  ) : (
                    existingProjects.map((project) => (
                      <label key={project.id} className="project-checkbox">
                        <input
                          type="checkbox"
                          checked={selectedProjects.includes(project.path)}
                          onChange={() => handleToggleProject(project.path)}
                          disabled={loading}
                        />
                        <span>{project.name}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>
            </>
          )}

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
              {loading ? 'Adding...' : mode === 'import' ? 'Import' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddWorkspaceModal;

