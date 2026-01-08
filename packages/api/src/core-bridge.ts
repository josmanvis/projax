import * as path from 'path';

// Dynamic loader for projax-core that works both in development (workspace alias)
// and when installed from npm (core files copied to dist/core)

let cachedCore: any = null;

function tryRequire(candidate: string): any {
  try {
    return require(candidate);
  } catch (error) {
    if (
      !(error instanceof Error) ||
      !('code' in error) ||
      (error as NodeJS.ErrnoException).code !== 'MODULE_NOT_FOUND'
    ) {
      throw error;
    }
    return null;
  }
}

function loadCore(): any {
  if (cachedCore) {
    return cachedCore;
  }

  // Try multiple locations to find the projax-core module
  // When API is copied to CLI's dist/api/, core is at dist/core/
  // In development, workspace alias resolves to packages/core
  const candidates = [
    path.join(__dirname, '..', 'core', 'index.js'),       // dist/api/../core (CLI dist)
    path.join(__dirname, '..', 'core'),                   // dist/api/../core (CLI dist)
    path.join(__dirname, '..', '..', 'core', 'dist'),     // packages/api/dist -> packages/core/dist
    path.join(__dirname, '..', '..', '..', 'core', 'dist'), // packages/api/src -> packages/core/dist
    'projax-core',                                         // Workspace alias (development)
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
