import React, { useState, useEffect, useMemo } from 'react';
// Note: Renderer runs in browser context, types only
type Project = any;
import ProjectUrls from './ProjectUrls';
import './ProjectDetails.css';

interface ProjectDetailsProps {
  project: Project;
  workspace?: any;
  onProjectUpdate?: (project: Project) => void;
  onRemoveProject?: (projectId: number) => void;
  onOpenTerminal?: (pid: number, scriptName: string, projectName: string) => void;
  onNavigateBack?: () => void;
}

const ProjectDetails: React.FC<ProjectDetailsProps> = ({
  project,
  workspace,
  onProjectUpdate,
  onRemoveProject,
  onOpenTerminal,
  onNavigateBack,
}) => {
  const [editingName, setEditingName] = useState(false);
  const [projectName, setProjectName] = useState(project.name);
  const [editingDescription, setEditingDescription] = useState(false);
  const [projectDescription, setProjectDescription] = useState(project.description || '');
  const [scripts, setScripts] = useState<any>(null);
  const [loadingScripts, setLoadingScripts] = useState(false);
  const [scriptsError, setScriptsError] = useState<string | null>(null);
  const [ports, setPorts] = useState<any[]>([]);
  const [_loadingPorts, setLoadingPorts] = useState(false);
  const [_runningScripts, setRunningScripts] = useState<Set<string>>(new Set());
  const [runningProcesses, setRunningProcesses] = useState<any[]>([]);
  const [_loadingProcesses, setLoadingProcesses] = useState(false);
  const [editingTags, setEditingTags] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [allTags, setAllTags] = useState<string[]>([]);
  const [projectTags, setProjectTags] = useState<string[]>(project.tags || []);
  const [_editorSettings, setEditorSettings] = useState<any>(null);
  const [latestTestResult, setLatestTestResult] = useState<any>(null);
  const [_loadingTestResult, setLoadingTestResult] = useState(false);
  const [scriptSortOrder, setScriptSortOrder] = useState<'default' | 'alphabetical' | 'last-used'>('default');
  const [scriptLastUsed, setScriptLastUsed] = useState<Map<string, number>>(new Map());

  useEffect(() => {
    setProjectName(project.name);
    setProjectDescription(project.description || '');
    setProjectTags(project.tags || []);
    loadScripts();
    loadPorts();
    loadRunningProcesses();
    loadAllTags();
    loadEditorSettings();
    loadLatestTestResult();
    loadProjectSettings();
    
    // Refresh running processes and test results every 5 seconds
    const interval = setInterval(() => {
      loadRunningProcesses();
      loadLatestTestResult();
    }, 5000);
    
    return () => clearInterval(interval);
  }, [project]);

  const loadProjectSettings = async () => {
    try {
      const apiBaseUrl = await getApiBaseUrl();
      if (!apiBaseUrl) return;
      const response = await fetch(`${apiBaseUrl}/projects/${project.id}/settings`);
      if (response.ok) {
        const settings = await response.json();
        setScriptSortOrder(settings.script_sort_order || 'default');
      }
    } catch (error) {
      console.error('Error loading project settings:', error);
    }
  };

  const saveProjectSettings = async (sortOrder: 'default' | 'alphabetical' | 'last-used') => {
    try {
      const apiBaseUrl = await getApiBaseUrl();
      if (!apiBaseUrl) return;
      const response = await fetch(`${apiBaseUrl}/projects/${project.id}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ script_sort_order: sortOrder }),
      });
      if (response.ok) {
        setScriptSortOrder(sortOrder);
      }
    } catch (error) {
      console.error('Error saving project settings:', error);
    }
  };

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

  const loadAllTags = async () => {
    try {
      const apiBaseUrl = await getApiBaseUrl();
      if (!apiBaseUrl) {
        setAllTags([]);
        return;
      }
      const response = await fetch(`${apiBaseUrl}/projects/tags`);
      if (!response.ok) {
        console.error('Failed to load tags:', response.status);
        setAllTags([]);
        return;
      }
      const tags = await response.json();
      // Ensure we always set an array
      setAllTags(Array.isArray(tags) ? tags : []);
    } catch (error) {
      console.error('Error loading tags:', error);
      setAllTags([]);
    }
  };

    const loadEditorSettings = async () => {
    try {
      const settings = await window.electronAPI.getSettings();
      setEditorSettings(settings.editor);
    } catch (error) {
      console.error('Error loading editor settings:', error);
    }
  };

const loadScripts = async () => {
    try {
      setLoadingScripts(true);
      setScriptsError(null);
      const projectScripts = await window.electronAPI.getProjectScripts(project.path);
      setScripts(projectScripts);
    } catch (error) {
      console.error('Error loading scripts:', error);
      setScripts(null);
      setScriptsError(error instanceof Error ? error.message : String(error));
    } finally {
      setLoadingScripts(false);
    }
  };

  const loadPorts = async () => {
    try {
      setLoadingPorts(true);
      const projectPorts = await window.electronAPI.getProjectPorts(project.id);
      setPorts(projectPorts);
    } catch (error) {
      console.error('Error loading ports:', error);
      setPorts([]);
    } finally {
      setLoadingPorts(false);
    }
  };

  const loadLatestTestResult = async () => {
    try {
      setLoadingTestResult(true);
      const result = await window.electronAPI.getLatestTestResult(project.id);
      setLatestTestResult(result);
    } catch (error) {
      // Silently fail - test results are optional
      setLatestTestResult(null);
    } finally {
      setLoadingTestResult(false);
    }
  };

  const handleRename = async () => {
    if (!projectName.trim() || projectName === project.name) {
      setEditingName(false);
      setProjectName(project.name);
      return;
    }

    try {
      const updated = await window.electronAPI.renameProject(project.id, projectName.trim());
      setEditingName(false);
      if (onProjectUpdate) {
        onProjectUpdate(updated);
      }
    } catch (error) {
      console.error('Error renaming project:', error);
      alert('Failed to rename project');
      setProjectName(project.name);
    }
  };

  const handleUpdateDescription = async () => {
    const newDescription = projectDescription.trim() || null;
    if (newDescription === (project.description || '')) {
      setEditingDescription(false);
      setProjectDescription(project.description || '');
      return;
    }

    try {
      const updated = await window.electronAPI.updateProject(project.id, { description: newDescription });
      setEditingDescription(false);
      if (onProjectUpdate) {
        onProjectUpdate(updated);
      }
    } catch (error) {
      console.error('Error updating description:', error);
      alert('Failed to update description');
      setProjectDescription(project.description || '');
    }
  };

  const handleAddTag = async () => {
    const newTag = tagInput.trim();
    if (!newTag || projectTags.includes(newTag)) {
      setTagInput('');
      return;
    }

    const updatedTags = [...projectTags, newTag];
    try {
      const updated = await window.electronAPI.updateProject(project.id, { tags: updatedTags });
      setProjectTags(updatedTags);
      setTagInput('');
      if (onProjectUpdate) {
        onProjectUpdate(updated);
      }
      await loadAllTags();
    loadEditorSettings();
    } catch (error) {
      console.error('Error adding tag:', error);
      alert('Failed to add tag');
    }
  };

  const handleRemoveTag = async (tagToRemove: string) => {
    const updatedTags = projectTags.filter(tag => tag !== tagToRemove);
    try {
      const updated = await window.electronAPI.updateProject(project.id, { tags: updatedTags });
      setProjectTags(updatedTags);
      if (onProjectUpdate) {
        onProjectUpdate(updated);
      }
      await loadAllTags();
    loadEditorSettings();
    } catch (error) {
      console.error('Error removing tag:', error);
      alert('Failed to remove tag');
    }
  };

  const suggestedTags = allTags.filter(tag => 
    !projectTags.includes(tag) && 
    tag.toLowerCase().includes(tagInput.toLowerCase())
  );


  const loadRunningProcesses = async () => {
    try {
      setLoadingProcesses(true);
      const processes = await window.electronAPI.getRunningProcesses();
      const projectProcesses = processes.filter((p: any) => p.projectPath === project.path);
      setRunningProcesses(projectProcesses);
      
      // Update running scripts set
      const runningScriptNames = new Set(projectProcesses.map((p: any) => p.scriptName));
      setRunningScripts(runningScriptNames);
    } catch (error) {
      console.error('Error loading running processes:', error);
    } finally {
      setLoadingProcesses(false);
    }
  };

  const handleRunScript = async (scriptName: string, background: boolean = true) => {
    try {
      setRunningScripts(prev => new Set(prev).add(scriptName));
      // Track last-used timestamp
      setScriptLastUsed(prev => new Map(prev).set(scriptName, Date.now()));
      await window.electronAPI.runScript(project.path, scriptName, [], background);
      if (background) {
        // Refresh processes after a short delay
        setTimeout(() => {
          loadRunningProcesses();
        }, 1000);
      }
    } catch (error) {
      console.error('Error running script:', error);
      alert(`Failed to run script: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setRunningScripts(prev => {
        const next = new Set(prev);
        next.delete(scriptName);
        return next;
      });
    }
  };

  const handleStopScript = async (pid: number) => {
    try {
      const success = await window.electronAPI.stopScript(pid);
      if (success) {
        await loadRunningProcesses();
      } else {
        alert('Failed to stop script');
      }
    } catch (error) {
      console.error('Error stopping script:', error);
      alert(`Failed to stop script: ${error instanceof Error ? error.message : String(error)}`);
    }
  };


  const handleOpenUrl = async (url: string) => {
    try {
      await window.electronAPI.openUrl(url);
    } catch (error) {
      console.error('Error opening URL:', error);
      alert(`Failed to open URL: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // Collect all URLs from running processes and ports
  const allUrls = useMemo(() => {
    const urls = new Set<string>();
    
    // Add URLs from running processes
    for (const process of runningProcesses) {
      if (process.detectedUrls && Array.isArray(process.detectedUrls)) {
        for (const url of process.detectedUrls) {
          urls.add(url);
        }
      }
    }
    
    // Add URLs from detected ports
    for (const portInfo of ports) {
      const url = `http://localhost:${portInfo.port}`;
      urls.add(url);
    }
    
    return Array.from(urls).sort();
  }, [runningProcesses, ports]);

  // Sort scripts based on sort order
  const sortedScripts = useMemo(() => {
    if (!scripts?.scripts) return [];
    const sorted = [...scripts.scripts];
    if (scriptSortOrder === 'alphabetical') {
      sorted.sort((a, b) => a.name.localeCompare(b.name));
    } else if (scriptSortOrder === 'last-used') {
      sorted.sort((a, b) => {
        const aTime = scriptLastUsed.get(a.name) || 0;
        const bTime = scriptLastUsed.get(b.name) || 0;
        return bTime - aTime; // Most recent first
      });
    }
    return sorted;
  }, [scripts?.scripts, scriptSortOrder, scriptLastUsed]);

  return (
    <div className="project-details">
      {workspace && onNavigateBack && (
        <div className="breadcrumb">
          <button className="breadcrumb-link" onClick={onNavigateBack}>
            {workspace.name}
          </button>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-current">{project.name}</span>
        </div>
      )}
      <div className="project-details-header">
        <div>
          {editingName ? (
            <div className="project-name-edit">
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                onBlur={handleRename}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleRename();
                  } else if (e.key === 'Escape') {
                    setEditingName(false);
                    setProjectName(project.name);
                  }
                }}
                className="project-name-input"
                autoFocus
              />
            </div>
          ) : (
            <h2 onClick={() => setEditingName(true)} className="project-name-editable" title="Click to rename">
              {project.name}
            </h2>
          )}
          {editingDescription ? (
            <div className="project-description-edit">
              <textarea
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                onBlur={handleUpdateDescription}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    handleUpdateDescription();
                  } else if (e.key === 'Escape') {
                    setEditingDescription(false);
                    setProjectDescription(project.description || '');
                  }
                }}
                className="project-description-input"
                placeholder="Add a description for this project... (⌘+Enter to save, Esc to cancel)"
                autoFocus
              />
            </div>
          ) : (
            <div>
              <p 
                className="project-description" 
                onClick={() => setEditingDescription(true)}
                title="Click to edit description"
              >
                {project.description || 'Click to add a description...'}
              </p>
              <p className="project-path">{project.path}</p>
            </div>
          )}
        </div>
        <div className="header-actions-group">
          <button
            onClick={async () => {
              try {
                await window.electronAPI.openInEditor(project.path);
              } catch (error) {
                console.error('Error opening in editor:', error);
                alert(`Failed to open in editor: ${error instanceof Error ? error.message : String(error)}`);
              }
            }}
            className="btn btn-secondary"
            title="Open in editor"
          >
            Editor
          </button>
          <button
            onClick={async () => {
              try {
                await window.electronAPI.openInFiles(project.path);
              } catch (error) {
                console.error('Error opening directory:', error);
                alert(`Failed to open directory: ${error instanceof Error ? error.message : String(error)}`);
              }
            }}
            className="btn btn-secondary"
            title="Open in file manager"
          >
            Files
          </button>
        </div>
      </div>

      <div className="project-stats">
        <div className="stat-card">
          <div className="stat-value">{ports.length}</div>
          <div className="stat-label">Ports</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{scripts?.scripts?.length || 0}</div>
          <div className="stat-label">Scripts</div>
        </div>
      </div>

      {/* Test Results Section */}
      {latestTestResult && (
        <div className="test-results-section">
          <div className="section-header">
            <h3>Latest Test Results</h3>
            <span className="test-timestamp">
              {new Date(latestTestResult.timestamp * 1000).toLocaleString()}
            </span>
          </div>
          <div className="test-results-content">
            <div className="test-stats-grid">
              <div className="test-stat passed">
                <div className="test-stat-icon">✓</div>
                <div className="test-stat-info">
                  <div className="test-stat-value">{latestTestResult.passed}</div>
                  <div className="test-stat-label">Passed</div>
                </div>
              </div>
              <div className="test-stat failed">
                <div className="test-stat-icon">✗</div>
                <div className="test-stat-info">
                  <div className="test-stat-value">{latestTestResult.failed}</div>
                  <div className="test-stat-label">Failed</div>
                </div>
              </div>
              {latestTestResult.skipped > 0 && (
                <div className="test-stat skipped">
                  <div className="test-stat-icon">⊘</div>
                  <div className="test-stat-info">
                    <div className="test-stat-value">{latestTestResult.skipped}</div>
                    <div className="test-stat-label">Skipped</div>
                  </div>
                </div>
              )}
              <div className="test-stat total">
                <div className="test-stat-icon">∑</div>
                <div className="test-stat-info">
                  <div className="test-stat-value">{latestTestResult.total}</div>
                  <div className="test-stat-label">Total</div>
                </div>
              </div>
            </div>
            <div className="test-meta">
              {latestTestResult.framework && (
                <span className="test-framework-badge">{latestTestResult.framework}</span>
              )}
              {latestTestResult.duration && (
                <span className="test-duration">⏱ {(latestTestResult.duration / 1000).toFixed(2)}s</span>
              )}
              {latestTestResult.coverage && (
                <span className="test-coverage">📊 {latestTestResult.coverage.toFixed(1)}% coverage</span>
              )}
              <span className="test-script-name">Script: {latestTestResult.script_name}</span>
            </div>
          </div>
        </div>
      )}

      {/* Tags Section */}
      <div className="tags-section">
        <div className="section-header">
          <h3>Tags</h3>
        </div>
        <div className="tags-content">
          <div className="tags-list">
            {projectTags.map((tag) => (
              <span key={tag} className="tag-item">
                {tag}
                <button
                  onClick={() => handleRemoveTag(tag)}
                  className="tag-remove"
                  title="Remove tag"
                >
                  ×
                </button>
              </span>
            ))}
            {editingTags ? (
              <div className="tag-input-wrapper">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleAddTag();
                    } else if (e.key === 'Escape') {
                      setEditingTags(false);
                      setTagInput('');
                    }
                  }}
                  onBlur={() => {
                    handleAddTag();
                    setEditingTags(false);
                  }}
                  className="tag-input"
                  placeholder="Add tag..."
                  autoFocus
                />
                {suggestedTags.length > 0 && tagInput && (
                  <div className="tag-suggestions">
                    {suggestedTags.slice(0, 5).map((tag) => (
                      <div
                        key={tag}
                        className="tag-suggestion"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setTagInput(tag);
                        }}
                      >
                        {tag}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setEditingTags(true)}
                className="tag-add-btn"
                title="Add tag"
              >
                + Add Tag
              </button>
            )}
          </div>
        </div>
      </div>

      {allUrls.length > 0 && (
        <ProjectUrls urls={allUrls} onOpenUrl={handleOpenUrl} />
      )}

      

        <div className="scripts-section">
          <div className="section-header">
          <h3>Available Scripts ({scripts?.scripts?.length ?? 0})</h3>
            <div className="section-header-right">
            <span className="project-type-badge">{scripts?.type ?? 'unknown'}</span>
              <select
                value={scriptSortOrder}
                onChange={(e) => saveProjectSettings(e.target.value as 'default' | 'alphabetical' | 'last-used')}
                className="script-sort-select"
              disabled={loadingScripts}
              >
                <option value="default">Default</option>
                <option value="alphabetical">Alphabetically</option>
                <option value="last-used">Last Used</option>
              </select>
            </div>
          </div>

          {loadingScripts ? (
            <div className="loading-state">Loading scripts...</div>
        ) : scriptsError ? (
          <div className="no-scripts">
            <div style={{ marginBottom: 8 }}>
              Failed to load scripts: {scriptsError}
            </div>
            <button onClick={loadScripts} className="btn btn-secondary btn-small">
              Retry
            </button>
          </div>
        ) : (scripts?.scripts?.length ?? 0) === 0 ? (
            <div className="no-scripts">No scripts found in this project.</div>
          ) : (
            <div className="scripts-list">
              {sortedScripts.map((script: any) => {
                const scriptProcesses = runningProcesses.filter((p: any) => p.scriptName === script.name);
                const isRunning = scriptProcesses.length > 0;
                // Match ports from the ports array with this script name
                const scriptPorts = ports
                  .filter((port: any) => port.script_name === script.name)
                  .map((port: any) => port.port);
                const uniquePorts = Array.from(new Set(scriptPorts)).sort((a, b) => a - b);
                
                return (
                  <div key={script.name} className={`script-item ${isRunning ? 'running' : ''}`}>
                    <div className="script-info">
                      <div className="script-header">
                        <span className="script-name">{script.name}</span>
                        <span className="script-command">{script.command}</span>
                        <span className="script-runner">{script.runner}</span>
                      </div>
                      {isRunning && (
                        <div className="script-process-info">
                          {scriptProcesses.map((p: any) => {
                            const uptime = Math.floor((Date.now() - p.startedAt) / 1000);
                            const minutes = Math.floor(uptime / 60);
                            const seconds = uptime % 60;
                            const uptimeStr = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
                            // Use detected ports from running process if available, otherwise fall back to static ports
                            const displayPorts = p.detectedPorts && p.detectedPorts.length > 0 
                              ? p.detectedPorts 
                              : uniquePorts;
                            return (
                              <div key={p.pid} className="process-badge">
                                <span className="process-indicator">●</span>
                                <span className="process-pid">PID: {p.pid}</span>
                                <span className="process-uptime">{uptimeStr}</span>
                                {displayPorts.length > 0 && (
                                  <span className="process-port">:{displayPorts.join(', ')}</span>
                                )}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (onOpenTerminal) {
                                      onOpenTerminal(p.pid, script.name, project.name);
                                    }
                                  }}
                                  className="btn btn-secondary btn-tiny"
                                  title="View terminal output"
                                >
                                  <span className="terminal-icon">⌘</span>
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStopScript(p.pid);
                                  }}
                                  className="btn btn-danger btn-tiny"
                                  title="Stop process"
                                >
                                  Stop
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    <div className="script-actions">
                      {!isRunning && (
                        <button
                          onClick={() => handleRunScript(script.name, true)}
                          className="btn btn-secondary btn-small"
                          title="Run in background"
                        >
                          Run
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      <div className="jenkins-placeholder">
        <h3>Jenkins Integration</h3>
        <p className="placeholder-text">
          Jenkins integration will be available in a future update. This section will display
          Jenkins job statuses and build information for your projects.
        </p>
      </div>

      {onRemoveProject && (
        <div className="danger-zone">
          <h3>Danger Zone</h3>
          <p className="danger-zone-text">Once you delete a project, there is no going back. Please be certain.</p>
          <button
            onClick={async () => {
              const confirmed = confirm(
                `Are you sure you want to remove "${project.name}"?\n\nThis will delete the project from PROJAX (not from your filesystem).\n\nThis action cannot be undone.`
              );
              if (confirmed) {
                await onRemoveProject(project.id);
              }
            }}
            className="btn btn-danger"
            title="Remove project"
          >
            Delete Project
          </button>
        </div>
      )}
    </div>
  );
};

export default ProjectDetails;

