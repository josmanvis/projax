import React, { useState, useEffect } from 'react';
import { render, Box, Text, useInput, useApp, useFocus, useFocusManager } from 'ink';
import {
  getDatabaseManager,
  getAllProjects,
  scanProject,
  Project,
} from '../../cli/src/core-bridge';
import { getProjectScripts, getRunningProcessesClean, runScript, runScriptInBackground, stopScript } from '../../cli/src/script-runner';
import { spawn } from 'child_process';
import * as path from 'path';
import * as os from 'os';

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
      width={70}
    >
      <Text bold color={colors.accentCyan}>
        PROJAX Terminal UI - Help
      </Text>
      <Text> </Text>
      <Text color={colors.accentCyan}>Navigation:</Text>
      <Text>  ↑/k        Move up in project list</Text>
      <Text>  ↓/j        Move down in project list</Text>
      <Text>  Tab/←→     Switch between list and details</Text>
      <Text> </Text>
      <Text color={colors.accentCyan}>List Panel Actions:</Text>
      <Text>  /          Search projects (fuzzy search)</Text>
      <Text>  s          Scan selected project for tests</Text>
      <Text> </Text>
      <Text color={colors.accentCyan}>Details Panel Actions:</Text>
      <Text>  ↑↓/kj      Scroll details</Text>
      <Text>  e          Edit project name</Text>
      <Text>  t          Add/edit tags</Text>
      <Text>  o          Open project in editor</Text>
      <Text>  f          Open project directory</Text>
      <Text>  u          Show detected URLs</Text>
      <Text>  s          Scan project for tests</Text>
      <Text>  p          Scan ports for project</Text>
      <Text>  r          Show scripts (use CLI to run)</Text>
      <Text>  x          Stop all scripts for project</Text>
      <Text>  d          Delete project</Text>
      <Text> </Text>
      <Text color={colors.accentCyan}>Editing:</Text>
      <Text>  Enter      Save changes</Text>
      <Text>  Esc        Cancel editing</Text>
      <Text> </Text>
      <Text color={colors.accentCyan}>General:</Text>
      <Text>  q/Esc      Quit</Text>
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
      onSelect(scriptName, false);
      return;
    }

    if (input === 'b') {
      const [scriptName] = scriptArray[selectedIndex];
      onSelect(scriptName, true);
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
      <Text color={colors.textSecondary}>↑↓/kj: Navigate | Enter: Run | b: Background | Esc/q: Cancel</Text>
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
}

