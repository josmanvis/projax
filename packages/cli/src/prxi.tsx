import React, { useState, useEffect } from 'react';
import { render, Box, Text, useInput, useApp, useFocus, useFocusManager } from 'ink';

// Handle EPIPE errors gracefully to prevent crashes when output streams close
process.stdout.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EPIPE') {
    // Output stream closed, exit gracefully
    process.exit(0);
  }
});
process.stderr.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EPIPE') {
    process.exit(0);
  }
});

import {
  getDatabaseManager,
  getAllProjects,
  scanProject,
  addProject,
  removeProject,
  getCurrentBranch,
  Project,
  Agent,
  AgentCliType,
  RunningAgent,
} from './core-bridge';
import { getProjectScripts, getRunningProcessesClean, runScript, runScriptInBackground, stopScript } from './script-runner';
import {
  getAgentsByProject,
  getRunningAgents,
  launchAgentInTerminal,
  createAgent,
  updateAgent,
  deleteAgent,
  CLI_DISPLAY_NAMES,
  VALID_CLI_TYPES,
} from './agent-runner';
import { spawn } from 'child_process';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';

// Color scheme matching desktop app
const colors = {
  bgPrimary: '#0d1117',
  bgSecondary: '#161b22',
  bgTertiary: '#1c2128',
  bgHover: '#21262d',
  borderColor: '#30363d',
  textPrimary: '#c9d1d9',
  textSecondary: '#8b949e',
  textTertiary: '#6e7681',
  accentCyan: '#39c5cf',
  accentBlue: '#58a6ff',
  accentGreen: '#3fb950',
  accentPurple: '#bc8cff',
  accentOrange: '#ffa657',
};

// Helper function to get display path
function getDisplayPath(fullPath: string): string {
  const parts = fullPath.split('/').filter(Boolean);
  if (parts.length === 0) return fullPath;
  
  const lastDir = parts[parts.length - 1];
  
  // If last directory is "src", go one up
  if (lastDir === 'src' && parts.length > 1) {
    return parts[parts.length - 2];
  }
  
  return lastDir;
}

// Helper function to truncate text
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

// Type definitions for views and filters
type ViewType = 'projects' | 'workspaces' | 'processes' | 'settings' | 'agents';
type FilterType = 'all' | 'name' | 'path' | 'ports' | 'tags' | 'running';
type SortType = 'name-asc' | 'name-desc' | 'recent' | 'oldest' | 'running';

const FILTER_TYPES: FilterType[] = ['all', 'name', 'path', 'ports', 'tags', 'running'];
const SORT_TYPES: SortType[] = ['name-asc', 'name-desc', 'recent', 'oldest', 'running'];

const FILTER_LABELS: Record<FilterType, string> = {
  'all': 'All',
  'name': 'Name',
  'path': 'Path',
  'ports': 'Ports',
  'tags': 'Tags',
  'running': 'Running',
};

const SORT_LABELS: Record<SortType, string> = {
  'name-asc': 'Name A-Z',
  'name-desc': 'Name Z-A',
  'recent': 'Recently Scanned',
  'oldest': 'Oldest First',
  'running': 'Running First',
};

// Workspace type
interface Workspace {
  id: number;
  name: string;
  description?: string;
  workspace_file_path: string;
  created_at: number;
}

// Settings type
interface AppSettings {
  editor: {
    type: 'vscode' | 'cursor' | 'windsurf' | 'zed' | 'custom';
    customPath?: string;
  };
  browser: {
    type: 'chrome' | 'firefox' | 'safari' | 'edge' | 'custom';
    customPath?: string;
  };
}

interface HelpModalProps {
  onClose: () => void;
}

const HelpModal: React.FC<HelpModalProps> = ({ onClose }) => {
  useInput((input: string, key: any) => {
    if (input === 'q' || key.escape || key.return) {
      onClose();
    }
  });

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor={colors.accentCyan}
      padding={1}
      width={75}
    >
      <Text bold color={colors.accentCyan}>
        PROJAX Terminal UI - Help
      </Text>
      <Text> </Text>
      <Text color={colors.accentCyan}>View Navigation:</Text>
      <Text>  1          Projects view</Text>
      <Text>  2          Workspaces view</Text>
      <Text>  3          Global processes view</Text>
      <Text>  4          Settings</Text>
      <Text>  T          Toggle terminal output panel</Text>
      <Text> </Text>
      <Text color={colors.accentCyan}>Projects View - Navigation:</Text>
      <Text>  ↑/k        Move up in list</Text>
      <Text>  ↓/j        Move down in list</Text>
      <Text>  Tab/←→     Switch between list and details</Text>
      <Text>  /          Search projects (fuzzy search)</Text>
      <Text>  F          Cycle filter type (all/name/path/ports/tags/running)</Text>
      <Text>  S          Cycle sort order (name/recent/oldest/running)</Text>
      <Text>  g          Refresh git branches</Text>
      <Text>  R          Full refresh (projects + branches + processes)</Text>
      <Text> </Text>
      <Text color={colors.accentCyan}>Projects View - Actions:</Text>
      <Text>  a          Add new project</Text>
      <Text>  e          Edit project name</Text>
      <Text>  t          Add/edit tags</Text>
      <Text>  o          Open project in editor</Text>
      <Text>  f          Open project directory</Text>
      <Text>  u          Show detected URLs</Text>
      <Text>  s          Scan project for tests</Text>
      <Text>  p          Scan ports for project</Text>
      <Text>  Enter      Run selected script (in details panel)</Text>
      <Text>  r          Run scripts (select from list)</Text>
      <Text>  x          Stop all scripts for project</Text>
      <Text>  d          Delete project (with confirmation)</Text>
      <Text> </Text>
      <Text color={colors.accentCyan}>General:</Text>
      <Text>  q/Esc      Quit (or close modal)</Text>
      <Text>  ?          Show this help</Text>
      <Text> </Text>
      <Text color={colors.textSecondary}>Press any key to close...</Text>
    </Box>
  );
};

interface LoadingModalProps {
  message: string;
}

const LoadingModal: React.FC<LoadingModalProps> = ({ message }) => {
  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor={colors.accentCyan}
      padding={1}
      width={40}
    >
      <Text>{message}</Text>
      <Text color={colors.textSecondary}>Please wait...</Text>
    </Box>
  );
};

// Confirmation Modal
interface ConfirmModalProps {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({ title, message, onConfirm, onCancel }) => {
  const [selected, setSelected] = useState<'yes' | 'no'>('no');

  useInput((input: string, key: any) => {
    if (key.escape || input === 'n') {
      onCancel();
      return;
    }
    if (key.return) {
      if (selected === 'yes') {
        onConfirm();
      } else {
        onCancel();
      }
      return;
    }
    if (input === 'y') {
      onConfirm();
      return;
    }
    if (key.leftArrow || key.rightArrow || input === 'h' || input === 'l') {
      setSelected(prev => prev === 'yes' ? 'no' : 'yes');
    }
  });

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor={colors.accentOrange}
      padding={1}
      width={60}
    >
      <Text bold color={colors.accentOrange}>{title}</Text>
      <Text> </Text>
      <Text>{message}</Text>
      <Text> </Text>
      <Box>
        <Text color={selected === 'yes' ? colors.accentCyan : colors.textSecondary}>
          {selected === 'yes' ? '▶ ' : '  '}Yes
        </Text>
        <Text>  </Text>
        <Text color={selected === 'no' ? colors.accentCyan : colors.textSecondary}>
          {selected === 'no' ? '▶ ' : '  '}No
        </Text>
      </Box>
      <Text> </Text>
      <Text color={colors.textTertiary}>y/n or ←→ to select, Enter to confirm</Text>
    </Box>
  );
};

// Add Project Modal
interface AddProjectModalProps {
  onAdd: (projectPath: string, projectName?: string) => void;
  onCancel: () => void;
}

const AddProjectModal: React.FC<AddProjectModalProps> = ({ onAdd, onCancel }) => {
  const [step, setStep] = useState<'path' | 'name'>('path');
  const [pathInput, setPathInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  useInput((input: string, key: any) => {
    if (key.escape) {
      onCancel();
      return;
    }

    if (step === 'path') {
      if (key.return) {
        // Validate path
        const resolvedPath = pathInput.startsWith('~')
          ? path.join(os.homedir(), pathInput.slice(1))
          : path.resolve(pathInput);

        if (!fs.existsSync(resolvedPath)) {
          setError('Path does not exist');
          return;
        }

        if (!fs.statSync(resolvedPath).isDirectory()) {
          setError('Path is not a directory');
          return;
        }

        // Check if project already exists
        const db = getDatabaseManager();
        const existing = db.getProjectByPath(resolvedPath);
        if (existing) {
          setError(`Project already exists: ${existing.name}`);
          return;
        }

        setError(null);
        setNameInput(path.basename(resolvedPath));
        setStep('name');
        return;
      }

      if (key.backspace || key.delete) {
        setPathInput(prev => prev.slice(0, -1));
        setError(null);
        return;
      }

      if (key.tab) {
        // Tab completion - get directories in current path
        try {
          const currentPath = pathInput.startsWith('~')
            ? path.join(os.homedir(), pathInput.slice(1))
            : pathInput || '.';
          const dir = path.dirname(currentPath);
          const base = path.basename(currentPath);

          if (fs.existsSync(dir)) {
            const entries = fs.readdirSync(dir, { withFileTypes: true })
              .filter(e => e.isDirectory() && e.name.startsWith(base) && !e.name.startsWith('.'))
              .map(e => e.name);

            if (entries.length === 1) {
              const completed = path.join(dir, entries[0]) + '/';
              setPathInput(completed.replace(os.homedir(), '~'));
            }
          }
        } catch {
          // Ignore tab completion errors
        }
        return;
      }

      if (input && input.length === 1 && !key.ctrl && !key.meta) {
        setPathInput(prev => prev + input);
        setError(null);
      }
    } else if (step === 'name') {
      if (key.return) {
        const resolvedPath = pathInput.startsWith('~')
          ? path.join(os.homedir(), pathInput.slice(1))
          : path.resolve(pathInput);
        onAdd(resolvedPath, nameInput.trim() || undefined);
        return;
      }

      if (key.backspace || key.delete) {
        setNameInput(prev => prev.slice(0, -1));
        return;
      }

      if (input && input.length === 1 && !key.ctrl && !key.meta) {
        setNameInput(prev => prev + input);
      }
    }
  });

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor={colors.accentCyan}
      padding={1}
      width={70}
    >
      <Text bold color={colors.accentCyan}>Add Project</Text>
      <Text> </Text>

      {step === 'path' && (
        <>
          <Text>Enter project path:</Text>
          <Box>
            <Text color={colors.accentGreen}>&gt; </Text>
            <Text>{pathInput}</Text>
            <Text color={colors.textTertiary}>_</Text>
          </Box>
          {error && (
            <Text color="#f85149">{error}</Text>
          )}
          <Text> </Text>
          <Text color={colors.textSecondary}>Tab: autocomplete | Enter: next | Esc: cancel</Text>
        </>
      )}

      {step === 'name' && (
        <>
          <Text color={colors.textSecondary}>Path: {pathInput}</Text>
          <Text> </Text>
          <Text>Enter project name:</Text>
          <Box>
            <Text color={colors.accentGreen}>&gt; </Text>
            <Text>{nameInput}</Text>
            <Text color={colors.textTertiary}>_</Text>
          </Box>
          <Text> </Text>
          <Text color={colors.textSecondary}>Enter: add project | Esc: cancel</Text>
        </>
      )}
    </Box>
  );
};

