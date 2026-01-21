// Mock data for browser development
export const mockProjects = [
  {
    id: 1,
    name: 'My React App',
    path: '/Users/dev/my-react-app',
    description: 'A modern React application with TypeScript',
    tags: ['react', 'typescript', 'frontend'],
    framework: 'react',
    last_scanned: Date.now() - 8640000, // 1 day ago
    created_at: Date.now() - 86400000 * 30, // 30 days ago
  },
  {
    id: 2,
    name: 'Node API Server',
    path: '/Users/dev/node-api',
    description: 'RESTful API built with Express',
    tags: ['node', 'express', 'backend', 'api'],
    framework: 'node',
    last_scanned: Date.now() - 864000, // 10 hours ago
    created_at: Date.now() - 86400000 * 60, // 60 days ago
  },
  {
    id: 3,
    name: 'Vue Dashboard',
    path: '/Users/dev/vue-dashboard',
    description: 'Admin dashboard built with Vue 3',
    tags: ['vue', 'frontend', 'dashboard'],
    framework: 'vue',
    last_scanned: Date.now() - 3600000, // 1 hour ago
    created_at: Date.now() - 86400000 * 15, // 15 days ago
  },
];

export const mockWorkspaces = [
  {
    id: 1,
    name: 'Frontend Projects',
    description: 'All frontend-related projects',
    tags: ['frontend'],
    created_at: Date.now() - 86400000 * 20,
  },
  {
    id: 2,
    name: 'Backend Services',
    description: 'API and microservices',
    tags: ['backend', 'api'],
    created_at: Date.now() - 86400000 * 45,
  },
];

export const mockRunningProcesses = [
  {
    pid: 12345,
    projectPath: '/Users/dev/my-react-app',
    projectName: 'My React App',
    scriptName: 'dev',
    command: 'npm run dev',
    startedAt: Date.now() - 3600000, // 1 hour ago
    logFile: '/tmp/projax-12345.log',
    detectedUrls: ['http://localhost:3000'],
    detectedPorts: [3000],
  },
];

export const mockProjectScripts = {
  type: 'npm',
  scripts: [
    { name: 'dev', command: 'vite', runner: 'npm', projectType: 'react' },
    { name: 'build', command: 'vite build', runner: 'npm', projectType: 'react' },
    { name: 'test', command: 'vitest', runner: 'npm', projectType: 'react' },
    { name: 'lint', command: 'eslint .', runner: 'npm', projectType: 'react' },
  ],
};

export const mockProjectPorts = [
  {
    id: 1,
    project_id: 1,
    port: 3000,
    script_name: 'dev',
    config_source: 'package.json',
    last_detected: Date.now() - 300000, // 5 minutes ago
    created_at: Date.now() - 86400000,
  },
];

export const mockTests = [
  {
    id: 1,
    project_id: 1,
    file_path: '/Users/dev/my-react-app/src/App.test.tsx',
    framework: 'vitest',
    status: null,
    last_run: null,
    created_at: Date.now() - 86400000 * 5, // 5 days ago
  },
  {
    id: 2,
    project_id: 1,
    file_path: '/Users/dev/my-react-app/src/components/Button.test.tsx',
    framework: 'vitest',
    status: null,
    last_run: null,
    created_at: Date.now() - 86400000 * 5, // 5 days ago
  },
];

