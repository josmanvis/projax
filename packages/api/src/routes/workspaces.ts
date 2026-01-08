import { Router } from 'express';
import { getDatabase } from '../database';
import { parseWorkspaceFile, generateWorkspaceFile, validateWorkspacePath } from 'projax-core';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const router: Router = Router();
const db = getDatabase();

// Helper function to get PROJAX workspaces directory
function getProjaxWorkspacesDir(): string {
  const projaxDir = path.join(os.homedir(), '.projax', 'workspaces');
  if (!fs.existsSync(projaxDir)) {
    fs.mkdirSync(projaxDir, { recursive: true });
  }
  return projaxDir;
}

// Helper function to generate workspace file path in PROJAX directory
function getProjaxWorkspaceFilePath(workspaceId: number, workspaceName: string): string {
  const workspacesDir = getProjaxWorkspacesDir();
  const safeName = workspaceName.replace(/[^a-z0-9]/gi, '-').toLowerCase();
  return path.join(workspacesDir, `workspace-${workspaceId}-${safeName}.code-workspace`);
}

// Helper function to ensure workspace file exists and is up-to-date
function ensureWorkspaceFile(workspaceId: number): string {
  const workspace = db.getWorkspace(workspaceId);
  if (!workspace) {
    throw new Error('Workspace not found');
  }

  // Check if workspace file path is in PROJAX directory
  const projaxWorkspacesDir = getProjaxWorkspacesDir();
  const isProjaxManaged = workspace.workspace_file_path.startsWith(projaxWorkspacesDir);

  // If file exists and is not PROJAX-managed, use it
  if (!isProjaxManaged && fs.existsSync(workspace.workspace_file_path)) {
    return workspace.workspace_file_path;
  }

  // Generate/update PROJAX-managed workspace file
  const workspaceFilePath = isProjaxManaged 
    ? workspace.workspace_file_path 
    : getProjaxWorkspaceFilePath(workspaceId, workspace.name);

  // Get all projects in workspace
  const workspaceProjects = db.getWorkspaceProjects(workspaceId);
  const projectPaths = workspaceProjects.map(wp => wp.project_path);

  // Generate workspace file
  generateWorkspaceFile(workspace.name, projectPaths, workspaceFilePath);

  // Update workspace file path if it changed
  if (workspace.workspace_file_path !== workspaceFilePath) {
    db.updateWorkspace(workspaceId, { workspace_file_path: workspaceFilePath });
  }

  return workspaceFilePath;
}

// List all workspaces
router.get('/', (req, res) => {
  try {
    const workspaces = db.getAllWorkspaces();
    res.json(workspaces);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Get workspace by ID
router.get('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid workspace ID' });
    }

    const workspace = db.getWorkspace(id);
    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' });
    }

    res.json(workspace);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Create new workspace