interface ErrorModalProps {
  message: string;
  onClose: () => void;
}

const ErrorModal: React.FC<ErrorModalProps> = ({ message, onClose }) => {
  useInput((input: string, key: any) => {
    if (key.escape || key.return) {
      onClose();
    }
  });

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor="#f85149"
      padding={1}
      width={60}
    >
      <Text color="#f85149" bold>
        Error
      </Text>
      <Text> </Text>
      <Text>{message}</Text>
      <Text> </Text>
      <Text color={colors.textSecondary}>Press any key to close...</Text>
    </Box>
  );
};

interface ScriptSelectionModalProps {
  scripts: Map<string, any>;
  projectName: string;
  projectPath: string;
  onSelect: (scriptName: string, background: boolean) => void;
  onClose: () => void;
}

const ScriptSelectionModal: React.FC<ScriptSelectionModalProps> = ({ 
  scripts, 
  projectName, 
  projectPath, 
  onSelect, 
  onClose 
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const scriptArray = Array.from(scripts.entries());

  useInput((input: string, key: any) => {
    if (key.escape || input === 'q') {
      onClose();
      return;
    }

    if (key.upArrow || input === 'k') {
      setSelectedIndex((prev) => Math.max(0, prev - 1));
      return;
    }

    if (key.downArrow || input === 'j') {
      setSelectedIndex((prev) => Math.min(scriptArray.length - 1, prev + 1));
      return;
    }

    if (key.return) {
      const [scriptName] = scriptArray[selectedIndex];
      onSelect(scriptName, true);
      return;
    }

    if (input === 'f') {
      const [scriptName] = scriptArray[selectedIndex];
      onSelect(scriptName, false);
      return;
    }
  });

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor={colors.accentCyan}
      padding={1}
      width={80}
    >
      <Text bold color={colors.accentCyan}>
        Run Script - {projectName}
      </Text>
      <Text> </Text>
      {scriptArray.map(([name, script], index) => {
        const isSelected = index === selectedIndex;
        return (
          <Text key={name} color={isSelected ? colors.accentCyan : colors.textPrimary} bold={isSelected}>
            {isSelected ? '▶ ' : '  '}
            <Text color={colors.accentGreen}>{name}</Text>
            {' - '}
            <Text color={colors.textSecondary}>{truncateText(script.command, 50)}</Text>
          </Text>
        );
      })}
      <Text> </Text>
      <Text color={colors.textSecondary}>↑↓/kj: Navigate | Enter: Run (bg) | f: Foreground | Esc/q: Cancel</Text>
    </Box>
  );
};

interface ProjectListProps {
  projects: Project[];
  selectedIndex: number;
  runningProcesses: any[];
  isFocused: boolean;
  height: number;
  scrollOffset: number;
  gitBranches: Map<number, string | null>;
  filterType: FilterType;
  sortType: SortType;
}

const ProjectListComponent: React.FC<ProjectListProps> = ({
  projects,
  selectedIndex,
  runningProcesses,
  isFocused,
  height,
  scrollOffset,
  gitBranches,
  filterType,
  sortType,
}) => {
  const { focus } = useFocus({ id: 'projectList' });
  
  // Calculate visible range
  const startIndex = Math.max(0, scrollOffset);
  const hasMoreAbove = startIndex > 0;
  const headerHeight = 1; // "Projects (12)" line
  const paddingHeight = 2; // top + bottom padding
  const scrollIndicatorHeight = (hasMoreAbove ? 1 : 0) + 1; // "more above" + "more below" (always reserve space)
  const visibleHeight = Math.max(5, height - paddingHeight - headerHeight - scrollIndicatorHeight);
  const endIndex = Math.min(projects.length, startIndex + visibleHeight);
  const visibleProjects = projects.slice(startIndex, endIndex);
  const hasMoreBelow = endIndex < projects.length;
  
  return (
    <Box
      flexDirection="column"
      width="35%"
      height={height}
      borderStyle="round"
      borderColor={isFocused ? colors.accentCyan : colors.borderColor}
      padding={1}
      flexShrink={0}
      flexGrow={0}
    >
      <Box flexDirection="column">
        <Text bold color={colors.textPrimary}>
          Projects ({projects.length})
        </Text>
        <Text color={colors.textTertiary}>
          <Text color={colors.accentPurple}>{FILTER_LABELS[filterType]}</Text>
          {' | '}
          <Text color={colors.accentOrange}>{SORT_LABELS[sortType]}</Text>
        </Text>
      </Box>
      <Box flexDirection="column" flexGrow={1}>
        {projects.length === 0 ? (
          <Text color={colors.textTertiary}>No projects found</Text>
        ) : (
          <>
            {hasMoreAbove && (
              <Text color={colors.textTertiary}>↑ {startIndex} more above</Text>
            )}
            {visibleProjects.map((project, localIndex) => {
              const index = startIndex + localIndex;
              const isSelected = index === selectedIndex;

              // Check if this project has running scripts
              const projectRunning = runningProcesses.filter(
                (p: any) => p.projectPath === project.path
              );
              const hasRunningScripts = projectRunning.length > 0;

              // Get git branch
              const branch = gitBranches.get(project.id);
              const isMainBranch = branch === 'main' || branch === 'master';

              return (
                <Box key={project.id} flexDirection="column">
                  <Text color={isSelected ? colors.accentCyan : colors.textPrimary} bold={isSelected}>
                    {isSelected ? '▶ ' : '  '}
                    {hasRunningScripts && <Text color={colors.accentGreen}>● </Text>}
                    {truncateText(project.name, 22)}
                    {hasRunningScripts && <Text color={colors.accentGreen}> ({projectRunning.length})</Text>}
                  </Text>
                  {branch && (
                    <Text color={colors.textTertiary}>
                      {'    '}
                      <Text color={isMainBranch ? colors.accentGreen : colors.accentBlue}>
                        {truncateText(branch, 18)}
                      </Text>
                    </Text>
                  )}
                </Box>
              );
            })}
            {hasMoreBelow && (
              <Text color={colors.textTertiary}>↓ {projects.length - endIndex} more below</Text>
            )}
          </>
        )}
      </Box>
    </Box>
  );
};

interface ProjectDetailsProps {
  project: Project | null;
  runningProcesses: any[];
  isFocused: boolean;
  editingName: boolean;
  editingDescription: boolean;
  editingTags: boolean;
  editInput: string;
  allTags: string[];
  onTagRemove?: (tag: string) => void;
  height: number;
  scrollOffset: number;
  gitBranch: string | null;
  selectedScriptIndex: number;
}

