import React, { useState, useEffect, useMemo } from 'react';
// Note: Renderer runs in browser context, types only
// The actual data comes from IPC
type Project = any;
import { ElectronAPI } from '../main/preload';
import { Rnd } from 'react-rnd';
import ProjectList from './components/ProjectList';
import ProjectDetails from './components/ProjectDetails';
import AddProjectModal from './components/AddProjectModal';
import ProjectSearch, { FilterType, SortType } from './components/ProjectSearch';
import Settings from './components/Settings';
import Titlebar from './components/Titlebar';
import StatusBar from './components/StatusBar';
import Terminal from './components/Terminal';
import TabBar from './components/TabBar';
import WorkspaceList from './components/WorkspaceList';
import WorkspaceDetails from './components/WorkspaceDetails';
import AddWorkspaceModal from './components/AddWorkspaceModal';
import WorkspaceSearch, { WorkspaceSortType } from './components/WorkspaceSearch';
import './App.css';

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

function App() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [sortType, setSortType] = useState<SortType>('name-asc');
  const [showSettings, setShowSettings] = useState(false);
  const [runningProcesses, setRunningProcesses] = useState<any[]>([]);
  const [keyboardFocusedIndex, setKeyboardFocusedIndex] = useState<number>(-1);
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const [sidebarWidth, setSidebarWidth] = useState<number>(280);
  const [terminalWidth, setTerminalWidth] = useState<number>(550);
  const [terminalProcess, setTerminalProcess] = useState<{
    pid: number;
    scriptName: string;
    projectName: string;
  } | null>(null);
  const [activeTab, setActiveTab] = useState<'projects' | 'workspaces'>('projects');
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState<any | null>(null);
  const [loadingWorkspaces, setLoadingWorkspaces] = useState(false);
  const [showAddWorkspaceModal, setShowAddWorkspaceModal] = useState(false);
  const [gitBranches, setGitBranches] = useState<Map<number, string | null>>(new Map());
  const [workspaceProjectCounts, setWorkspaceProjectCounts] = useState<Map<number, number>>(new Map());
  const [workspaceSearchQuery, setWorkspaceSearchQuery] = useState('');
  const [workspaceSortType, setWorkspaceSortType] = useState<WorkspaceSortType>('name-asc');
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [isAddingProjects, setIsAddingProjects] = useState(false);

  // Clear project selection when switching tabs
  useEffect(() => {
    setSelectedProject(null);
  }, [activeTab]);

  useEffect(() => {
    loadProjects();
    loadWorkspaces();
    loadRunningProcesses();
    
    // Refresh running processes and git branches every 5 seconds
    const interval = setInterval(() => {
      loadRunningProcesses();
      updateGitBranches();
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Update git branches when projects change
    if (projects.length > 0) {
      updateGitBranches();
    }
  }, [projects]);


  const loadProjects = async () => {
    try {
      setLoading(true);
      const projs = await window.electronAPI.getProjects();
      setProjects(projs);
      if (projs.length === 0) {
        console.log('No projects found. Use "Add Project" to add one.');
      }
    } catch (error) {
      console.error('Error loading projects:', error);
      // Show error to user
      alert(`Error loading projects: ${error instanceof Error ? error.message : String(error)}\n\nCheck the console for more details.`);
    } finally {
      setLoading(false);
    }
  };

  const loadRunningProcesses = async () => {
    try {
      const processes = await window.electronAPI.getRunningProcesses();
      setRunningProcesses(processes);
    } catch (error) {
      console.error('Error loading running processes:', error);
    }
  };

  const loadWorkspaces = async () => {
    try {
      setLoadingWorkspaces(true);
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
        setLoadingWorkspaces(false);
        return;
      }
      
      const response = await fetch(`${apiBaseUrl}/workspaces`);
      if (response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const ws = await response.json();
          setWorkspaces(ws);
          
          // Load project counts for each workspace
          const counts = new Map<number, number>();
          await Promise.all(
            ws.map(async (workspace: any) => {
              try {
                const projectsResponse = await fetch(`${apiBaseUrl}/workspaces/${workspace.id}/projects`);
                if (projectsResponse.ok) {
                  const projects = await projectsResponse.json();
                  counts.set(workspace.id, projects.length);
                }
              } catch (error) {
                console.error(`Error loading projects for workspace ${workspace.id}:`, error);
              }
            })
          );
          setWorkspaceProjectCounts(counts);
        } else {
          const text = await response.text();
          console.error('API returned non-JSON response:', text.substring(0, 200));
          throw new Error('API server returned invalid response (not JSON)');
        }
      } else {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const error = await response.json();
          console.error('API error:', error);
        } else {
          const text = await response.text();
          console.error('API error (non-JSON):', text.substring(0, 200));
        }
      }
    } catch (error) {
      console.error('Error loading workspaces:', error);
    } finally {
      setLoadingWorkspaces(false);
    }
  };

  const updateGitBranches = async () => {
    try {
      const branches = new Map<number, string | null>();
      // Try common API ports
      const ports = [38124, 38125, 38126, 38127, 38128, 3001];
      let apiBaseUrl = '';
      
      // Find working API port
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
        // If no API found, set all to null
        for (const project of projects) {
          branches.set(project.id, null);
        }
        setGitBranches(branches);
        return;
      }
      
      for (const project of projects) {
        try {
          const response = await fetch(`${apiBaseUrl}/projects/${project.id}/git-branch`);
          if (response.ok) {
            const data = await response.json();
            branches.set(project.id, data.branch);
          } else {
            branches.set(project.id, null);
          }
        } catch {
          branches.set(project.id, null);
        }
      }
      setGitBranches(branches);
    } catch (error) {
      console.error('Error updating git branches:', error);
    }
  };

  const handleAddProject = async (path: string) => {
    try {
      const project = await window.electronAPI.addProject(path);
      await loadProjects();
      setShowAddModal(false);
      
      // Auto-scan the new project
      await window.electronAPI.scanProject(project.id);
      await loadProjects();
    } catch (error) {
      console.error('Error adding project:', error);
      alert(error instanceof Error ? error.message : 'Failed to add project');
      throw error; // Re-throw so caller can handle it
    }
  };

  const handleAddMultipleProjects = async (paths: string[]) => {
    setIsAddingProjects(true);
    const results: { success: number; errors: string[] } = { success: 0, errors: [] };
    
    for (const projectPath of paths) {
      try {
        await handleAddProject(projectPath);
        results.success++;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.errors.push(`${projectPath}: ${errorMessage}`);
      }
    }
    
    setIsAddingProjects(false);
    
    // Show summary
    if (results.errors.length > 0) {
      alert(`Added ${results.success} project(s). Errors:\n${results.errors.join('\n')}`);
    } else if (results.success > 0) {
      // Success feedback is handled by the project list updating
    }
  };

  const handleRemoveProject = async (projectId: number) => {
    if (!confirm('Are you sure you want to remove this project?')) {
      return;
    }
    
    try {
      await window.electronAPI.removeProject(projectId);
      if (selectedProject?.id === projectId) {
        setSelectedProject(null);
      }
      await loadProjects();
    } catch (error) {
      console.error('Error removing project:', error);
      alert('Failed to remove project');
    }
  };

  const handleSearchChange = (query: string, type: FilterType) => {
    setSearchQuery(query);
    setFilterType(type);
  };

  const filteredProjects = useMemo(() => {
    let filtered = projects;

    // Apply search filter
    if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase().trim();
      filtered = projects.filter((project: Project) => {
      switch (filterType) {
        case 'name':
          return project.name.toLowerCase().includes(query);
        case 'path':
          return project.path.toLowerCase().includes(query);
        case 'ports':
          // This will be enhanced when we load ports data
          return false; // Placeholder - will be enhanced
        case 'running':
          // This will be enhanced when we have running status
          return query === 'running' || query === 'not running';
        case 'all':
        default:
          return (
            project.name.toLowerCase().includes(query) ||
              project.path.toLowerCase().includes(query) ||
              (project.tags && project.tags.some((tag: string) => tag.toLowerCase().includes(query)))
          );
      }
    });
    }

    // Apply sorting
    const sorted = [...filtered];
    switch (sortType) {
      case 'name-asc':
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-desc':
        sorted.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'recent':
        sorted.sort((a, b) => (b.last_scanned || 0) - (a.last_scanned || 0));
        break;
      case 'oldest':
        sorted.sort((a, b) => a.created_at - b.created_at);
        break;
      case 'running':
        sorted.sort((a, b) => {
          const aRunning = runningProcesses.filter((p: any) => p.projectPath === a.path).length;
          const bRunning = runningProcesses.filter((p: any) => p.projectPath === b.path).length;
          return bRunning - aRunning;
        });
        break;
    }

    return sorted;
  }, [projects, searchQuery, filterType, sortType, runningProcesses]);

  const filteredWorkspaces = useMemo(() => {
    let filtered = workspaces;

    // Apply search filter
    if (workspaceSearchQuery.trim()) {
      const query = workspaceSearchQuery.toLowerCase().trim();
      filtered = workspaces.filter((workspace: any) => {
        return (
          workspace.name.toLowerCase().includes(query) ||
          (workspace.description && workspace.description.toLowerCase().includes(query)) ||
          workspace.workspace_file_path.toLowerCase().includes(query)
        );
      });
    }

    // Apply sorting
    filtered = [...filtered].sort((a, b) => {
      switch (workspaceSortType) {
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'recent':
          return (b.id || 0) - (a.id || 0); // Assuming higher ID = more recent
        case 'projects':
          {
            const aCount = workspaceProjectCounts.get(a.id) || 0;
            const bCount = workspaceProjectCounts.get(b.id) || 0;
            return bCount - aCount; // Most projects first
          }
        default:
          return 0;
      }
    });

    return filtered;
  }, [workspaces, workspaceSearchQuery, workspaceSortType, workspaceProjectCounts]);

  // Keyboard shortcuts and navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + , to open settings
      if ((e.metaKey || e.ctrlKey) && e.key === ',') {
        e.preventDefault();
        setShowSettings(true);
        return;
      }

      // Cmd/Ctrl + / to focus search
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }

      // Don't handle arrow keys if user is typing in an input/textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      // Only handle arrow keys if focus is in the project list
      const projectList = document.querySelector('.project-list');
      const isInProjectList = projectList && (
        projectList === target || 
        projectList.contains(target) ||
        target.closest('.project-item') !== null
      );

      if (!isInProjectList && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
        return; // Don't handle arrow keys outside project list
      }

      const filtered = filteredProjects;
      
      // Arrow keys for project navigation (only when in project list)
      if (e.key === 'ArrowDown' && isInProjectList) {
        e.preventDefault();
        const nextIndex = keyboardFocusedIndex < filtered.length - 1 
          ? keyboardFocusedIndex + 1 
          : filtered.length > 0 ? 0 : -1;
        if (nextIndex >= 0) {
          setKeyboardFocusedIndex(nextIndex);
          setSelectedProject(filtered[nextIndex]);
        }
      } else if (e.key === 'ArrowUp' && isInProjectList) {
        e.preventDefault();
        const prevIndex = keyboardFocusedIndex > 0 
          ? keyboardFocusedIndex - 1 
          : filtered.length > 0 ? filtered.length - 1 : -1;
        if (prevIndex >= 0) {
          setKeyboardFocusedIndex(prevIndex);
          setSelectedProject(filtered[prevIndex]);
        }
      } else if (e.key === 'Enter' && keyboardFocusedIndex >= 0 && keyboardFocusedIndex < filtered.length && isInProjectList) {
        e.preventDefault();
        setSelectedProject(filtered[keyboardFocusedIndex]);
      } else if (e.key === 'Escape' && isInProjectList) {
        setKeyboardFocusedIndex(-1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [keyboardFocusedIndex, filteredProjects]);

  // Reset keyboard focus when projects change
  useEffect(() => {
    setKeyboardFocusedIndex(-1);
  }, [filteredProjects.length, searchQuery]);

  const handleOpenTerminal = (pid: number, scriptName: string, projectName: string) => {
    setTerminalProcess({ pid, scriptName, projectName });
  };

  const handleCloseTerminal = () => {
    setTerminalProcess(null);
  };

  // Drag and drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes('Files')) {
      setIsDraggingOver(true);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes('Files')) {
      e.dataTransfer.dropEffect = 'copy';
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only clear drag state if we're leaving the app container
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDraggingOver(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);

    // Only handle drops when on projects tab
    if (activeTab !== 'projects' || isAddingProjects) {
      return;
    }

    const files = Array.from(e.dataTransfer.files);
    
    if (files.length === 0) {
      return;
    }

    // Extract paths from dropped items
    // In Electron, File objects have a 'path' property with the full file system path
    const paths: string[] = [];
    
    for (const file of files) {
      // TypeScript doesn't know about the 'path' property on File in Electron
      const fileWithPath = file as File & { path?: string };
      if (fileWithPath.path) {
        paths.push(fileWithPath.path);
      }
    }

    if (paths.length > 0) {
      // The add-project handler will validate that paths are directories
      // It will throw an error if a path is not a directory, which we handle in handleAddMultipleProjects
      await handleAddMultipleProjects(paths);
    } else {
      alert('Could not extract file paths. Please try using the "Add Project" button instead.');
    }
  };

  return (
    <div 
      className={`app ${isDraggingOver ? 'drag-over' : ''}`}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <Titlebar>
        <div className="header-actions">
          <button
            type="button"
            onClick={() => setShowSettings(true)}
            className="btn-link"
            title="Settings"
          >
            Settings
          </button>
          {activeTab === 'projects' ? (
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="btn-link btn-link-primary"
            >
              + Add Project
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowAddWorkspaceModal(true)}
              className="btn-link btn-link-primary"
            >
              + Add Workspace
            </button>
          )}
        </div>
      </Titlebar>

      <div className="app-content">
        <Rnd
          size={{ width: sidebarWidth, height: '100%' }}
          minWidth={200}
          maxWidth={600}
          disableDragging={true}
          enableResizing={{ right: true }}
          onResizeStop={(_e, _direction, _ref, d) => {
            const newWidth = sidebarWidth + d.width;
            setSidebarWidth(Math.max(200, Math.min(600, newWidth)));
          }}
          style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
          }}
          resizeHandleStyles={{
            right: {
              width: '4px',
              right: '-2px',
              cursor: 'col-resize',
              backgroundColor: 'transparent',
            },
          }}
        >
          <aside className="sidebar" style={{ width: '100%', height: '100%' }}>
            <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
            {activeTab === 'projects' ? (
              <>
                <ProjectSearch 
                  onSearchChange={handleSearchChange} 
                  onSortChange={setSortType}
                  searchInputRef={searchInputRef}
                />
                <ProjectList
                  projects={filteredProjects}
                  selectedProject={selectedProject}
                  onSelectProject={setSelectedProject}
                  loading={loading}
                  runningProcesses={runningProcesses}
                  keyboardFocusedIndex={keyboardFocusedIndex}
                  onKeyboardFocusChange={setKeyboardFocusedIndex}
                  gitBranches={gitBranches}
                />
              </>
            ) : (
              <>
                <WorkspaceSearch 
                  onSearchChange={setWorkspaceSearchQuery}
                  onSortChange={setWorkspaceSortType}
                />
                <WorkspaceList
                  workspaces={filteredWorkspaces}
                  selectedWorkspace={selectedWorkspace}
                  onSelectWorkspace={(workspace) => {
                    // Always clear project first to ensure clean state
                    setSelectedProject(null);
                    // Use a small delay to ensure project is cleared before setting workspace
                    setTimeout(() => {
                      setSelectedWorkspace(workspace);
                    }, 0);
                  }}
                  loading={loadingWorkspaces}
                  keyboardFocusedIndex={keyboardFocusedIndex}
                  onKeyboardFocusChange={setKeyboardFocusedIndex}
                  workspaceProjects={workspaceProjectCounts}
                />
              </>
            )}
          </aside>
        </Rnd>

        <main className="main-content">
          {showSettings ? (
            <Settings onClose={() => setShowSettings(false)} />
          ) : selectedProject ? (
            <ProjectDetails
              project={selectedProject}
              workspace={activeTab === 'workspaces' ? selectedWorkspace : undefined}
              onProjectUpdate={(updated) => {
                setSelectedProject(updated);
                loadProjects();
              }}
              onRemoveProject={handleRemoveProject}
              onOpenTerminal={handleOpenTerminal}
              onNavigateBack={activeTab === 'workspaces' && selectedWorkspace ? () => {
                setSelectedProject(null);
              } : undefined}
            />
          ) : activeTab === 'workspaces' && selectedWorkspace ? (
            <WorkspaceDetails
              workspace={selectedWorkspace}
              onWorkspaceUpdate={(updated) => {
                setSelectedWorkspace(updated);
                loadWorkspaces();
              }}
              onRemoveWorkspace={async (id) => {
                  try {
                    // Try to find API port
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
                    if (apiBaseUrl) {
                      await fetch(`${apiBaseUrl}/workspaces/${id}`, { method: 'DELETE' });
                    }
                    if (selectedWorkspace?.id === id) {
                      setSelectedWorkspace(null);
                    }
                    await loadWorkspaces();
                  } catch (error) {
                    console.error('Error removing workspace:', error);
                    alert('Failed to remove workspace');
                  }
                }}
                onOpenWorkspace={async (workspace) => {
                  try {
                    await window.electronAPI.openWorkspace(workspace.id);
                  } catch (error) {
                    console.error('Error opening workspace:', error);
                    alert(`Failed to open workspace: ${error instanceof Error ? error.message : 'Unknown error'}`);
                  }
                }}
                onSelectProject={(project) => {
                  setSelectedProject(project);
                }}
              />
            ) : (
              <div className="empty-state">
                <h2>Select {activeTab === 'projects' ? 'a project' : 'a workspace'} to view details</h2>
                <p>Choose {activeTab === 'projects' ? 'a project' : 'a workspace'} from the sidebar to see its information.</p>
                {activeTab === 'projects' && (
                  <p style={{ fontSize: '12px', marginTop: '1rem', opacity: 0.7 }}>
                    💡 Tip: You can also drag and drop folders here to add projects
                  </p>
                )}
              </div>
            )
          }
        </main>

        {terminalProcess && (
          <div 
            style={{ 
              width: `${terminalWidth}px`, 
              minWidth: '350px',
              maxWidth: '800px',
              height: '100%',
              position: 'relative',
              flexShrink: 0,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                position: 'absolute',
                left: '-2px',
                top: 0,
                bottom: 0,
                width: '4px',
                cursor: 'col-resize',
                zIndex: 10,
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                const startX = e.clientX;
                const startWidth = terminalWidth;

                const handleMouseMove = (e: MouseEvent) => {
                  const delta = startX - e.clientX;
                  const newWidth = Math.max(350, Math.min(800, startWidth + delta));
                  setTerminalWidth(newWidth);
                };

                const handleMouseUp = () => {
                  document.removeEventListener('mousemove', handleMouseMove);
                  document.removeEventListener('mouseup', handleMouseUp);
                };

                document.addEventListener('mousemove', handleMouseMove);
                document.addEventListener('mouseup', handleMouseUp);
              }}
            />
            <Terminal
              pid={terminalProcess.pid}
              scriptName={terminalProcess.scriptName}
              projectName={terminalProcess.projectName}
              onClose={handleCloseTerminal}
            />
          </div>
        )}
      </div>

      {showAddModal && (
        <AddProjectModal
          onAdd={handleAddProject}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {showAddWorkspaceModal && (
        <AddWorkspaceModal
          onAdd={async (workspace) => {
            await loadWorkspaces();
            setShowAddWorkspaceModal(false);
            setSelectedWorkspace(workspace);
          }}
          onClose={() => setShowAddWorkspaceModal(false)}
          existingProjects={projects}
        />
      )}

      <StatusBar />
    </div>
  );
}

export default App;

