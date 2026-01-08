import { Router, Request, Response } from 'express';
import { createBackup, restoreBackup, validateBackup } from '../core-bridge';
const router: Router = Router();

// POST /api/backup/create - Create backup
router.post('/create', async (req: Request, res: Response) => {
  try {
    const { output_path } = req.body;
    
    if (!output_path) {
      return res.status(400).json({ error: 'output_path is required' });
    }

    const backupPath = await createBackup(output_path);
    res.json({ success: true, backup_path: backupPath });
  } catch (error) {
    console.error('Error creating backup:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to create backup' });
  }
});

// POST /api/backup/restore - Restore from backup
router.post('/restore', async (req: Request, res: Response) => {
  try {
    const { backup_path } = req.body;
    
    if (!backup_path) {
      return res.status(400).json({ error: 'backup_path is required' });
    }

    await restoreBackup(backup_path);
    res.json({ success: true, message: 'Backup restored successfully' });
  } catch (error) {
    console.error('Error restoring backup:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to restore backup' });
  }
});

// GET /api/backup/validate - Validate backup file
router.get('/validate', async (req: Request, res: Response) => {
  try {
    const { backup_path } = req.query;
    
    if (!backup_path || typeof backup_path !== 'string') {
      return res.status(400).json({ error: 'backup_path query parameter is required' });
    }

    await validateBackup(backup_path);
    res.json({ valid: true, message: 'Backup file is valid' });
  } catch (error) {
    res.status(400).json({ valid: false, error: error instanceof Error ? error.message : 'Invalid backup file' });
  }
});

export default router;