const ProjectDetailsComponent: React.FC<ProjectDetailsProps> = ({
  project,
  runningProcesses,
  isFocused,
  editingName,
  editingDescription,
  editingTags,
  editInput,
  allTags,
  onTagRemove,
  height,
  scrollOffset,
  gitBranch,
  selectedScriptIndex,
}) => {
  const { focus } = useFocus({ id: 'projectDetails' });
  const [scripts, setScripts] = useState<any>(null);
  const [ports, setPorts] = useState<any[]>([]);
  const [npmPackage, setNpmPackage] = useState<string | null>(null);

  useEffect(() => {
    if (!project) {
      setScripts(null);
      setPorts([]);
      setNpmPackage(null);
      return;
    }

    // Load scripts
    try {
      const projectScripts = getProjectScripts(project.path);
      setScripts(projectScripts);
    } catch (error) {
      setScripts(null);
    }

    // Load ports
    try {
      const db = getDatabaseManager();
      const projectPorts = db.getProjectPorts(project.id);
      setPorts(projectPorts);
    } catch (error) {
      setPorts([]);
    }

    // Check if npm package (live registry check)
    setNpmPackage(null);
    try {
      const packageJsonPath = path.join(project.path, 'package.json');
      if (fs.existsSync(packageJsonPath)) {
        const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
        if (pkg.name && !pkg.private) {
          fetch(`https://registry.npmjs.org/${encodeURIComponent(pkg.name)}`, {
            method: 'HEAD',
            signal: AbortSignal.timeout(2000),
          })
            .then(res => {
              if (res.ok) setNpmPackage(pkg.name);
            })
            .catch(() => {});
        }
      }
    } catch {}
  }, [project]);

  if (!project) {
    return (
      <Box 
        flexDirection="column" 
        flexGrow={1} 
        borderStyle="round" 
        borderColor={isFocused ? colors.accentCyan : colors.borderColor} 
        padding={1}
      >
        <Text color={colors.textSecondary}>Select a project to view details</Text>
      </Box>
    );
  }

  const lastScanned = project.last_scanned
    ? new Date(project.last_scanned * 1000).toLocaleString()
    : 'Never';

  // Get running processes for this project
  const projectProcesses = runningProcesses.filter((p: any) => p.projectPath === project.path);

  // Build content lines for virtual scrolling
  const contentLines: React.ReactNode[] = [];
  
  // Header section (always visible at top)
  contentLines.push(
    editingName ? (
      <Box key="edit-name">
        <Text color={colors.accentCyan}>Editing name: </Text>
        <Text color={colors.textPrimary}>{editInput}</Text>
        <Text color={colors.textSecondary}> (Press Enter to save, Esc to cancel)</Text>
      </Box>
    ) : (
      <Text key="name" bold color={colors.textPrimary}>
        {project.name}
      </Text>
    )
  );
  
  if (editingDescription) {
    contentLines.push(
      <Box key="edit-desc">
        <Text color={colors.accentCyan}>Editing description: </Text>
        <Text color={colors.textPrimary}>{editInput}</Text>
        <Text color={colors.textSecondary}> (Press Enter to save, Esc to cancel)</Text>
      </Box>
    );
  } else if (project.description) {
    contentLines.push(
      <Text key="desc" color={colors.textSecondary}>{truncateText(project.description, 100)}</Text>
    );
  }
  
  contentLines.push(
    <Text key="path" color={colors.textTertiary}>{truncateText(project.path, 100)}</Text>
  );
  
  // Tags (simplified to single line)
  if (project.tags && project.tags.length > 0) {
    const tagsText = project.tags.join(', ');
    contentLines.push(
      <Text key="tags">
        <Text color={colors.textSecondary}>Tags: </Text>
        <Text color={colors.accentPurple}>{truncateText(tagsText, 80)}</Text>
      </Text>
    );
  }
  
  if (editingTags) {
    contentLines.push(
      <Text key="edit-tags">
        <Text color={colors.accentCyan}>Add tag: </Text>
        <Text color={colors.textPrimary}>{editInput}</Text>
      </Text>
    );
    const suggestions = allTags.filter(t => t.toLowerCase().includes(editInput.toLowerCase()) && !project.tags?.includes(t)).slice(0, 3);
    if (editInput && suggestions.length > 0) {
      contentLines.push(
        <Text key="suggestions">
          <Text color={colors.textTertiary}>Suggestions: </Text>
          <Text color={colors.accentPurple}>{suggestions.join(', ')}</Text>
        </Text>
      );
    }
  }
  
  contentLines.push(<Text key="spacer1"> </Text>);
  
  // Stats
  contentLines.push(
    <Box key="stats">
        <Text>Ports: <Text color={colors.accentCyan}>{ports.length}</Text></Text>
        <Text> | </Text>
        <Text>Scripts: <Text color={colors.accentCyan}>{scripts?.scripts?.size || 0}</Text></Text>
        {npmPackage && (
          <>
            <Text> | </Text>
            <Text>NPM: <Text color="#f85149">{npmPackage}</Text></Text>
          </>
        )}
      </Box>
  );
  
  contentLines.push(<Text key="spacer2"> </Text>);
  
  // Git branch
  if (gitBranch) {
    const isMainBranch = gitBranch === 'main' || gitBranch === 'master';
    contentLines.push(
      <Text key="git-branch">
        Branch: <Text color={isMainBranch ? colors.accentGreen : colors.accentBlue}>{gitBranch}</Text>
      </Text>
    );
  }

  if (project.framework) {
    contentLines.push(
      <Text key="framework">
        Framework: <Text color={colors.accentCyan}>{project.framework}</Text>
      </Text>
    );
  }

  contentLines.push(
    <Text key="last-scanned">Last Scanned: {lastScanned}</Text>
  );
  contentLines.push(<Text key="spacer3"> </Text>);

  // Running Processes
  if (projectProcesses.length > 0) {
    contentLines.push(
      <Text key="proc-header" bold color={colors.accentGreen}>
            Running Processes ({projectProcesses.length}):
          </Text>
    );
    projectProcesses.forEach((process: any) => {
            const uptime = Math.floor((Date.now() - process.startedAt) / 1000);
            const minutes = Math.floor(uptime / 60);
            const seconds = uptime % 60;
            const uptimeStr = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
            
      contentLines.push(
        <Text key={`proc-${process.pid}`}>
                {'  '}
                <Text color={colors.accentGreen}>●</Text>
                {' '}
                <Text color={colors.textPrimary}>{process.scriptName}</Text>
                <Text color={colors.textSecondary}> (PID: {process.pid}, {uptimeStr})</Text>
              </Text>
            );
    });
    contentLines.push(<Text key="spacer4"> </Text>);
  }

  // Scripts - show all, let virtual scrolling handle visibility
  if (scripts && scripts.scripts && scripts.scripts.size > 0) {
    contentLines.push(
      <Text key="scripts-header" bold>
            Available Scripts (<Text color={colors.accentCyan}>{scripts.scripts.size}</Text>):
          </Text>
    );
    Array.from(scripts.scripts.entries() as IterableIterator<[string, any]>).forEach(([name, script], idx) => {
      const isScriptSelected = isFocused && idx === selectedScriptIndex;
      contentLines.push(
        <Text key={`script-${name}`} bold={isScriptSelected}>
              {isScriptSelected ? '▶ ' : '  '}
              <Text color={isScriptSelected ? colors.accentCyan : colors.accentGreen}>{name}</Text>
              {' - '}
          <Text color={colors.textSecondary}>{truncateText(script.command, 60)}</Text>
            </Text>
      );
    });
    contentLines.push(<Text key="spacer5"> </Text>);
  }

  // Ports - show all, let virtual scrolling handle visibility
  if (ports.length > 0) {
    contentLines.push(
      <Text key="ports-header" bold>
            Detected Ports (<Text color={colors.accentCyan}>{ports.length}</Text>):
          </Text>
    );
    ports.forEach((port: any) => {
      contentLines.push(
        <Text key={`port-${port.id}`}>
              {'  '}Port <Text color={colors.accentCyan}>{port.port}</Text>
          <Text color={colors.textSecondary}> - {truncateText(port.config_source, 50)}</Text>
            </Text>
      );
    });
    contentLines.push(<Text key="spacer6"> </Text>);
  }

  // Calculate visible range for virtual scrolling
  // Render enough items to fill the available space
  const startIndex = Math.max(0, scrollOffset);
  const hasMoreAbove = startIndex > 0;
  const paddingHeight = 2; // top + bottom padding
  // Reserve space for scroll indicators
  const reservedForIndicators = (hasMoreAbove ? 1 : 0) + 1;
  // Available space for content - be less conservative now that we have truncation
  const availableContentHeight = height - paddingHeight - reservedForIndicators;
  const visibleHeight = Math.max(5, availableContentHeight); // Render enough to fill space
  const endIndex = Math.min(contentLines.length, startIndex + visibleHeight);
  const visibleContent = contentLines.slice(startIndex, endIndex);
  const hasMoreBelow = endIndex < contentLines.length;

  return (
    <Box
      flexDirection="column"
      width="65%"
      height={height}
      borderStyle="round"
      borderColor={isFocused ? colors.accentCyan : colors.borderColor}
      padding={1}
      flexShrink={0}
      flexGrow={0}
    >
      <Box flexDirection="column" flexGrow={1}>
        {hasMoreAbove && (
          <Text color={colors.textTertiary}>↑ {startIndex} more above</Text>
        )}
        {visibleContent}
        {hasMoreBelow && (
          <Text color={colors.textTertiary}>↓ {contentLines.length - endIndex} more below</Text>
        )}
      </Box>
    </Box>
  );
};

// Terminal Output Panel for showing live logs
interface TerminalOutputPanelProps {
  processes: any[];
  selectedPid: number | null;
  height: number;
  onSelectProcess: (pid: number) => void;
}

const TerminalOutputPanel: React.FC<TerminalOutputPanelProps> = ({
  processes,
  selectedPid,
  height,
  onSelectProcess,
}) => {
  const [logs, setLogs] = useState<string[]>([]);
  const [scrollOffset, setScrollOffset] = useState(0);

  // Find the selected process or default to first
  const activeProcess = selectedPid
    ? processes.find((p: any) => p.pid === selectedPid)
    : processes[0];

  useEffect(() => {
    if (!activeProcess?.logFile) {
      setLogs(['No active process selected']);
      return;
    }

    // Read initial logs
    try {
      if (fs.existsSync(activeProcess.logFile)) {
        const content = fs.readFileSync(activeProcess.logFile, 'utf-8');
        const lines = content.split('\n').slice(-50); // Last 50 lines
        setLogs(lines);
        setScrollOffset(Math.max(0, lines.length - 10));
      } else {
        setLogs(['Log file not found']);
      }
    } catch {
      setLogs(['Error reading logs']);
    }

    // Watch for changes
    let watcher: fs.FSWatcher | null = null;
    try {
      watcher = fs.watch(activeProcess.logFile, () => {
        try {
          const content = fs.readFileSync(activeProcess.logFile, 'utf-8');
          const lines = content.split('\n').slice(-100);
          setLogs(lines);
          // Auto-scroll to bottom
          setScrollOffset(Math.max(0, lines.length - 10));
        } catch {
          // Ignore read errors during watch
        }
      });
    } catch {
      // Ignore watch errors
    }

    return () => {
      if (watcher) {
        watcher.close();
      }
    };
  }, [activeProcess?.logFile, activeProcess?.pid]);

  const visibleLines = logs.slice(scrollOffset, scrollOffset + height - 4);
  const hasMoreAbove = scrollOffset > 0;
  const hasMoreBelow = scrollOffset + height - 4 < logs.length;

  return (
    <Box
      flexDirection="column"
      width="30%"
      height={height}
      borderStyle="round"
      borderColor={colors.accentGreen}
      padding={1}
      flexShrink={0}
    >
      <Box flexDirection="row" justifyContent="space-between">
        <Text bold color={colors.accentGreen}>Terminal Output</Text>
        {processes.length > 1 && (
          <Text color={colors.textTertiary}>
            [{processes.findIndex((p: any) => p.pid === activeProcess?.pid) + 1}/{processes.length}]
          </Text>
        )}
      </Box>
      {activeProcess && (
        <Text color={colors.textSecondary}>
          {truncateText(activeProcess.scriptName, 20)} (PID: {activeProcess.pid})
        </Text>
      )}
      <Box flexDirection="column" flexGrow={1} marginTop={1}>
        {hasMoreAbove && (
          <Text color={colors.textTertiary}>↑ more above</Text>
        )}
        {visibleLines.map((line, idx) => (
          <Text key={idx} color={colors.textPrimary}>
            {truncateText(line, 40)}
          </Text>
        ))}
        {hasMoreBelow && (
          <Text color={colors.textTertiary}>↓ more below</Text>
        )}
      </Box>
    </Box>
  );
};

interface StatusBarProps {
  focusedPanel: 'list' | 'details';
  selectedProject: Project | null;
}

const StatusBar: React.FC<StatusBarProps> = ({ focusedPanel, selectedProject }) => {
  if (focusedPanel === 'list') {
    return (
      <Box flexDirection="column">
        <Box>
          <Text color={colors.accentGreen}>● API</Text>
          <Text color={colors.textSecondary}> | </Text>
          <Text color={colors.textSecondary}>Focus: </Text>
          <Text color={colors.accentCyan}>List</Text>
        </Box>
        <Box>
          <Text bold>a</Text>
          <Text color={colors.textSecondary}> Add | </Text>
          <Text bold>/</Text>
          <Text color={colors.textSecondary}> Search | </Text>
          <Text bold>F</Text>
          <Text color={colors.textSecondary}> Filter | </Text>
          <Text bold>S</Text>
          <Text color={colors.textSecondary}> Sort | </Text>
          <Text bold>↑↓</Text>
          <Text color={colors.textSecondary}> Nav | </Text>
          <Text bold>Tab</Text>
          <Text color={colors.textSecondary}> Switch | </Text>
          <Text bold>T</Text>
          <Text color={colors.textSecondary}> Terminal | </Text>
          <Text bold>?</Text>
          <Text color={colors.textSecondary}> Help | </Text>
          <Text bold>q</Text>
          <Text color={colors.textSecondary}> Quit</Text>
        </Box>
      </Box>
    );
  }

  // Details panel - show project-specific actions
  return (
    <Box flexDirection="column">
      <Box>
        <Text color={colors.accentGreen}>● API</Text>
        <Text color={colors.textSecondary}> | </Text>
        <Text color={colors.textSecondary}>Focus: </Text>
        <Text color={colors.accentCyan}>Details</Text>
        {selectedProject && (
          <>
            <Text color={colors.textSecondary}> | </Text>
            <Text color={colors.textPrimary}>{truncateText(selectedProject.name, 20)}</Text>
          </>
        )}
      </Box>
      <Box>
        <Text bold>e</Text>
        <Text color={colors.textSecondary}> Edit | </Text>
        <Text bold>t</Text>
        <Text color={colors.textSecondary}> Tags | </Text>
        <Text bold>o</Text>
        <Text color={colors.textSecondary}> Editor | </Text>
        <Text bold>r</Text>
        <Text color={colors.textSecondary}> Run | </Text>
        <Text bold>s</Text>
        <Text color={colors.textSecondary}> Scan | </Text>
        <Text bold>x</Text>
        <Text color={colors.textSecondary}> Stop | </Text>
        <Text bold>d</Text>
        <Text color={colors.textSecondary}> Delete | </Text>
        <Text bold>Tab</Text>
        <Text color={colors.textSecondary}> Switch | </Text>
        <Text bold>?</Text>
        <Text color={colors.textSecondary}> Help</Text>
      </Box>
    </Box>
  );
};

