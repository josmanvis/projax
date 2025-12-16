import { Router, Request, Response } from 'express';
import { getDatabase } from '../database';

const router: Router = Router();

// GET /api/settings - Get all global settings
router.get('/', (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const settings = db.getAllSettings();
    res.json(settings);
  } catch (error) {
    console.error('Error getting settings:', error);
    res.status(500).json({ error: 'Failed to get settings' });
  }
});

// PUT /api/settings - Update global settings
router.put('/', (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const settings = req.body;
    
    // Update each setting
    for (const [key, value] of Object.entries(settings)) {
      if (typeof value === 'string') {
        db.setSetting(key, value);
      }
    }
    
    // Return all settings
    const updatedSettings = db.getAllSettings();
    res.json(updatedSettings);
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// GET /api/projects/:id/settings - Get project settings
router.get('/projects/:id/settings', (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const projectId = parseInt(req.params.id, 10);
    
    if (isNaN(projectId)) {
      return res.status(400).json({ error: 'Invalid project ID' });
    }

    const settings = db.getProjectSettings(projectId);
    
    if (!settings) {
      // Return default settings if none exist
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
router.put('/projects/:id/settings', (req: Request, res: Response) => {
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

export default router;
