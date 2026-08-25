import * as path from 'path';

type OctopusModule = typeof import('projax-octopus');

let cachedOctopus: OctopusModule | null = null;

function tryRequire(candidate: string): OctopusModule | null {
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

function loadOctopus(): OctopusModule {
  if (cachedOctopus) {
    return cachedOctopus;
  }

  const candidates = [
    path.join(__dirname, 'octopus', 'index.js'),
    path.join(__dirname, 'octopus'),
    path.join(__dirname, '..', 'octopus', 'dist', 'index.js'),
    path.join(__dirname, '..', 'octopus', 'dist'),
    path.join(__dirname, '..', '..', 'octopus', 'dist', 'index.js'),
    path.join(__dirname, '..', '..', 'octopus', 'dist'),
    'projax-octopus', 
  ];

  for (const candidate of candidates) {
    const mod = tryRequire(candidate);
    if (mod) {
      cachedOctopus = mod;
      return mod;
    }
  }

  throw new Error(`Unable to load projax octopus module. Tried locations: ${candidates.join(', ')}`);
}

const octopus = loadOctopus();

export const {
  runAgent,
  AgentStatus
} = octopus;

export type { Agent, Worktree } from 'projax-octopus';