// Simple fuzzy search function
function fuzzyMatch(query: string, text: string): boolean {
  const queryLower = query.toLowerCase();
  const textLower = text.toLowerCase();
  
  if (queryLower === '') return true;
  
  let queryIndex = 0;
  for (let i = 0; i < textLower.length && queryIndex < queryLower.length; i++) {
    if (textLower[i] === queryLower[queryIndex]) {
      queryIndex++;
    }
  }
  
  return queryIndex === queryLower.length;
}

const App: React.FC = () => {
  const { exit } = useApp();
  const { focusNext, focusPrevious } = useFocusManager();
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showHelp, setShowHelp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [runningProcesses, setRunningProcesses] = useState<any[]>([]);
  const [focusedPanel, setFocusedPanel] = useState<'list' | 'details'>('list');

  // View state
  const [currentView, setCurrentView] = useState<ViewType>('projects');

  // Git branches
  const [gitBranches, setGitBranches] = useState<Map<number, string | null>>(new Map());

  // Filter and sort state
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [sortType, setSortType] = useState<SortType>('name-asc');

  // Editing state
  const [editingName, setEditingName] = useState(false);
  const [editingDescription, setEditingDescription] = useState(false);
  const [editingTags, setEditingTags] = useState(false);
  const [editInput, setEditInput] = useState('');
  const [showUrls, setShowUrls] = useState(false);
  const [allTags, setAllTags] = useState<string[]>([]);

  // Modal state
  const [showAddProjectModal, setShowAddProjectModal] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  // Search state
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [listScrollOffset, setListScrollOffset] = useState(0);
  const [detailsScrollOffset, setDetailsScrollOffset] = useState(0);

  // Script selection state
  const [showScriptModal, setShowScriptModal] = useState(false);
  const [scriptModalData, setScriptModalData] = useState<{ scripts: Map<string, any>; projectName: string; projectPath: string } | null>(null);
  const [detailSelectedScript, setDetailSelectedScript] = useState(0);

  // Workspace state
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspaceIndex, setSelectedWorkspaceIndex] = useState(0);

  // Terminal panel state
  const [showTerminalPanel, setShowTerminalPanel] = useState(false);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const [selectedProcessPid, setSelectedProcessPid] = useState<number | null>(null);
  const [selectedProcessIndex, setSelectedProcessIndex] = useState(0);

  // Settings state
  const [settings, setSettings] = useState<AppSettings>({
    editor: { type: 'vscode' },
    browser: { type: 'chrome' },
  });
  const [settingsSection, setSettingsSection] = useState<'editor' | 'browser'>('editor');
  const [settingsOptionIndex, setSettingsOptionIndex] = useState(0);
  const settingsEditorOptions: Array<'vscode' | 'cursor' | 'windsurf' | 'zed' | 'custom'> = [
    'vscode', 'cursor', 'windsurf', 'zed', 'custom',
  ];
  const settingsBrowserOptions: Array<'chrome' | 'firefox' | 'safari' | 'edge' | 'custom'> = [
    'chrome', 'firefox', 'safari', 'edge', 'custom',
  ];

  // Agents state
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgentIndex, setSelectedAgentIndex] = useState(0);
  const [runningAgentsList, setRunningAgentsList] = useState<RunningAgent[]>([]);
  const [showAddAgentModal, setShowAddAgentModal] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [newAgentName, setNewAgentName] = useState('');
  const [newAgentCliType, setNewAgentCliType] = useState<AgentCliType>('claude');
  const [newAgentCliTypeIndex, setNewAgentCliTypeIndex] = useState(0);
  const [agentInputField, setAgentInputField] = useState<'name' | 'cli_type' | 'model' | 'api_key'>('name');
  const [newAgentModel, setNewAgentModel] = useState('');
  const [newAgentApiKey, setNewAgentApiKey] = useState('');

  // Get terminal dimensions
  const terminalHeight = process.stdout.rows || 24;
  const availableHeight = terminalHeight - 4; // Subtract status bar (increased for view indicator)

  useEffect(() => {
    loadProjects();
    loadRunningProcesses();
    loadAllTags();

    // Load settings
    try {
      const settingsPath = path.join(os.homedir(), '.projax', 'settings.json');
      if (fs.existsSync(settingsPath)) {
        const data = fs.readFileSync(settingsPath, 'utf-8');
        setSettings(JSON.parse(data));
      }
    } catch {
      // Use defaults
    }

    // Refresh running processes, git branches, and running agents every 5 seconds
    const interval = setInterval(() => {
      loadRunningProcesses();
      loadRunningAgentsList();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Load agents when switching to agents view or when selected project changes
  useEffect(() => {
    const currentProject = projects.length > 0 ? projects[selectedIndex] : null;
    if (currentView === 'agents' && currentProject) {
      loadAgentsForProject(currentProject.id);
    }
  }, [currentView, projects, selectedIndex]);

  // Load git branches when projects change
  useEffect(() => {
    if (allProjects.length > 0) {
      loadGitBranches();
    }
  }, [allProjects]);

  const loadGitBranches = async () => {
    const branches = new Map<number, string | null>();
    for (const project of allProjects) {
      try {
        const branch = getCurrentBranch(project.path);
        branches.set(project.id, branch);
      } catch {
        branches.set(project.id, null);
      }
    }
    setGitBranches(branches);
  };

  // Reset editing state and scroll when project changes
  useEffect(() => {
    setEditingName(false);
    setEditingDescription(false);
    setEditingTags(false);
    setEditInput('');
    setDetailsScrollOffset(0); // Reset scroll when switching projects
    setDetailSelectedScript(0); // Reset selected script
  }, [selectedIndex]);

  // Load workspaces when switching to workspaces view
  useEffect(() => {
    if (currentView === 'workspaces' && workspaces.length === 0) {
      loadWorkspacesFromApi();
    }
  }, [currentView]);

  // Update scroll offset when selected index changes
  useEffect(() => {
    const visibleHeight = Math.max(1, availableHeight - 3);
    setListScrollOffset(prevOffset => {
      if (selectedIndex < prevOffset) {
        return Math.max(0, selectedIndex);
      } else if (selectedIndex >= prevOffset + visibleHeight) {
        return Math.max(0, selectedIndex - visibleHeight + 1);
      }
      return prevOffset;
    });
  }, [selectedIndex, availableHeight]);

  const loadAllTags = () => {
    try {
      const db = getDatabaseManager();
    const allProjects = getAllProjects();
      const tagsSet = new Set<string>();
      allProjects.forEach((project: Project) => {
        if (project.tags && Array.isArray(project.tags)) {
          project.tags.forEach((tag: string) => tagsSet.add(tag));
        }
      });
      setAllTags(Array.from(tagsSet));
    } catch (error) {
      setAllTags([]);
    }
  };

  const loadAgentsForProject = (projectId: number) => {
    try {
      const projectAgents = getAgentsByProject(projectId);
      setAgents(projectAgents);
      if (selectedAgentIndex >= projectAgents.length) {
        setSelectedAgentIndex(Math.max(0, projectAgents.length - 1));
      }
    } catch (error) {
      setAgents([]);
    }
  };

  const loadRunningAgentsList = () => {
    try {
      const running = getRunningAgents();
      setRunningAgentsList(running);
    } catch (error) {
      setRunningAgentsList([]);
    }
  };

  const loadProjects = () => {
    const loadedProjects = getAllProjects();
    setAllProjects(loadedProjects);
    applyFilterAndSort(loadedProjects, searchQuery, filterType, sortType);
  };

  const applyFilterAndSort = (
    projectsToFilter: Project[],
    query: string,
    filter: FilterType,
    sort: SortType
  ) => {
    let filtered = projectsToFilter;

    // Apply search query with filter type
    if (query.trim()) {
      const q = query.toLowerCase();
      filtered = projectsToFilter.filter(project => {
        switch (filter) {
          case 'name':
            return fuzzyMatch(q, project.name);
          case 'path':
            return fuzzyMatch(q, project.path);
          case 'tags':
            return project.tags?.some((tag: string) => fuzzyMatch(q, tag)) || false;
          case 'ports': {
            // Check if project has ports matching the query
            const db = getDatabaseManager();
            const ports = db.getProjectPorts(project.id);
            return ports.some((p: any) => p.port.toString().includes(q));
          }
          case 'running': {
            const isRunning = runningProcesses.some((p: any) => p.projectPath === project.path);
            return (q === 'running' || q === 'yes' || q === 'true') ? isRunning : !isRunning;
          }
          case 'all':
          default:
            return (
              fuzzyMatch(q, project.name) ||
              (project.description ? fuzzyMatch(q, project.description) : false) ||
              fuzzyMatch(q, project.path) ||
              project.tags?.some((tag: string) => fuzzyMatch(q, tag)) ||
              false
            );
        }
      });
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      switch (sort) {
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'recent':
          return (b.last_scanned || 0) - (a.last_scanned || 0);
        case 'oldest':
          return (a.created_at || 0) - (b.created_at || 0);
        case 'running': {
          const aRunning = runningProcesses.filter((p: any) => p.projectPath === a.path).length;
          const bRunning = runningProcesses.filter((p: any) => p.projectPath === b.path).length;
          return bRunning - aRunning;
        }
        default:
          return 0;
      }
    });

    setProjects(sorted);

    // Adjust selected index if current selection is out of bounds
    if (selectedIndex >= sorted.length) {
      setSelectedIndex(Math.max(0, sorted.length - 1));
    }
  };

  // Re-apply filter/sort when dependencies change
  useEffect(() => {
    applyFilterAndSort(allProjects, searchQuery, filterType, sortType);
  }, [filterType, sortType, runningProcesses]);

  // Reset/clamp selectedProcessIndex when processes change
  useEffect(() => {
    if (runningProcesses.length === 0) {
      setSelectedProcessIndex(0);
    } else {
      setSelectedProcessIndex((prev) => Math.min(prev, runningProcesses.length - 1));
    }
  }, [runningProcesses.length]);

  const loadRunningProcesses = async () => {
    try {
      const processes = await getRunningProcessesClean();
      setRunningProcesses(processes);
    } catch (error) {
      setRunningProcesses([]);
    }
  };

  const selectedProject = projects.length > 0 ? projects[selectedIndex] : null;

  // Helper function to get editor command
  const getEditorCommand = (): { command: string; args: string[] } => {
    try {
      // Try to load settings from core
      const corePath = path.join(__dirname, '..', '..', 'core', 'dist', 'settings');
      const settingsPath = path.join(__dirname, '..', '..', '..', 'core', 'dist', 'settings');
      let settings: any;
      
      try {
        settings = require(corePath);
      } catch {
        try {
          settings = require(settingsPath);
        } catch {
          // Fallback to default
          return { command: 'code', args: [] };
        }
      }
      
      const editorSettings = settings.getEditorSettings();
      let command: string;
      const args: string[] = [];
      
      if (editorSettings.type === 'custom' && editorSettings.customPath) {
        command = editorSettings.customPath;
      } else {
        switch (editorSettings.type) {
          case 'vscode':
            command = 'code';
            break;
          case 'cursor':
            command = 'cursor';
            break;
          case 'windsurf':
            command = 'windsurf';
            break;
          case 'zed':
            command = 'zed';
            break;
          default:
            command = 'code';
        }
      }
      
      return { command, args };
    } catch (error) {
      return { command: 'code', args: [] };
    }
  };

  // Helper function to open project in editor
  const openInEditor = (projectPath: string) => {
    try {
      const { command, args } = getEditorCommand();
      spawn(command, [...args, projectPath], {
        detached: true,
        stdio: 'ignore',
      }).unref();
    } catch (error) {
      setError(`Failed to open editor: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // Helper function to open project directory
  const openInFiles = (projectPath: string) => {
    try {
      let command: string;
      const args: string[] = [projectPath];
      
      if (os.platform() === 'darwin') {
        command = 'open';
      } else if (os.platform() === 'win32') {
        command = 'explorer';
      } else {
        command = 'xdg-open';
      }
      
      spawn(command, args, {
        detached: true,
        stdio: 'ignore',
      }).unref();
    } catch (error) {
      setError(`Failed to open file manager: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // Helper function to get URLs from project
  const getProjectUrls = (project: Project): string[] => {
    const urls = new Set<string>();
    
    // Add URLs from running processes
    const projectProcesses = runningProcesses.filter((p: any) => p.projectPath === project.path);
    for (const process of projectProcesses) {
      if (process.detectedUrls && Array.isArray(process.detectedUrls)) {
        for (const url of process.detectedUrls) {
          urls.add(url);
        }
      }
    }
    
    // Add URLs from detected ports
    try {
      const db = getDatabaseManager();
      const projectPorts = db.getProjectPorts(project.id);
      for (const portInfo of projectPorts) {
        const url = `http://localhost:${portInfo.port}`;
        urls.add(url);
      }
    } catch (error) {
      // Ignore
    }
    
    return Array.from(urls).sort();
  };

  // Handler for script selection
  const handleScriptSelect = async (scriptName: string, background: boolean) => {
    if (!scriptModalData) return;

    setShowScriptModal(false);
    setIsLoading(true);
    setLoadingMessage(`Running ${scriptName}${background ? ' in background' : ''}...`);

    try {
      if (background) {
        await runScriptInBackground(scriptModalData.projectPath, scriptModalData.projectName, scriptName, [], false);
        setIsLoading(false);
        await loadRunningProcesses();
      } else {
        setIsLoading(false);
        // Run in foreground - the CLI will exit and terminal control will be handed over
        await runScript(scriptModalData.projectPath, scriptName, [], false);
        exit();
      }
    } catch (err) {
      setIsLoading(false);
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  // Handler for adding a project
  const handleAddProject = async (projectPath: string, projectName?: string) => {
    setShowAddProjectModal(false);
    setIsLoading(true);
    setLoadingMessage('Adding project...');

    try {
      const name = projectName || path.basename(projectPath);
      const db = getDatabaseManager();
      const project = db.addProject(name, projectPath);

      // Scan for tests
      setLoadingMessage('Scanning for tests...');
      await scanProject(project.id);

      // Scan for ports
      setLoadingMessage('Scanning for ports...');
      try {
        const { scanProjectPorts } = await import('./port-scanner');
        await scanProjectPorts(project.id);
      } catch {
        // Ignore port scanning errors
      }

      loadProjects();
      setIsLoading(false);

      // Select the newly added project
      const newProjects = getAllProjects();
      const newIndex = newProjects.findIndex((p: Project) => p.id === project.id);
      if (newIndex >= 0) {
        setSelectedIndex(newIndex);
      }
    } catch (err) {
      setIsLoading(false);
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  // Handler for deleting a project
  const handleDeleteProject = () => {
    if (!selectedProject) return;

    setShowConfirmDelete(false);
    setIsLoading(true);
    setLoadingMessage(`Deleting ${selectedProject.name}...`);

    setTimeout(async () => {
      try {
        const db = getDatabaseManager();
        db.removeProject(selectedProject.id);
        loadProjects();
        if (selectedIndex >= projects.length - 1) {
          setSelectedIndex(Math.max(0, projects.length - 2));
        }
        setIsLoading(false);
      } catch (err) {
        setIsLoading(false);
        setError(err instanceof Error ? err.message : String(err));
      }
    }, 100);
  };

  // Cycle filter type
  const cycleFilterType = () => {
    const currentIndex = FILTER_TYPES.indexOf(filterType);
    const nextIndex = (currentIndex + 1) % FILTER_TYPES.length;
    setFilterType(FILTER_TYPES[nextIndex]);
  };

  // Cycle sort type
  const cycleSortType = () => {
    const currentIndex = SORT_TYPES.indexOf(sortType);
    const nextIndex = (currentIndex + 1) % SORT_TYPES.length;
    setSortType(SORT_TYPES[nextIndex]);
  };

  useInput((input: string, key: any) => {
    if (key.mouse) {
      const { x, y, wheelDown, wheelUp, left } = key.mouse;
      const { columns: width } = process.stdout;
    
      // Assuming project list is on the left 35% and details on the right.
      const projectListWidth = Math.floor(width * 0.35);
    
      if (x < projectListWidth) {
        // Mouse is over the project list
        if (wheelUp) {
          setSelectedIndex((prev) => Math.max(0, prev - 1));
          return;
        }
        if (wheelDown) {
          setSelectedIndex((prev) => Math.min(projects.length - 1, prev + 1));
          return;
        }
        if (left) {
          // It's a click, so we need to calculate which item was clicked.
          // This is an approximation based on the known layout of the ProjectListComponent.
          const listTopBorder = 1;
          const listPadding = 1;
          const listHeaderHeight = 2; // "Projects (...)" + "Filter | Sort"
          const listStartY = listTopBorder + listPadding + listHeaderHeight;
          
          const scrollIndicatorHeight = listScrollOffset > 0 ? 1 : 0;
          const firstItemY = listStartY + scrollIndicatorHeight;
          
          const clickYInList = y - firstItemY;
    
          if (clickYInList >= 0) {
            let cumulativeHeight = 0;
            const visibleProjects = projects.slice(listScrollOffset);
    
            for (let i = 0; i < visibleProjects.length; i++) {
              const project = visibleProjects[i];
              const branch = gitBranches.get(project.id);
              const itemHeight = branch ? 2 : 1;
    
              if (clickYInList >= cumulativeHeight && clickYInList < cumulativeHeight + itemHeight) {
                const newIndex = listScrollOffset + i;
                if (newIndex < projects.length) {
                  setSelectedIndex(newIndex);
                  setFocusedPanel('list');
                }
                break;
              }
              cumulativeHeight += itemHeight;
              if (cumulativeHeight > availableHeight) {
                break; 
              }
            }
          }
          return;
        }
      } else {
        // Mouse is over the details panel
        if (wheelUp) {
          setDetailsScrollOffset(prev => Math.max(0, prev - 1));
          return;
        }
        if (wheelDown) {
          setDetailsScrollOffset(prev => prev + 1);
          return;
        }
      }
    }
    // Handle search mode
    if (showSearch) {
      if (key.escape) {
        setShowSearch(false);
        setSearchQuery('');
        applyFilterAndSort(allProjects, '', filterType, sortType);
        return;
      }

      if (key.return) {
        setShowSearch(false);
        return;
      }

      if (key.backspace || key.delete) {
        const newQuery = searchQuery.slice(0, -1);
        setSearchQuery(newQuery);
        applyFilterAndSort(allProjects, newQuery, filterType, sortType);
        return;
      }
      
      if (input && input.length === 1 && !key.ctrl && !key.meta) {
        const newQuery = searchQuery + input;
        setSearchQuery(newQuery);
        applyFilterAndSort(allProjects, newQuery, filterType, sortType);
        return;
      }

      return;
    }

    // Don't process input if modal is showing
    if (showHelp || isLoading || error || showUrls || showScriptModal || showAddProjectModal || showConfirmDelete) {
      // Handle URLs modal
      if (showUrls && (key.escape || key.return || input === 'q' || input === 'u')) {
        setShowUrls(false);
        return;
      }
      return;
    }

    // Handle navigation in workspaces view
    if (currentView === 'workspaces') {
      if (key.upArrow || input === 'k') {
        setSelectedWorkspaceIndex((prev) => Math.max(0, prev - 1));
        return;
      }
      if (key.downArrow || input === 'j') {
        setSelectedWorkspaceIndex((prev) => Math.min(workspaces.length - 1, prev + 1));
        return;
      }
    }

    // Handle navigation in processes view
    if (currentView === 'processes') {
      if (key.upArrow || input === 'k') {
        setSelectedProcessIndex((prev) => Math.max(0, prev - 1));
        return;
      }
      if (key.downArrow || input === 'j') {
        setSelectedProcessIndex((prev) => Math.min(runningProcesses.length - 1, prev + 1));
        return;
      }
      if (input === 'x' && runningProcesses.length > 0) {
        // Stop the selected process
        const selectedProc = runningProcesses[selectedProcessIndex];
        if (!selectedProc) return;
        setIsLoading(true);
        setLoadingMessage(`Stopping process ${selectedProc.pid}...`);
        setTimeout(async () => {
          try {
            await stopScript(selectedProc.pid);
            await loadRunningProcesses();
            setIsLoading(false);
          } catch (err) {
            setIsLoading(false);
            setError(err instanceof Error ? err.message : String(err));
          }
        }, 100);
        return;
      }
      if (input === 'X' && runningProcesses.length > 0) {
        // Stop ALL processes
        setIsLoading(true);
        setLoadingMessage('Stopping all processes...');
        setTimeout(async () => {
          try {
            for (const proc of runningProcesses) {
              await stopScript(proc.pid);
            }
            await loadRunningProcesses();
            setIsLoading(false);
          } catch (err) {
            setIsLoading(false);
            setError(err instanceof Error ? err.message : String(err));
          }
        }, 100);
        return;
      }
    }

    // Handle navigation in agents view
    if (currentView === 'agents') {
      // Handle add agent modal
      if (showAddAgentModal) {
        if (key.escape) {
          setShowAddAgentModal(false);
          setNewAgentName('');
          setNewAgentModel('');
          setNewAgentApiKey('');
          setNewAgentCliTypeIndex(0);
          setAgentInputField('name');
          return;
        }
        if (key.tab) {
          // Cycle through input fields
          const fields: Array<'name' | 'cli_type' | 'model' | 'api_key'> = ['name', 'cli_type', 'model', 'api_key'];
          const currentIdx = fields.indexOf(agentInputField);
          setAgentInputField(fields[(currentIdx + 1) % fields.length]);
          return;
        }
        if (agentInputField === 'cli_type') {
          if (key.upArrow || input === 'k') {
            setNewAgentCliTypeIndex(prev => Math.max(0, prev - 1));
            setNewAgentCliType(VALID_CLI_TYPES[Math.max(0, newAgentCliTypeIndex - 1)]);
            return;
          }
          if (key.downArrow || input === 'j') {
            setNewAgentCliTypeIndex(prev => Math.min(VALID_CLI_TYPES.length - 1, prev + 1));
            setNewAgentCliType(VALID_CLI_TYPES[Math.min(VALID_CLI_TYPES.length - 1, newAgentCliTypeIndex + 1)]);
            return;
          }
        }
        if (key.return && agentInputField === 'api_key' && newAgentName.trim()) {
          // Create agent
          if (selectedProject) {
            const agent = createAgent(selectedProject.id, {
              name: newAgentName.trim(),
              cli_type: newAgentCliType,
              model: newAgentModel.trim() || null,
              api_key: newAgentApiKey.trim() || null,
            });
            if (agent) {
              loadAgentsForProject(selectedProject.id);
              setShowAddAgentModal(false);
              setNewAgentName('');
              setNewAgentModel('');
              setNewAgentApiKey('');
              setNewAgentCliTypeIndex(0);
              setAgentInputField('name');
            } else {
              setError('Failed to create agent');
            }
          }
          return;
        }
        // Handle text input
        if (agentInputField === 'name') {
          if (key.backspace || key.delete) {
            setNewAgentName(prev => prev.slice(0, -1));
          } else if (input && input.length === 1 && !key.ctrl && !key.meta) {
            setNewAgentName(prev => prev + input);
          }
          return;
        }
        if (agentInputField === 'model') {
          if (key.backspace || key.delete) {
            setNewAgentModel(prev => prev.slice(0, -1));
          } else if (input && input.length === 1 && !key.ctrl && !key.meta) {
            setNewAgentModel(prev => prev + input);
          }
          return;
        }
        if (agentInputField === 'api_key') {
          if (key.backspace || key.delete) {
            setNewAgentApiKey(prev => prev.slice(0, -1));
          } else if (input && input.length === 1 && !key.ctrl && !key.meta) {
            setNewAgentApiKey(prev => prev + input);
          }
          return;
        }
        return;
      }

      // Navigation
      if (key.upArrow || input === 'k') {
        setSelectedAgentIndex(prev => Math.max(0, prev - 1));
        return;
      }
      if (key.downArrow || input === 'j') {
        setSelectedAgentIndex(prev => Math.min(agents.length - 1, prev + 1));
        return;
      }
      // Add agent
      if (input === 'a') {
        setShowAddAgentModal(true);
        setAgentInputField('name');
        return;
      }
      // Launch agent
      if (key.return || input === 'l') {
        const agent = agents[selectedAgentIndex];
        if (agent && selectedProject) {
          const success = launchAgentInTerminal(agent, selectedProject.path);
          if (success) {
            setError(null);
          } else {
            setError('Failed to launch agent');
          }
        }
        return;
      }
      // Delete agent
      if (input === 'd') {
        const agent = agents[selectedAgentIndex];
        if (agent) {
          const success = deleteAgent(agent.id);
          if (success && selectedProject) {
            loadAgentsForProject(selectedProject.id);
          } else {
            setError('Failed to delete agent');
          }
        }
        return;
      }
      // Back to projects
      if (key.escape) {
        setCurrentView('projects');
        return;
      }
    }

    // Handle navigation in settings view
    if (currentView === 'settings') {
      if (key.tab) {
        setSettingsSection((prev) => (prev === 'editor' ? 'browser' : 'editor'));
        setSettingsOptionIndex(0);
        return;
      }
      if (key.upArrow || input === 'k') {
        setSettingsOptionIndex((prev) => Math.max(0, prev - 1));
        return;
      }
      if (key.downArrow || input === 'j') {
        const maxIndex = settingsSection === 'editor' ? settingsEditorOptions.length - 1 : settingsBrowserOptions.length - 1;
        setSettingsOptionIndex((prev) => Math.min(maxIndex, prev + 1));
        return;
      }
      if (input === ' ' || key.return) {
        // Select option and save
        const newSettings = { ...settings };
        if (settingsSection === 'editor') {
          newSettings.editor = { type: settingsEditorOptions[settingsOptionIndex] };
        } else {
          newSettings.browser = { type: settingsBrowserOptions[settingsOptionIndex] };
        }
        setSettings(newSettings);
        // Save to file
        try {
          const settingsDir = path.join(os.homedir(), '.projax');
          if (!fs.existsSync(settingsDir)) {
            fs.mkdirSync(settingsDir, { recursive: true });
          }
          const settingsPath = path.join(settingsDir, 'settings.json');
          fs.writeFileSync(settingsPath, JSON.stringify(newSettings, null, 2));
        } catch {
          // Ignore save errors
        }
        return;
      }
    }

    // Global navigation - number keys for view switching
    if (input === '1') {
      setCurrentView('projects');
      return;
    }
    if (input === '2') {
      setCurrentView('workspaces');
      return;
    }
    if (input === '3') {
      setCurrentView('processes');
      return;
    }
    if (input === '4') {
      setCurrentView('settings');
      return;
    }
    if (input === '5') {
      if (selectedProject) {
        setCurrentView('agents');
        loadAgentsForProject(selectedProject.id);
      } else {
        setError('Select a project first to manage agents');
      }
      return;
    }

    // Terminal panel toggle
    if (input === 'T') {
      setShowTerminalPanel(prev => !prev);
      return;
    }

    // Search shortcut
    if (input === '/') {
      setShowSearch(true);
      setSearchQuery('');
      return;
    }

    // Add project shortcut (in projects view)
    if (input === 'a' && currentView === 'projects') {
      setShowAddProjectModal(true);
      return;
    }

    // Filter cycle shortcut
    if (input === 'F' && currentView === 'projects') {
      cycleFilterType();
      return;
    }

    // Sort cycle shortcut
    if (input === 'S' && currentView === 'projects') {
      cycleSortType();
      return;
    }

    // Refresh git branches
    if (input === 'g' && currentView === 'projects') {
      loadGitBranches();
      return;
    }

    // Full refresh
    if (input === 'R') {
      loadProjects();
      loadRunningProcesses();
      loadGitBranches();
      return;
    }

    // Handle editing modes
    if (editingName || editingDescription || editingTags) {
      if (key.escape) {
        setEditingName(false);
        setEditingDescription(false);
        setEditingTags(false);
        setEditInput('');
        return;
      }
      
      if (key.return) {
        // Save changes
        if (selectedProject) {
          if (editingName && editInput.trim()) {
            try {
              const db = getDatabaseManager();
              db.updateProjectName(selectedProject.id, editInput.trim());
              loadProjects();
              setEditingName(false);
              setEditInput('');
            } catch (err) {
              setError(err instanceof Error ? err.message : String(err));
            }
          } else if (editingDescription) {
            try {
              const db = getDatabaseManager();
              db.updateProject(selectedProject.id, { description: editInput.trim() || null });
              loadProjects();
              setEditingDescription(false);
              setEditInput('');
            } catch (err) {
              setError(err instanceof Error ? err.message : String(err));
            }
          } else if (editingTags) {
            // Handle tag input
            const newTag = editInput.trim();
            if (newTag) {
              try {
                const db = getDatabaseManager();
                const currentTags = selectedProject.tags || [];
                if (!currentTags.includes(newTag)) {
                  db.updateProject(selectedProject.id, { tags: [...currentTags, newTag] });
                  loadProjects();
                  loadAllTags();
                }
                setEditInput('');
              } catch (err) {
                setError(err instanceof Error ? err.message : String(err));
              }
            }
          }
        }
        return;
      }
      
      // Handle backspace
      if (key.backspace || key.delete) {
        setEditInput(prev => prev.slice(0, -1));
        return;
      }
      
      // Handle regular input
      if (input && input.length === 1) {
        setEditInput(prev => prev + input);
        return;
      }
      
      return;
    }

    // Quit
    if (input === 'q' || key.escape) {
      exit();
      return;
    }

    // Help
    if (input === '?') {
      setShowHelp(true);
      return;
    }

    // Switch panels with Tab or Left/Right arrows
    if (key.tab || key.leftArrow || key.rightArrow) {
      setFocusedPanel((prev) => prev === 'list' ? 'details' : 'list');
      return;
    }

    // Navigation (only when focused on list)
    if (focusedPanel === 'list') {
      if (key.upArrow || input === 'k') {
        setSelectedIndex((prev) => {
          const newIndex = Math.max(0, prev - 1);
          // Update scroll offset
          const visibleHeight = Math.max(1, availableHeight - 3);
          if (newIndex < listScrollOffset) {
            setListScrollOffset(Math.max(0, newIndex));
          }
          return newIndex;
        });
        return;
      }

      if (key.downArrow || input === 'j') {
        setSelectedIndex((prev) => {
          const newIndex = Math.min(projects.length - 1, prev + 1);
          // Update scroll offset
          const visibleHeight = Math.max(1, availableHeight - 3);
          if (newIndex >= listScrollOffset + visibleHeight) {
            setListScrollOffset(Math.max(0, newIndex - visibleHeight + 1));
          }
          return newIndex;
        });
        return;
      }
    }

    // Details panel actions
    if (focusedPanel === 'details' && selectedProject) {
      // Navigate scripts in details panel
      if (key.upArrow || input === 'k') {
        const projectScripts = getProjectScripts(selectedProject.path);
        if (projectScripts.scripts.size > 0) {
          setDetailSelectedScript(prev => Math.max(0, prev - 1));
        } else {
          setDetailsScrollOffset(prev => Math.max(0, prev - 1));
        }
        return;
      }

      if (key.downArrow || input === 'j') {
        const projectScripts = getProjectScripts(selectedProject.path);
        if (projectScripts.scripts.size > 0) {
          setDetailSelectedScript(prev => Math.min(projectScripts.scripts.size - 1, prev + 1));
        } else {
          setDetailsScrollOffset(prev => prev + 1);
        }
        return;
      }

      // Run selected script with Enter
      if (key.return) {
        try {
          const projectScripts = getProjectScripts(selectedProject.path);
          if (projectScripts.scripts.size > 0) {
            const scriptArray = Array.from(projectScripts.scripts.keys());
            const scriptName = scriptArray[detailSelectedScript];
            if (scriptName) {
              setIsLoading(true);
              setLoadingMessage(`Running ${scriptName} in background...`);
              setTimeout(async () => {
                try {
                  await runScriptInBackground(selectedProject.path, selectedProject.name, scriptName, [], false);
                  setIsLoading(false);
                  await loadRunningProcesses();
                } catch (err) {
                  setIsLoading(false);
                  setError(err instanceof Error ? err.message : String(err));
                }
              }, 100);
            }
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : String(err));
        }
        return;
      }

      // Edit name
      if (input === 'e') {
        setEditingName(true);
        setEditingDescription(false);
        setEditingTags(false);
        setEditInput(selectedProject.name);
        return;
      }

      // Edit tags
      if (input === 't') {
        setEditingTags(true);
        setEditingName(false);
        setEditingDescription(false);
        setEditInput('');
        return;
      }

      // Open in editor
      if (input === 'o') {
        openInEditor(selectedProject.path);
        return;
      }

      // Open in file manager
      if (input === 'f') {
        openInFiles(selectedProject.path);
        return;
      }

      // Show URLs
      if (input === 'u') {
        setShowUrls(true);
        return;
      }

      // Delete project (with confirmation)
      if (input === 'd') {
        setShowConfirmDelete(true);
        return;
      }
    }

    // Scan project
    if (input === 's' && selectedProject) {
      setIsLoading(true);
      setLoadingMessage(`Scanning ${selectedProject.name}...`);
      
      setTimeout(async () => {
        try {
          await scanProject(selectedProject.id);
          loadProjects();
          setIsLoading(false);
        } catch (err) {
          setIsLoading(false);
          setError(err instanceof Error ? err.message : String(err));
        }
      }, 100);
      return;
    }

    // Scan ports
    if (input === 'p' && selectedProject) {
      setIsLoading(true);
      setLoadingMessage(`Scanning ports for ${selectedProject.name}...`);
      
      setTimeout(async () => {
        try {
          // Import port scanner dynamically
          const { scanProjectPorts } = await import('../../cli/src/port-scanner');
          await scanProjectPorts(selectedProject.id);
          loadProjects();
          setIsLoading(false);
        } catch (err) {
          setIsLoading(false);
          setError(err instanceof Error ? err.message : String(err));
        }
      }, 100);
      return;
    }

    // Run script
    if (input === 'r' && selectedProject) {
      try {
        const projectScripts = getProjectScripts(selectedProject.path);
        if (projectScripts.scripts.size === 0) {
          setError(`No scripts found in ${selectedProject.name}`);
          return;
        }
        
        setScriptModalData({
          scripts: projectScripts.scripts,
          projectName: selectedProject.name,
          projectPath: selectedProject.path,
        });
        setShowScriptModal(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      }
      return;
    }

    // Stop all scripts for project
    if (input === 'x' && selectedProject) {
      setIsLoading(true);
      setLoadingMessage(`Stopping scripts for ${selectedProject.name}...`);
      
      setTimeout(async () => {
        try {
          const projectProcesses = runningProcesses.filter((p: any) => p.projectPath === selectedProject.path);
          if (projectProcesses.length === 0) {
            setIsLoading(false);
            setError(`No running scripts for ${selectedProject.name}`);
            return;
          }
          
          for (const proc of projectProcesses) {
            await stopScript(proc.pid);
          }
          
          await loadRunningProcesses();
          setIsLoading(false);
        } catch (err) {
          setIsLoading(false);
          setError(err instanceof Error ? err.message : String(err));
        }
      }, 100);
      return;
    }

  });

  if (showHelp) {
    return (
      <Box flexDirection="column" padding={1}>
        <HelpModal onClose={() => setShowHelp(false)} />
      </Box>
    );
  }


  if (isLoading) {
    return (
      <Box flexDirection="column" padding={1}>
        <LoadingModal message={loadingMessage} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box flexDirection="column" padding={1}>
        <ErrorModal message={error} onClose={() => setError(null)} />
      </Box>
    );
  }

  if (showSearch) {
  return (
      <Box flexDirection="column" padding={1}>
        <Box
          flexDirection="column"
          borderStyle="round"
          borderColor={colors.accentCyan}
          padding={1}
          width={60}
        >
          <Text bold color={colors.accentCyan}>
            Search Projects
          </Text>
          <Text> </Text>
          <Text color={colors.textPrimary}>
            /{searchQuery}
            <Text color={colors.textTertiary}>_</Text>
          </Text>
          <Text> </Text>
          {projects.length === 0 ? (
            <Text color={colors.textTertiary}>No projects match "{searchQuery}"</Text>
          ) : (
            <Text color={colors.textSecondary}>
              Found {projects.length} project{projects.length !== 1 ? 's' : ''}
            </Text>
          )}
          <Text> </Text>
          <Text color={colors.textSecondary}>Press Enter to confirm, Esc to cancel</Text>
        </Box>
      </Box>
    );
  }

  if (showUrls && selectedProject) {
    const urls = getProjectUrls(selectedProject);
    return (
      <Box flexDirection="column" padding={1}>
        <Box
          flexDirection="column"
          borderStyle="round"
          borderColor={colors.accentCyan}
          padding={1}
          width={70}
        >
          <Text bold color={colors.accentCyan}>
            URLs for {selectedProject.name}
          </Text>
          <Text> </Text>
          {urls.length === 0 ? (
            <Text color={colors.textTertiary}>No URLs detected</Text>
          ) : (
            urls.map((url, idx) => (
              <Text key={idx} color={colors.textPrimary}>
                {idx + 1}. {url}
              </Text>
            ))
          )}
          <Text> </Text>
          <Text color={colors.textSecondary}>Press Esc or u to close...</Text>
        </Box>
      </Box>
    );
  }

  if (showAddProjectModal) {
    return (
      <Box flexDirection="column" padding={1}>
        <AddProjectModal
          onAdd={handleAddProject}
          onCancel={() => setShowAddProjectModal(false)}
        />
      </Box>
    );
  }

  if (showConfirmDelete && selectedProject) {
    return (
      <Box flexDirection="column" padding={1}>
        <ConfirmModal
          title="Delete Project"
          message={`Are you sure you want to remove "${selectedProject.name}" from the dashboard?`}
          onConfirm={handleDeleteProject}
          onCancel={() => setShowConfirmDelete(false)}
        />
      </Box>
    );
  }

  if (showScriptModal && scriptModalData) {
    return (
      <Box flexDirection="column" padding={1}>
        <ScriptSelectionModal
          scripts={scriptModalData.scripts}
          projectName={scriptModalData.projectName}
          projectPath={scriptModalData.projectPath}
          onSelect={handleScriptSelect}
          onClose={() => setShowScriptModal(false)}
        />
      </Box>
    );
  }

  const handleTagRemove = (tag: string) => {
    if (selectedProject) {
      try {
        const db = getDatabaseManager();
        const currentTags = selectedProject.tags || [];
        db.updateProject(selectedProject.id, { tags: currentTags.filter((t: string) => t !== tag) });
        loadProjects();
        loadAllTags();
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      }
    }
  };

  // Render Projects view
  const renderProjectsView = () => (
    <Box flexDirection="row" height={availableHeight} flexGrow={0} flexShrink={0}>
      <ProjectListComponent
        projects={projects}
        selectedIndex={selectedIndex}
        runningProcesses={runningProcesses}
        isFocused={focusedPanel === 'list'}
        height={availableHeight}
        scrollOffset={listScrollOffset}
        gitBranches={gitBranches}
        filterType={filterType}
        sortType={sortType}
      />
      <Box width={1} />
      <ProjectDetailsComponent
        project={selectedProject}
        runningProcesses={runningProcesses}
        isFocused={focusedPanel === 'details'}
        editingName={editingName}
        editingDescription={editingDescription}
        editingTags={editingTags}
        editInput={editInput}
        allTags={allTags}
        onTagRemove={handleTagRemove}
        height={availableHeight}
        scrollOffset={detailsScrollOffset}
        gitBranch={selectedProject ? gitBranches.get(selectedProject.id) || null : null}
        selectedScriptIndex={detailSelectedScript}
      />
      {showTerminalPanel && (
        <>
          <Box width={1} />
          <TerminalOutputPanel
            processes={runningProcesses}
            selectedPid={selectedProcessPid}
            height={availableHeight}
            onSelectProcess={(pid) => setSelectedProcessPid(pid)}
          />
        </>
      )}
    </Box>
  );

  // Render Workspaces view
  const renderWorkspacesView = () => (
      <Box flexDirection="row" height={availableHeight} flexGrow={0} flexShrink={0}>
        {/* Workspace List */}
        <Box
          flexDirection="column"
          width="35%"
          height={availableHeight}
          borderStyle="round"
          borderColor={colors.accentCyan}
          padding={1}
        >
          <Text bold color={colors.textPrimary}>
            Workspaces ({workspaces.length})
          </Text>
          <Box flexDirection="column" flexGrow={1}>
            {workspaces.length === 0 ? (
              <Text color={colors.textTertiary}>No workspaces found</Text>
            ) : (
              workspaces.map((ws, index) => {
                const isSelected = index === selectedWorkspaceIndex;
                return (
                  <Text key={ws.id} color={isSelected ? colors.accentCyan : colors.textPrimary} bold={isSelected}>
                    {isSelected ? '▶ ' : '  '}{truncateText(ws.name, 25)}
                  </Text>
                );
              })
            )}
          </Box>
        </Box>
        <Box width={1} />
        {/* Workspace Details */}
        <Box
          flexDirection="column"
          width="65%"
          height={availableHeight}
          borderStyle="round"
          borderColor={colors.borderColor}
          padding={1}
        >
          {workspaces[selectedWorkspaceIndex] ? (
            <>
              <Text bold color={colors.accentCyan}>
                {workspaces[selectedWorkspaceIndex].name}
              </Text>
              <Text> </Text>
              {workspaces[selectedWorkspaceIndex].description && (
                <Text color={colors.textSecondary}>
                  {workspaces[selectedWorkspaceIndex].description}
                </Text>
              )}
              <Text> </Text>
              <Text color={colors.textTertiary}>
                Path: {getDisplayPath(workspaces[selectedWorkspaceIndex].workspace_file_path)}
              </Text>
            </>
          ) : (
            <Text color={colors.textTertiary}>Select a workspace</Text>
          )}
        </Box>
      </Box>
  );

  // Load workspaces from API
  const loadWorkspacesFromApi = async () => {
    try {
      // Try common API ports
      const ports = [38124, 38125, 38126, 38127, 38128, 3001];
      let apiBaseUrl = '';

      for (const port of ports) {
        try {
          const response = await fetch(`http://localhost:${port}/health`, {
            signal: AbortSignal.timeout(500),
          });
          if (response.ok) {
            apiBaseUrl = `http://localhost:${port}/api`;
            break;
          }
        } catch {
          continue;
        }
      }

      if (!apiBaseUrl) {
        return;
      }

      const response = await fetch(`${apiBaseUrl}/workspaces`);
      if (response.ok) {
        const ws = (await response.json()) as Workspace[];
        setWorkspaces(ws);
      }
    } catch {
      // Ignore workspace loading errors
    }
  };

  // Render Processes view
  const renderProcessesView = () => (
    <Box flexDirection="column" padding={2}>
      <Text bold color={colors.accentCyan}>Running Processes ({runningProcesses.length})</Text>
      <Text> </Text>
      {runningProcesses.length === 0 ? (
        <Text color={colors.textTertiary}>No running processes</Text>
      ) : (
        runningProcesses.map((proc: any, index: number) => {
          const uptime = Math.floor((Date.now() - proc.startedAt) / 1000);
          const minutes = Math.floor(uptime / 60);
          const seconds = uptime % 60;
          const uptimeStr = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
          const isSelected = index === selectedProcessIndex;
          const portsStr = proc.detectedPorts && proc.detectedPorts.length > 0
            ? ` [ports: ${proc.detectedPorts.join(', ')}]`
            : '';
          return (
            <Text key={proc.pid} color={isSelected ? colors.accentCyan : colors.textPrimary} bold={isSelected}>
              {isSelected ? '> ' : '  '}
              <Text color={colors.accentGreen}>●</Text> PID {proc.pid}: {proc.projectName} ({proc.scriptName}) - {uptimeStr}
              {portsStr && <Text color={colors.accentCyan}>{portsStr}</Text>}
            </Text>
          );
        })
      )}
      <Text> </Text>
      <Text color={colors.textTertiary}>
        {runningProcesses.length > 0
          ? 'up/down: navigate | x: stop selected | X: stop all | 1: back to projects'
          : 'Press 1 to return to Projects'}
      </Text>
    </Box>
  );

  // Render Settings view
  const renderSettingsView = () => {
    const currentOptions = settingsSection === 'editor' ? settingsEditorOptions : settingsBrowserOptions;
    const currentValue = settingsSection === 'editor' ? settings.editor.type : settings.browser.type;

    return (
      <Box flexDirection="column" padding={2}>
        <Text bold color={colors.accentCyan}>Settings</Text>
        <Text> </Text>

        {/* Section tabs */}
        <Box>
          <Text
            color={settingsSection === 'editor' ? colors.accentCyan : colors.textTertiary}
            bold={settingsSection === 'editor'}
          >
            [Editor]
          </Text>
          <Text>  </Text>
          <Text
            color={settingsSection === 'browser' ? colors.accentCyan : colors.textTertiary}
            bold={settingsSection === 'browser'}
          >
            [Browser]
          </Text>
        </Box>
        <Text> </Text>

        {/* Options */}
        {currentOptions.map((option, index) => {
          const isSelected = index === settingsOptionIndex;
          const isActive = option === currentValue;
          return (
            <Text key={option} color={isSelected ? colors.accentCyan : colors.textPrimary} bold={isSelected}>
              {isSelected ? '▶ ' : '  '}
              {isActive ? '● ' : '○ '}
              {option.charAt(0).toUpperCase() + option.slice(1)}
            </Text>
          );
        })}

        <Text> </Text>
        <Text color={colors.textTertiary}>Tab: switch section | ↑↓/jk: select | Space/Enter: choose</Text>
      </Box>
    );
  };

  // Render Agents view
  const renderAgentsView = () => {
    const selectedAgent = agents[selectedAgentIndex];
    const isAgentRunning = selectedAgent
      ? runningAgentsList.some(r => r.agentId === selectedAgent.id)
      : false;

    return (
      <Box flexDirection="column" padding={1} height={availableHeight}>
        {/* Add Agent Modal */}
        {showAddAgentModal && (
          <Box
            flexDirection="column"
            borderStyle="round"
            borderColor={colors.accentCyan}
            padding={1}
            width={60}
          >
            <Text bold color={colors.accentCyan}>Add New Agent</Text>
            <Text> </Text>
            <Box>
              <Text color={agentInputField === 'name' ? colors.accentCyan : colors.textSecondary}>
                Name: {agentInputField === 'name' ? '▶ ' : '  '}
              </Text>
              <Text color={colors.textPrimary}>{newAgentName || '_'}</Text>
            </Box>
            <Text> </Text>
            <Text color={agentInputField === 'cli_type' ? colors.accentCyan : colors.textSecondary}>
              CLI Type: {agentInputField === 'cli_type' ? '▶' : ''}
            </Text>
            {VALID_CLI_TYPES.map((cliType, idx) => (
              <Text
                key={cliType}
                color={idx === newAgentCliTypeIndex ? colors.accentGreen : colors.textTertiary}
              >
                {idx === newAgentCliTypeIndex ? '  ● ' : '  ○ '}
                {CLI_DISPLAY_NAMES[cliType]}
              </Text>
            ))}
            <Text> </Text>
            <Box>
              <Text color={agentInputField === 'model' ? colors.accentCyan : colors.textSecondary}>
                Model (optional): {agentInputField === 'model' ? '▶ ' : '  '}
              </Text>
              <Text color={colors.textPrimary}>{newAgentModel || '_'}</Text>
            </Box>
            <Text> </Text>
            <Box>
              <Text color={agentInputField === 'api_key' ? colors.accentCyan : colors.textSecondary}>
                API Key (optional): {agentInputField === 'api_key' ? '▶ ' : '  '}
              </Text>
              <Text color={colors.textPrimary}>
                {newAgentApiKey ? '*'.repeat(Math.min(newAgentApiKey.length, 20)) : '_'}
              </Text>
            </Box>
            <Text> </Text>
            <Text color={colors.textTertiary}>Tab: next field | ↑↓: select CLI | Enter: create | Esc: cancel</Text>
          </Box>
        )}

        {!showAddAgentModal && (
          <>
            <Text bold color={colors.accentCyan}>
              Agents for {selectedProject?.name || 'No Project'} ({agents.length})
            </Text>
            <Text> </Text>

            {agents.length === 0 ? (
              <Box flexDirection="column">
                <Text color={colors.textTertiary}>No agents configured for this project.</Text>
                <Text> </Text>
                <Text color={colors.textSecondary}>Press 'a' to add an agent.</Text>
              </Box>
            ) : (
              <Box flexDirection="row" height={availableHeight - 6}>
                {/* Agent List */}
                <Box flexDirection="column" width="40%" borderStyle="round" borderColor={colors.borderColor} padding={1}>
                  {agents.map((agent, index) => {
                    const isSelected = index === selectedAgentIndex;
                    const running = runningAgentsList.some(r => r.agentId === agent.id);
                    return (
                      <Box key={agent.id}>
                        <Text color={isSelected ? colors.accentCyan : colors.textPrimary} bold={isSelected}>
                          {isSelected ? '▶ ' : '  '}
                          {running ? '● ' : '○ '}
                          {truncateText(agent.name, 25)}
                        </Text>
                      </Box>
                    );
                  })}
                </Box>
                <Box width={1} />
                {/* Agent Details */}
                <Box flexDirection="column" width="60%" borderStyle="round" borderColor={colors.borderColor} padding={1}>
                  {selectedAgent && (
                    <>
                      <Text bold color={colors.accentCyan}>{selectedAgent.name}</Text>
                      <Text> </Text>
                      <Text color={colors.textSecondary}>
                        Type: <Text color={colors.textPrimary}>{CLI_DISPLAY_NAMES[selectedAgent.cli_type]}</Text>
                      </Text>
                      {selectedAgent.model && (
                        <Text color={colors.textSecondary}>
                          Model: <Text color={colors.textPrimary}>{selectedAgent.model}</Text>
                        </Text>
                      )}
                      {selectedAgent.api_key && (
                        <Text color={colors.textSecondary}>
                          API Key: <Text color={colors.accentGreen}>configured</Text>
                        </Text>
                      )}
                      {selectedAgent.system_prompt && (
                        <Text color={colors.textSecondary}>
                          System Prompt: <Text color={colors.textPrimary}>{truncateText(selectedAgent.system_prompt, 40)}</Text>
                        </Text>
                      )}
                      <Text> </Text>
                      <Text color={isAgentRunning ? colors.accentGreen : colors.textTertiary}>
                        Status: {isAgentRunning ? 'Running' : 'Stopped'}
                      </Text>
                    </>
                  )}
                </Box>
              </Box>
            )}

            <Text> </Text>
            <Text color={colors.textTertiary}>
              ↑↓/jk: navigate | a: add agent | Enter/l: launch | d: delete | Esc: back to projects
            </Text>
          </>
        )}
      </Box>
    );
  };

  return (
    <Box flexDirection="column" height={terminalHeight}>
      {/* View indicator bar */}
      <Box paddingX={1} height={1}>
        <Text color={currentView === 'projects' ? colors.accentCyan : colors.textTertiary}>
          [1] Projects
        </Text>
        <Text> </Text>
        <Text color={currentView === 'workspaces' ? colors.accentCyan : colors.textTertiary}>
          [2] Workspaces
        </Text>
        <Text> </Text>
        <Text color={currentView === 'processes' ? colors.accentCyan : colors.textTertiary}>
          [3] Processes
        </Text>
        <Text> </Text>
        <Text color={currentView === 'settings' ? colors.accentCyan : colors.textTertiary}>
          [4] Settings
        </Text>
        <Text> </Text>
        <Text color={currentView === 'agents' ? colors.accentCyan : colors.textTertiary}>
          [5] Agents
        </Text>
        {showTerminalPanel && (
          <>
            <Text> | </Text>
            <Text color={colors.accentGreen}>Terminal [T]</Text>
          </>
        )}
      </Box>

      {/* Main content based on current view */}
      {currentView === 'projects' && renderProjectsView()}
      {currentView === 'workspaces' && renderWorkspacesView()}
      {currentView === 'processes' && renderProcessesView()}
      {currentView === 'settings' && renderSettingsView()}
      {currentView === 'agents' && renderAgentsView()}

      {/* Status bar */}
      <Box paddingX={1} borderStyle="single" borderColor={colors.borderColor} flexShrink={0} height={3}>
        <StatusBar focusedPanel={focusedPanel} selectedProject={selectedProject} />
      </Box>
    </Box>
  );
};

// Render the app
render(<App />);