router.post('/', (req, res) => {
  try {
    const { name, workspace_file_path, description, tags } = req.body;

    if (!name || !workspace_file_path) {
      return res.status(400).json({ error: 'Name and workspace_file_path are required' });
    }

    // Validate workspace file path exists
    if (!fs.existsSync(workspace_file_path)) {
      return res.status(400).json({ error: 'Workspace file does not exist' });
    }

    if (!validateWorkspacePath(workspace_file_path)) {
      return res.status(400).json({ error: 'Invalid workspace file format' });
    }

    const workspace = db.addWorkspace(name, workspace_file_path, description || null, tags || []);
    res.status(201).json(workspace);
  } catch (error) {
    if (error instanceof Error && error.message.includes('already exists')) {
      return res.status(409).json({ error: error.message });
    }
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Update workspace
router.put('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid workspace ID' });
    }

    const { name, description, tags, workspace_file_path } = req.body;
    const updates: any = {};

    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (tags !== undefined) updates.tags = tags;
    if (workspace_file_path !== undefined) {
      // Only validate if it's not a PROJAX-managed workspace
      const projaxWorkspacesDir = getProjaxWorkspacesDir();
      if (!workspace_file_path.startsWith(projaxWorkspacesDir)) {
        if (!fs.existsSync(workspace_file_path)) {
          return res.status(400).json({ error: 'Workspace file does not exist' });
        }
        if (!validateWorkspacePath(workspace_file_path)) {
          return res.status(400).json({ error: 'Invalid workspace file format' });
        }
      }
      updates.workspace_file_path = workspace_file_path;
    }

    const workspace = db.updateWorkspace(id, updates);
    
    // Regenerate workspace file if projects changed or name changed
    if (name !== undefined || description !== undefined || tags !== undefined) {
      try {
        ensureWorkspaceFile(id);
      } catch (error) {
        console.warn('Failed to regenerate workspace file:', error);
      }
    }
    
    res.json(workspace);
  } catch (error) {
    if (error instanceof Error && error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Delete workspace
router.delete('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid workspace ID' });
    }

    db.removeWorkspace(id);
    res.status(204).send();
  } catch (error) {
    if (error instanceof Error && error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Get projects in workspace
router.get('/:id/projects', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid workspace ID' });
    }

    const workspace = db.getWorkspace(id);
    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' });
    }

    const workspaceProjects = db.getWorkspaceProjects(id);
    res.json(workspaceProjects);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Add project to workspace
router.post('/:id/projects', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid workspace ID' });
    }

    const { project_path } = req.body;
    if (!project_path) {
      return res.status(400).json({ error: 'project_path is required' });
    }

    // Resolve to absolute path
    const absolutePath = path.isAbsolute(project_path)
      ? project_path
      : path.resolve(process.cwd(), project_path);

    if (!fs.existsSync(absolutePath)) {
      return res.status(400).json({ error: 'Project path does not exist' });
    }

    const workspaceProject = db.addProjectToWorkspace(id, absolutePath);
    
    // Regenerate workspace file to include new project
    try {
      ensureWorkspaceFile(id);
    } catch (error) {
      console.warn('Failed to regenerate workspace file:', error);
    }
    
    res.status(201).json(workspaceProject);
  } catch (error) {
    if (error instanceof Error && error.message.includes('already in workspace')) {
      return res.status(409).json({ error: error.message });
    }
    if (error instanceof Error && error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Remove project from workspace
router.delete('/:id/projects/:projectPath', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid workspace ID' });
    }

    const projectPath = decodeURIComponent(req.params.projectPath);
    db.removeProjectFromWorkspace(id, projectPath);
    
    // Regenerate workspace file to remove project
    try {
      ensureWorkspaceFile(id);
    } catch (error) {
      console.warn('Failed to regenerate workspace file:', error);
    }
    
    res.status(204).send();
  } catch (error) {
    if (error instanceof Error && error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Update project order in workspace
router.put('/:id/projects/:projectPath/order', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid workspace ID' });
    }

    const projectPath = decodeURIComponent(req.params.projectPath);
    const { order } = req.body;

    if (typeof order !== 'number') {
      return res.status(400).json({ error: 'Order must be a number' });
    }

    db.updateWorkspaceProjectOrder(id, projectPath, order);
    res.status(204).send();
  } catch (error) {
    if (error instanceof Error && error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Import workspace from .code-workspace file
router.post('/import', (req, res) => {
  try {
    const { workspace_file_path, name } = req.body;

    if (!workspace_file_path) {
      return res.status(400).json({ error: 'workspace_file_path is required' });
    }

    if (!fs.existsSync(workspace_file_path)) {
      return res.status(400).json({ error: 'Workspace file does not exist' });
    }

    if (!validateWorkspacePath(workspace_file_path)) {
      return res.status(400).json({ error: 'Invalid workspace file format' });
    }

    // Parse workspace file to get name if not provided
    const parsed = parseWorkspaceFile(workspace_file_path);
    const workspaceName = name || path.basename(workspace_file_path, '.code-workspace');

    // Check if workspace already exists
    const existingWorkspaces = db.getAllWorkspaces();
    const existing = existingWorkspaces.find(w => w.workspace_file_path === workspace_file_path);
    if (existing) {
      return res.status(409).json({ error: 'Workspace with this file path already exists', workspace: existing });
    }

    // For imported workspaces, we'll keep the original file path
    // But also generate a PROJAX-managed copy for reliability
    const workspace = db.addWorkspace(workspaceName, workspace_file_path, null, []);

    // Add projects from workspace file
    for (const folder of parsed.folders) {
      try {
        db.addProjectToWorkspace(workspace.id, folder.path);
      } catch (error) {
        // Ignore errors for projects that don't exist or are already added
        console.warn(`Failed to add project ${folder.path} to workspace:`, error);
      }
    }

    // Generate PROJAX-managed workspace file as backup
    try {
      const projaxFilePath = getProjaxWorkspaceFilePath(workspace.id, workspace.name);
      const workspaceProjects = db.getWorkspaceProjects(workspace.id);
      const projectPaths = workspaceProjects.map(wp => wp.project_path);
      generateWorkspaceFile(workspace.name, projectPaths, projaxFilePath);
    } catch (error) {
      console.warn('Failed to generate PROJAX workspace file:', error);
    }

    res.status(201).json(workspace);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Create new blank workspace
router.post('/create', (req, res) => {
  try {
    const { name, description, tags, projects } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    // Create workspace in database first (we'll generate the file path after we have the ID)
    // Use a temporary path that will be replaced
    const tempPath = getProjaxWorkspaceFilePath(999999, name);
    const workspace = db.addWorkspace(name, tempPath, description || null, tags || []);

    // Now generate the actual workspace file path with the real ID
    const workspaceFilePath = getProjaxWorkspaceFilePath(workspace.id, workspace.name);

    // Add projects to workspace first
    const projectPaths: string[] = [];
    if (projects && Array.isArray(projects)) {
      for (const projectPath of projects) {
        try {
          const absolutePath = path.isAbsolute(projectPath)
            ? projectPath
            : path.resolve(process.cwd(), projectPath);
          db.addProjectToWorkspace(workspace.id, absolutePath);
          projectPaths.push(absolutePath);
        } catch (error) {
          console.warn(`Failed to add project ${projectPath} to workspace:`, error);
        }
      }
    }

    // Generate workspace file
    generateWorkspaceFile(workspace.name, projectPaths, workspaceFilePath);

    // Update workspace with correct file path
    const updatedWorkspace = db.updateWorkspace(workspace.id, { workspace_file_path: workspaceFilePath });

    res.status(201).json(updatedWorkspace);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Get workspace file path (ensures file exists)
router.get('/:id/file-path', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid workspace ID' });
    }

    const workspaceFilePath = ensureWorkspaceFile(id);
    res.json({ workspace_file_path: workspaceFilePath });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Update workspace file (regenerates it)
router.post('/:id/regenerate-file', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid workspace ID' });
    }

    const workspaceFilePath = ensureWorkspaceFile(id);
    const workspace = db.getWorkspace(id);
    if (workspace) {
      res.json({ workspace_file_path: workspaceFilePath, workspace });
    } else {
      res.status(404).json({ error: 'Workspace not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

export default router;

