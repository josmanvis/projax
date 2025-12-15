import * as path from 'path';

// NOTE: projax-core is a workspace alias (not an npm scoped package)
// pnpm resolves this via the "workspace:*" dependency in package.json
// to the local packages/core package
type CoreModule = typeof import('projax-core');

let cachedCore: CoreModule | null = null;

function tryRequire(candidate: string): CoreModule | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
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

function resolveCore(): CoreModule {
  if (cachedCore) {
    return cachedCore;
  }

  // Try multiple locations to find the projax-core module
  // 1. Local dist/core (copied during build)
  // 2. Workspace root packages/core/dist (development)
  // 3. Workspace alias 'projax-core' (resolved by pnpm via workspace:*)
  const candidates = [
    path.join(__dirname, 'core', 'index.js'),
    path.join(__dirname, 'core'),
    path.join(__dirname, '..', '..', 'core', 'dist', 'index.js'),
    path.join(__dirname, '..', '..', 'core', 'dist'),
    path.join(__dirname, '..', 'core', 'dist', 'index.js'),
    path.join(__dirname, '..', 'core', 'dist'),
    'projax-core', // Workspace alias - pnpm resolves this to packages/core
  ];

  for (const candidate of candidates) {
    const mod = tryRequire(candidate);
    if (mod) {
      cachedCore = mod;
      return mod;
    }
  }

  throw new Error(
    `Unable to load projax core module. Tried locations: ${candidates.join(', ')}`
  );
}

const core = resolveCore();

export const {
  getDatabaseManager,
  addProject,
  removeProject,
  getAllProjects,
  scanProject,
  scanAllProjects,
  getTestsByProject,
} = core;

export type { Project, Test, ProjectPort, JenkinsJob } from 'projax-core';

