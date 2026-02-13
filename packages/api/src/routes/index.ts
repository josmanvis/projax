import { Router } from 'express';
import projectsRouter from './projects';
import settingsRouter from './settings';
import workspacesRouter from './workspaces';
import backupRouter from './backup';
import agentsRouter from './agents';

const router: Router = Router();

router.use('/projects', projectsRouter);
router.use('/settings', settingsRouter);
router.use('/workspaces', workspacesRouter);
router.use('/backup', backupRouter);
router.use('/', agentsRouter); // Mounts both /projects/:id/agents and /agents routes

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;