const ProjectListComponent: React.FC<ProjectListProps> = ({ 
  projects, 
  selectedIndex, 
  runningProcesses, 
  isFocused,
  height,
  scrollOffset,
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
      <Text bold color={colors.textPrimary}>
        Projects ({projects.length})
      </Text>
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
          
          return (
            <Text key={project.id} color={isSelected ? colors.accentCyan : colors.textPrimary} bold={isSelected}>
              {isSelected ? '▶ ' : '  '}
              {hasRunningScripts && <Text color={colors.accentGreen}>● </Text>}
                  {truncateText(project.name, 30)}
              {hasRunningScripts && <Text color={colors.accentGreen}> ({projectRunning.length})</Text>}
            </Text>
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
}) => {
  const { focus } = useFocus({ id: 'projectDetails' });
  const [scripts, setScripts] = useState<any>(null);
  const [ports, setPorts] = useState<any[]>([]);

  useEffect(() => {
    if (!project) {
      setScripts(null);
      setPorts([]);
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
      </Box>
  );
  
  contentLines.push(<Text key="spacer2"> </Text>);
  
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

  // Scripts
  if (scripts && scripts.scripts && scripts.scripts.size > 0) {
    contentLines.push(
      <Text key="scripts-header" bold>
            Available Scripts (<Text color={colors.accentCyan}>{scripts.scripts.size}</Text>):
          </Text>
    );
    Array.from(scripts.scripts.entries() as IterableIterator<[string, any]>).slice(0, 5).forEach(([name, script]) => {
      contentLines.push(
        <Text key={`script-${name}`}>
              {'  '}
              <Text color={colors.accentGreen}>{name}</Text>
              {' - '}
          <Text color={colors.textSecondary}>{truncateText(script.command, 60)}</Text>
            </Text>
      );
    });
    if (scripts.scripts.size > 5) {
      contentLines.push(
        <Text key="scripts-more" color={colors.textTertiary}>  ... and {scripts.scripts.size - 5} more</Text>
      );
    }
    contentLines.push(<Text key="spacer5"> </Text>);
  }

  // Ports
  if (ports.length > 0) {
    contentLines.push(
      <Text key="ports-header" bold>
            Detected Ports (<Text color={colors.accentCyan}>{ports.length}</Text>):
          </Text>
    );
    ports.slice(0, 5).forEach((port: any) => {
      contentLines.push(
        <Text key={`port-${port.id}`}>
              {'  '}Port <Text color={colors.accentCyan}>{port.port}</Text>
          <Text color={colors.textSecondary}> - {truncateText(port.config_source, 50)}</Text>
            </Text>
      );
    });
    if (ports.length > 5) {
      contentLines.push(
        <Text key="ports-more" color={colors.textTertiary}>  ... and {ports.length - 5} more</Text>
      );
    }
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
          <Text color={colors.accentCyan}>Projects</Text>
      </Box>
      <Box>
          <Text bold>/</Text>
          <Text color={colors.textSecondary}> Search | </Text>
        <Text bold>↑↓/kj</Text>
        <Text color={colors.textSecondary}> Navigate | </Text>
        <Text bold>Tab/←→</Text>
          <Text color={colors.textSecondary}> Switch | </Text>
          <Text bold>s</Text>
          <Text color={colors.textSecondary}> Scan | </Text>
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
            <Text color={colors.textPrimary}>{selectedProject.name}</Text>
          </>
        )}
      </Box>
      <Box>
        <Text bold>↑↓/kj</Text>
        <Text color={colors.textSecondary}> Scroll | </Text>
        <Text bold>e</Text>
        <Text color={colors.textSecondary}> Edit | </Text>
        <Text bold>t</Text>
        <Text color={colors.textSecondary}> Tags | </Text>
        <Text bold>o</Text>
        <Text color={colors.textSecondary}> Editor | </Text>
        <Text bold>f</Text>
        <Text color={colors.textSecondary}> Files | </Text>
        <Text bold>u</Text>
        <Text color={colors.textSecondary}> URLs | </Text>
        <Text bold>s</Text>
        <Text color={colors.textSecondary}> Scan | </Text>
        <Text bold>p</Text>
        <Text color={colors.textSecondary}> Ports | </Text>
        <Text bold>r</Text>
        <Text color={colors.textSecondary}> Scripts | </Text>
        <Text bold>x</Text>
        <Text color={colors.textSecondary}> Stop | </Text>
        <Text bold>d</Text>
        <Text color={colors.textSecondary}> Delete | </Text>
        <Text bold>Tab</Text>
        <Text color={colors.textSecondary}> Switch | </Text>
        <Text bold>?</Text>
        <Text color={colors.textSecondary}> Help | </Text>
        <Text bold>q</Text>
        <Text color={colors.textSecondary}> Quit</Text>
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
  
  // Editing state
  const [editingName, setEditingName] = useState(false);
  const [editingDescription, setEditingDescription] = useState(false);
  const [editingTags, setEditingTags] = useState(false);
  const [editInput, setEditInput] = useState('');
  const [showUrls, setShowUrls] = useState(false);
  const [allTags, setAllTags] = useState<string[]>([]);
  
  // Search state
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [listScrollOffset, setListScrollOffset] = useState(0);
  const [detailsScrollOffset, setDetailsScrollOffset] = useState(0);
  
  // Script selection state
  const [showScriptModal, setShowScriptModal] = useState(false);
  const [scriptModalData, setScriptModalData] = useState<{ scripts: Map<string, any>; projectName: string; projectPath: string } | null>(null);
  
  // Get terminal dimensions
  const terminalHeight = process.stdout.rows || 24;
  const availableHeight = terminalHeight - 3; // Subtract status bar

  useEffect(() => {
    loadProjects();
    loadRunningProcesses();
    loadAllTags();
    
    // Refresh running processes every 5 seconds
    const interval = setInterval(() => {
      loadRunningProcesses();
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  // Reset editing state and scroll when project changes
  useEffect(() => {
    setEditingName(false);
    setEditingDescription(false);
    setEditingTags(false);
    setEditInput('');
    setDetailsScrollOffset(0); // Reset scroll when switching projects
  }, [selectedIndex]);

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
      allProjects.forEach(project => {
        if (project.tags && Array.isArray(project.tags)) {
          project.tags.forEach(tag => tagsSet.add(tag));
        }
      });
      setAllTags(Array.from(tagsSet));
    } catch (error) {
      setAllTags([]);
    }
  };

  const loadProjects = () => {
    const loadedProjects = getAllProjects();
    setAllProjects(loadedProjects);
    filterProjects(loadedProjects, searchQuery);
  };

  const filterProjects = (projectsToFilter: Project[], query: string) => {
    if (!query.trim()) {
      setProjects(projectsToFilter);
      return;
    }
    
    const filtered = projectsToFilter.filter(project => {
      const nameMatch = fuzzyMatch(query, project.name);
      const descMatch = project.description ? fuzzyMatch(query, project.description) : false;
      const pathMatch = fuzzyMatch(query, project.path);
      const tagsMatch = project.tags?.some(tag => fuzzyMatch(query, tag)) || false;
      
      return nameMatch || descMatch || pathMatch || tagsMatch;
    });
    
    setProjects(filtered);
    
    // Adjust selected index if current selection is out of bounds
    if (selectedIndex >= filtered.length) {
      setSelectedIndex(Math.max(0, filtered.length - 1));
    }
  };

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

  useInput((input: string, key: any) => {
    // Handle search mode
    if (showSearch) {
      if (key.escape) {
        setShowSearch(false);
        setSearchQuery('');
        filterProjects(allProjects, '');
        return;
      }
      
      if (key.return) {
        setShowSearch(false);
        return;
      }
      
      if (key.backspace || key.delete) {
        const newQuery = searchQuery.slice(0, -1);
        setSearchQuery(newQuery);
        filterProjects(allProjects, newQuery);
        return;
      }
      
      if (input && input.length === 1 && !key.ctrl && !key.meta) {
        const newQuery = searchQuery + input;
        setSearchQuery(newQuery);
        filterProjects(allProjects, newQuery);
        return;
      }
      
      return;
    }
    
    // Don't process input if modal is showing
    if (showHelp || isLoading || error || showUrls || showScriptModal) {
      // Handle URLs modal
      if (showUrls && (key.escape || key.return || input === 'q' || input === 'u')) {
        setShowUrls(false);
        return;
      }
      return;
    }

    // Search shortcut
    if (input === '/') {
      setShowSearch(true);
      setSearchQuery('');
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
      // Scroll details panel
      if (key.upArrow || input === 'k') {
        setDetailsScrollOffset(prev => Math.max(0, prev - 1));
        return;
      }

      if (key.downArrow || input === 'j') {
        const visibleHeight = Math.max(1, availableHeight - 3);
        // Estimate content height (rough calculation)
        setDetailsScrollOffset(prev => prev + 1);
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

      // Delete project
      if (input === 'd') {
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
        db.updateProject(selectedProject.id, { tags: currentTags.filter(t => t !== tag) });
        loadProjects();
        loadAllTags();
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      }
    }
  };

  return (
    <Box flexDirection="column" height={terminalHeight}>
      <Box flexDirection="row" height={availableHeight} flexGrow={0} flexShrink={0}>
        <ProjectListComponent 
          projects={projects} 
          selectedIndex={selectedIndex} 
          runningProcesses={runningProcesses}
          isFocused={focusedPanel === 'list'}
          height={availableHeight}
          scrollOffset={listScrollOffset}
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
        />
      </Box>
      
      <Box paddingX={1} borderStyle="single" borderColor={colors.borderColor} flexShrink={0} height={3}>
        <StatusBar focusedPanel={focusedPanel} selectedProject={selectedProject} />
      </Box>
    </Box>
  );
};

// Render the app
render(<App />);
