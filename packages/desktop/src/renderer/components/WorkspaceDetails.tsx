import React, { useState, useEffect } from 'react';
import './WorkspaceDetails.css';

type Workspace = any;
type Project = any;

interface WorkspaceDetailsProps {
  workspace: Workspace | null;
  onWorkspaceUpdate?: (workspace: Workspace) => void;
  onRemoveWorkspace?: (workspaceId: number) => void;
  onOpenWorkspace?: (workspace: Workspace) => void;
  onSelectProject?: (project: Project) => void;
}

const WorkspaceDetails: React.FC<WorkspaceDetailsProps> = ({
  workspace,
  onWorkspaceUpdate,
  onRemoveWorkspace,
  onOpenWorkspace,
  onSelectProject,
}) => {
  const [editingName, setEditingName] = useState(false);
  const [workspaceName, setWorkspaceName] = useState('');
  const [editingDescription, setEditingDescription] = useState(false);
  const [workspaceDescription, setWorkspaceDescription] = useState('');
  const [_editingTags, _setEditingTags] = useState(false);
  const [_tagInput, _setTagInput] = useState('');
  const [_allTags, setAllTags] = useState<string[]>([]);
  const [_workspaceTags, setWorkspaceTags] = useState<string[]>([]);
  const [_workspaceProjects, setWorkspaceProjects] = useState<any[]>([]);
  const [projectsData, setProjectsData] = useState<Array<{ tracked: boolean; project?: Project; path: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [addingProject, setAddingProject] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  useEffect(() => {
    if (workspace) {
      setWorkspaceName(workspace.name);
      setWorkspaceDescription(workspace.description || '');
      setWorkspaceTags(workspace.tags || []);
      setEditingName(false);
      setEditingDescription(false);
      loadWorkspaceProjects();
      loadAllTags();
    }
  }, [workspace?.id]); // Only re-run when workspace ID changes

  const loadAllTags = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/projects/tags');
      if (response.ok) {
        const tags = await response.json();
        setAllTags(Array.isArray(tags) ? tags : []);
      }
    } catch (error) {
      console.error('Error loading tags:', error);
    }
  };

  const loadWorkspaceProjects = async () => {
    if (!workspace) return;
    try {
      setLoading(true);
      // Try common API ports
      const ports = [38124, 38125, 38126, 38127, 38128, 3001];
      let apiBaseUrl = '';
      
      for (const port of ports) {
        try {
          const response = await fetch(`http://localhost:${port}/health`, { signal: AbortSignal.timeout(500) });
          if (response.ok) {
            apiBaseUrl = `http://localhost:${port}/api`;
            break;
          }
        } catch {
          continue;
        }
      }
      
      if (!apiBaseUrl) {
        setLoading(false);
        return;
      }
      
      const response = await fetch(`${apiBaseUrl}/workspaces/${workspace.id}/projects`);
      if (response.ok) {
        const projects = await response.json();
        setWorkspaceProjects(projects);
        
        // Load full project data from PROJAX and match with workspace projects
        const allProjects = await window.electronAPI.getProjects();
        const enrichedProjects = projects.map((wp: any) => {
          const matchedProject = allProjects.find((p: Project) => p.path === wp.project_path);
          return {
            tracked: !!matchedProject,
            project: matchedProject,
            path: wp.project_path,
          };
        });
        
        setProjectsData(enrichedProjects);
      }
    } catch (error) {
      console.error('Error loading workspace projects:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!workspace) {
    return (
      <div className="workspace-details-empty">
        <p>Select a workspace to view details</p>
      </div>
    );
  }

  const getApiBaseUrl = async (): Promise<string | null> => {
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

  const handleSaveName = async () => {
    try {
      const apiBaseUrl = await getApiBaseUrl();
      if (!apiBaseUrl) return;
      const response = await fetch(`${apiBaseUrl}/workspaces/${workspace.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: workspaceName }),
      });
      if (response.ok) {
        const updated = await response.json();
        if (onWorkspaceUpdate) onWorkspaceUpdate(updated);
        setEditingName(false);
      }
    } catch (error) {
      console.error('Error updating workspace name:', error);
    }
  };

  const handleSaveDescription = async () => {
    try {
      const apiBaseUrl = await getApiBaseUrl();
      if (!apiBaseUrl) return;
      const response = await fetch(`${apiBaseUrl}/workspaces/${workspace.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: workspaceDescription }),
      });
      if (response.ok) {
        const updated = await response.json();
        if (onWorkspaceUpdate) onWorkspaceUpdate(updated);
        setEditingDescription(false);
      }
    } catch (error) {
      console.error('Error updating workspace description:', error);
    }
  };

  const generateRandomString = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const [confirmationCode] = useState(generateRandomString());

  const handleDeleteWorkspace = () => {
    if (!workspace) return;
    if (deleteConfirmText === confirmationCode) {
      if (onRemoveWorkspace) {
        onRemoveWorkspace(workspace.id);
      }
      setShowDeleteModal(false);
      setDeleteConfirmText('');
    }
  };

  const handleAddProjectToProjax = async (projectPath: string) => {
    try {
      setAddingProject(projectPath);
      await window.electronAPI.addProject(projectPath);
      // Reload projects to update the list
      await loadWorkspaceProjects();
    } catch (error) {
      console.error('Error adding project to PROJAX:', error);
      alert(`Failed to add project: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setAddingProject(null);
    }
  };

  return (
    <div className="workspace-details">
      <div className="workspace-details-header">
        <div>
          {editingName ? (
            <div className="workspace-name-edit">
              <input
                type="text"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                onBlur={handleSaveName}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveName();
                  if (e.key === 'Escape') {
                    setWorkspaceName(workspace.name);
                    setEditingName(false);
                  }
                }}
                autoFocus
                className="workspace-name-input"
              />
            </div>
          ) : (
            <h2 className="workspace-name-editable" onClick={() => setEditingName(true)} title="Click to rename">
              {workspace.name}
            </h2>
          )}
          {editingDescription ? (
            <div className="workspace-description-edit">
              <textarea
                value={workspaceDescription}
                onChange={(e) => setWorkspaceDescription(e.target.value)}
                onBlur={handleSaveDescription}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    handleSaveDescription();
                  } else if (e.key === 'Escape') {
                    setWorkspaceDescription(workspace.description || '');
                    setEditingDescription(false);
                  }
                }}
                autoFocus
                className="workspace-description-input"
                placeholder="Add a description for this workspace... (⌘+Enter to save, Esc to cancel)"
              />
            </div>
          ) : (
            <div>
              <p 
                className="workspace-description" 
                onClick={() => setEditingDescription(true)}
                title="Click to edit description"
              >
                {workspace.description || 'Click to add a description...'}
              </p>
              <p className="workspace-path">{workspace.workspace_file_path}</p>
            </div>
          )}
        </div>
        <div className="header-actions-group">
          <button
            type="button"
            onClick={() => onOpenWorkspace && onOpenWorkspace(workspace)}
            className="btn btn-secondary"
            title="Open workspace in editor"
          >
            Editor
          </button>
        </div>
      </div>

      <div className="workspace-section">
        <h3>Workspace Projects ({projectsData.length})</h3>
        {loading ? (
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading projects...</p>
          </div>
        ) : projectsData.length === 0 ? (
          <div className="empty-state">
            <p>No projects in this workspace</p>
          </div>
        ) : (
          <div className="workspace-projects-list">
            {projectsData.map((item, index) => {
              const getDisplayPath = (fullPath: string): string => {
                const parts = fullPath.split('/').filter(Boolean);
                if (parts.length === 0) return fullPath;
                const lastDir = parts[parts.length - 1];
                if (lastDir === 'src' && parts.length > 1) {
                  return parts[parts.length - 2];
                }
                return lastDir;
              };

              const displayName = item.tracked && item.project 
                ? item.project.name 
                : item.path.split('/').filter(Boolean).pop() || item.path;

              return (
                <div 
                  key={item.tracked ? item.project!.id : index}
                  className={`workspace-project-tile ${!item.tracked ? 'untracked' : ''}`}
                  onClick={() => item.tracked && item.project && onSelectProject && onSelectProject(item.project)}
                >
                  <div className="project-tile-header">
                    <h3 className="project-tile-name">
                      {!item.tracked && <span className="untracked-badge">Not in PROJAX</span>}
                      {displayName}
                    </h3>
                  </div>
                  <p className="project-tile-path">
                    {item.tracked && item.project 
                      ? (item.project.description || getDisplayPath(item.project.path))
                      : item.path
                    }
                  </p>
                  {item.tracked && item.project && item.project.tags && item.project.tags.length > 0 && (
                    <div className="project-tile-tags">
                      {item.project.tags.map((tag: string) => (
                        <span key={tag} className="project-tile-tag">{tag}</span>
                      ))}
                    </div>
                  )}
                  {!item.tracked && (
                    <div className="project-tile-actions">
                      <button
                        type="button"
                        className="btn-add-project"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddProjectToProjax(item.path);
                        }}
                        disabled={addingProject === item.path}
                      >
                        {addingProject === item.path ? 'Adding...' : 'Add to PROJAX'}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {onRemoveWorkspace && (
        <div className="danger-zone">
          <h3>Danger Zone</h3>
          <p className="danger-zone-text">Once you delete this workspace, there is no going back. Please be certain.</p>
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="btn btn-danger"
            title="Delete workspace"
          >
            Delete Workspace
          </button>
        </div>
      )}

      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => { setShowDeleteModal(false); setDeleteConfirmText(''); }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Delete Workspace</h3>
            <p className="modal-warning">
              This will permanently delete the workspace <strong>"{workspace.name}"</strong> from PROJAX.
              <br /><br />
              The workspace file will <strong>not</strong> be deleted from your filesystem.
            </p>
            <p className="modal-instruction">
              Type <code className="confirmation-code">{confirmationCode}</code> to confirm:
            </p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="Enter confirmation code"
              className="confirmation-input"
              autoFocus
            />
            <div className="modal-actions">
              <button
                type="button"
                onClick={() => { setShowDeleteModal(false); setDeleteConfirmText(''); }}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteWorkspace}
                className="btn btn-danger"
                disabled={deleteConfirmText !== confirmationCode}
              >
                Delete Workspace
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkspaceDetails;

