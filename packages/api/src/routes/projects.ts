import { Router, Request, Response } from 'express';
import { getDatabase } from '../database';
import { scanProject, scanAllProjects } from '../services/scanner';
import { getCurrentBranch } from '../core-bridge';
import * as path from 'path';
import * as fs from 'fs';

const router: Router = Router();

// GET /api/projects/tags - Get all unique tags
router.get('/tags', (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const tags = db.getAllTags();
    res.json(tags);
  } catch (error) {
    console.error('Error getting tags:', error);
    res.status(500).json({ error: 'Failed to get tags' });
  }
});

// GET /api/projects - List all projects
router.get('/', (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const projects = db.getAllProjects();
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// POST /api/projects - Add a new project
router.post('/', (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const { name, path: projectPath } = req.body;
    
    if (!name || !projectPath) {
      return res.status(400).json({ error: 'Name and path are required' });
    }
    
    const resolvedPath = path.resolve(projectPath);
    
    if (!fs.existsSync(resolvedPath)) {
      return res.status(400).json({ error: 'Path does not exist' });
    }
    
    if (!fs.statSync(resolvedPath).isDirectory()) {
      return res.status(400).json({ error: 'Path must be a directory' });
    }
    
    const existing = db.getProjectByPath(resolvedPath);
    if (existing) {
      return res.status(409).json({ error: 'Project with this path already exists', project: existing });
    }
    
    const project = db.addProject(name, resolvedPath);
    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to add project' });
  }
});

// GET /api/projects/:id - Get project details
// Using regex to only match numeric IDs, allowing /tags to be matched first
router.get('/:id(\\d+)', (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid project ID' });
    }
    
    const project = db.getProject(id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// PUT /api/projects/:id - Update project
router.put('/:id(\\d+)', (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid project ID' });
    }
    
    const { name, description, framework, tags } = req.body;
    
    // Use the updateProject method for partial updates
    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (framework !== undefined) updates.framework = framework;
    if (tags !== undefined) updates.tags = tags;
    
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }
    
    const updated = db.updateProject(id, updates);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to update project' });
  }
});

// DELETE /api/projects/:id - Remove project
router.delete('/:id(\\d+)', (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid project ID' });
    }
    
    const project = db.getProject(id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    db.removeProject(id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove project' });
  }
});

// GET /api/projects/:id/tests - Get tests for project
router.get('/:id(\\d+)/tests', (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid project ID' });
    }
    
    const project = db.getProject(id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    const tests = db.getTestsByProject(id);
    res.json(tests);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tests' });
  }
});

// GET /api/projects/:id/ports - Get project ports
router.get('/:id(\\d+)/ports', (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid project ID' });
    }
    
    const project = db.getProject(id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    const ports = db.getProjectPorts(id);
    res.json(ports);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch ports' });
  }
});

// POST /api/projects/scan/all - Scan all projects
// NOTE: This route must be defined before /:id/scan to avoid route conflicts
router.post('/scan/all', (req: Request, res: Response) => {
  try {
    const results = scanAllProjects();
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to scan projects' });
  }
});

// POST /api/projects/:id/scan - Scan project for tests
router.post('/:id(\\d+)/scan', (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid project ID' });
    }
    
    const result = scanProject(id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to scan project' });
  }
});

// GET /api/projects/:id/test-results - Get test results for a project
router.get('/:id(\\d+)/test-results', (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid project ID' });
    }
    
    const project = db.getProject(id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
    const results = db.getTestResultsByProject(id, limit);
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch test results' });
  }
});

// GET /api/projects/:id/test-results/latest - Get latest test result for a project
router.get('/:id(\\d+)/test-results/latest', (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid project ID' });
    }
    
    const project = db.getProject(id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    const result = db.getLatestTestResult(id);
    if (!result) {
      return res.status(404).json({ error: 'No test results found' });
    }
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch latest test result' });
  }
});

// POST /api/projects/:id/test-results - Add a test result
router.post('/:id(\\d+)/test-results', (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid project ID' });
    }
    
    const project = db.getProject(id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    const { scriptName, passed, failed, skipped, total, duration, coverage, framework, rawOutput } = req.body;
    
    if (scriptName === undefined || passed === undefined || failed === undefined) {
      return res.status(400).json({ error: 'scriptName, passed, and failed are required' });
    }
    
    const result = db.addTestResult(
      id,
      scriptName,
      passed,
      failed,
      skipped || 0,
      total || (passed + failed + (skipped || 0)),
      duration || null,
      coverage || null,
      framework || null,
      rawOutput || null
    );
    
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add test result' });
  }
});

// GET /api/projects/:id/git-branch - Get git branch for a project
router.get('/:id(\\d+)/git-branch', (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid project ID' });
    }
    
    const project = db.getProject(id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    const branch = getCurrentBranch(project.path);
    res.json({ branch });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get git branch' });
  }
});

// GET /api/projects/:id/settings - Get project settings
router.get('/:id(\\d+)/settings', (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const projectId = parseInt(req.params.id, 10);
    if (isNaN(projectId)) {
      return res.status(400).json({ error: 'Invalid project ID' });
    }

    const settings = db.getProjectSettings(projectId);
    if (!settings) {
      return res.json({
        project_id: projectId,
        script_sort_order: 'default',
        updated_at: Math.floor(Date.now() / 1000),
      });
    }

    res.json(settings);
  } catch (error) {
    console.error('Error getting project settings:', error);
    res.status(500).json({ error: 'Failed to get project settings' });
  }
});

// PUT /api/projects/:id/settings - Update project settings
router.put('/:id(\\d+)/settings', (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const projectId = parseInt(req.params.id, 10);
    if (isNaN(projectId)) {
      return res.status(400).json({ error: 'Invalid project ID' });
    }

    const { script_sort_order } = req.body;
    if (script_sort_order && !['default', 'alphabetical', 'last-used'].includes(script_sort_order)) {
      return res.status(400).json({ error: 'Invalid script_sort_order. Must be: default, alphabetical, or last-used' });
    }

    const updates: any = {};
    if (script_sort_order !== undefined) {
      updates.script_sort_order = script_sort_order;
    }

    const settings = db.updateProjectSettings(projectId, updates);
    res.json(settings);
  } catch (error) {
    console.error('Error updating project settings:', error);
    res.status(500).json({ error: 'Failed to update project settings' });
  }
});

// GET /api/projects/:id/safety - Scan project for exposed sensitive files
router.get('/:id(\\d+)/safety', async (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid project ID' });
    }

    const project = db.getProject(id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const { pubsafe } = await import('pubsafe');
    const result = await pubsafe(project.path);

    if (!result.projects || result.projects.length === 0) {
      return res.json({ safe: 0, exposed: 0, missing: 0, items: [], channels: [] });
    }

    const scanned = result.projects[0];
    res.json({
      safe: scanned.summary.safe,
      exposed: scanned.summary.exposed,
      missing: scanned.summary.missing,
      items: scanned.exposed,
      channels: scanned.activeChannels,
    });
  } catch (error) {
    console.error('Error scanning project safety:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to scan project safety' });
  }
});

export default router;

