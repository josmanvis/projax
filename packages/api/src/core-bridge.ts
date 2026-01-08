import * as path from 'path';

// Dynamic loader for projax-core that works both in development (workspace alias)
// and when installed from npm (core files copied to dist/core)

let cachedCore: any = null;

function tryRequire(candidate: string): any {
  try {
    return require(candidate);
  } catch (error) {
    // Handle both Node's MODULE_NOT_FOUND and Jest's resolver errors
    if (error instanceof Error) {
      const message = error.message || '';
      const code = (error as NodeJS.ErrnoException).code;
      if (code === 'MODULE_NOT_FOUND' || message.includes('Cannot find module')) {
        return null;
      }
    }
    throw error;
  }
}

function loadCore(): any {
  if (cachedCore) {
    return cachedCore;
  }

  // Try multiple locations to find the projax-core module
  // When API is copied to CLI's dist/api/, core is at dist/core/
  // In development (or tests), workspace alias resolves to packages/core
  const candidates = [
    // For CLI dist: dist/api/../core
    path.join(__dirname, '..', 'core', 'index.js'),
    path.join(__dirname, '..', 'core'),
    // For development from packages/api/dist: go up to packages/, then core/dist
    path.join(__dirname, '..', '..', 'core', 'dist'),
    path.join(__dirname, '..', '..', 'core', 'dist', 'index.js'),
    // For tests from packages/api/src: go up to packages/, then core/dist
    path.join(__dirname, '..', '..', '..', 'core', 'dist'),
    path.join(__dirname, '..', '..', '..', 'core', 'dist', 'index.js'),
    // Workspace alias (pnpm resolves to packages/core)
    'projax-core',
  ];

  for (const candidate of candidates) {
    const mod = tryRequire(candidate);
    if (mod) {
      cachedCore = mod;
      return mod;
    }
  }

  throw new Error(`Unable to load projax core module. Tried locations: ${candidates.join(', ')}`);
}

const core = loadCore();

// Re-export functions used by API routes
export const getCurrentBranch: typeof import('projax-core').getCurrentBranch = core.getCurrentBranch;
export const parseWorkspaceFile: typeof import('projax-core').parseWorkspaceFile = core.parseWorkspaceFile;
export const generateWorkspaceFile: typeof import('projax-core').generateWorkspaceFile = core.generateWorkspaceFile;
export const validateWorkspacePath: typeof import('projax-core').validateWorkspacePath = core.validateWorkspacePath;
export const createBackup: typeof import('projax-core').createBackup = core.createBackup;
export const restoreBackup: typeof import('projax-core').restoreBackup = core.restoreBackup;
export const validateBackup: typeof import('projax-core').validateBackup = core.validateBackup;
