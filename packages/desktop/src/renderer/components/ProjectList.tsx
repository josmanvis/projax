import React, { useState, useEffect, useRef } from 'react';
// Note: Renderer runs in browser context, types only
type Project = any;
import './ProjectList.css';

interface ProjectListProps {
  projects: Project[];
  selectedProject: Project | null;
  onSelectProject: (project: Project) => void;
  loading: boolean;
  runningProcesses?: any[];
  keyboardFocusedIndex?: number;
  onKeyboardFocusChange?: (index: number) => void;
  gitBranches?: Map<number, string | null>;
}

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

const ProjectList: React.FC<ProjectListProps> = ({
  projects,
  selectedProject,
  onSelectProject,
  loading,
  runningProcesses = [],
  keyboardFocusedIndex = -1,
  onKeyboardFocusChange,
  gitBranches,
}) => {
  if (loading) {
    return (
      <div className="project-list-loading">
        <p>Loading projects...</p>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="project-list-empty">
        <p>No projects yet</p>
        <p className="hint">Add a project to get started</p>
        <p className="hint" style={{ fontSize: '11px', marginTop: '0.5rem', opacity: 0.7 }}>
          Tip: Drag and drop a folder here to add it
        </p>
      </div>
    );
  }

  const listRef = React.useRef<HTMLDivElement>(null);

  return (
    <div 
      ref={listRef}
      className="project-list" 
      role="listbox" 
      aria-label="Projects" 
      tabIndex={0}
      onFocus={(e) => {
        // When list receives focus, focus first project if none focused
        if (keyboardFocusedIndex < 0 && projects.length > 0 && onKeyboardFocusChange) {
          onKeyboardFocusChange(0);
        }
      }}
      onBlur={(e) => {
        // Clear focus when list loses focus
        if (onKeyboardFocusChange && !listRef.current?.contains(e.relatedTarget as Node)) {
          onKeyboardFocusChange(-1);
        }
      }}
    >
      {projects.map((project, index) => {
        const isSelected = selectedProject?.id === project.id;
        const isKeyboardFocused = keyboardFocusedIndex === index;
        
        // Check if this project has running scripts
        const projectRunning = runningProcesses.filter(
          (p: any) => p.projectPath === project.path
        );
        const hasRunningScripts = projectRunning.length > 0;
        
        // Extract unique ports from running processes
        const runningPorts = Array.from(
          new Set(
            projectRunning
              .map((p: any) => p.port)
              .filter((port: any) => port != null)
          )
        ).sort((a, b) => a - b);

        return (
          <div
            key={project.id}
            className={`project-item ${isSelected ? 'selected' : ''} ${hasRunningScripts ? 'running' : ''} ${isKeyboardFocused ? 'keyboard-focused' : ''}`}
            onClick={() => onSelectProject(project)}
            role="option"
            aria-selected={isSelected}
            tabIndex={index === 0 ? 0 : -1}
            onFocus={(e) => {
              // Scroll into view when tabbing to this item
              e.currentTarget.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
              if (onKeyboardFocusChange) {
                onKeyboardFocusChange(index);
              }
            }}
            ref={(el) => {
              if (isKeyboardFocused && el && onKeyboardFocusChange) {
                // Smooth scroll into view when focused via arrow keys
                el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
              }
            }}
          >
            <div className="project-item-header">
              <h3 className="project-name">
                {hasRunningScripts && <span className="running-indicator-dot">●</span>}
                {project.name}
                {gitBranches && gitBranches.has(project.id) && gitBranches.get(project.id) && (
                  <span className="git-branch-badge">{gitBranches.get(project.id)}</span>
                )}
              </h3>
            </div>
            <p className="project-path">{project.description || getDisplayPath(project.path)}</p>
            {project.tags && project.tags.length > 0 && (
              <div className="project-tags">
                {project.tags.map((tag: string) => (
                  <span key={tag} className="project-tag">{tag}</span>
                ))}
              </div>
            )}
            {hasRunningScripts && (
            <div className="project-meta">
                <span className="running-count">{projectRunning.length} running</span>
                {runningPorts.length > 0 && (
                  <div className="running-ports">
                    {runningPorts.map((port: number) => (
                      <span key={port} className="port-badge">:{port}</span>
                    ))}
                  </div>
              )}
            </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ProjectList;

