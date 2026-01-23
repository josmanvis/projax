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

// PUT /api/settings - Update global settings (bulk)
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

// PUT /api/settings/:key - Update a single setting
router.put('/:key', (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const { key } = req.params;
    const { value } = req.body;

    if (value === undefined) {
      return res.status(400).json({ error: 'Value is required' });
    }

    // Convert value to string for storage
    const stringValue = String(value);
    db.setSetting(key, stringValue);

    // Return the setting (with original value type for API response)
    res.json({ key, value });
  } catch (error) {
    console.error('Error updating setting:', error);
    res.status(500).json({ error: 'Failed to update setting' });
  }
});

export default router;
