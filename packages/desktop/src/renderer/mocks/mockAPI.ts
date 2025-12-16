import { mockProjects, mockWorkspaces } from './mockData';

// In-memory state for API mocks
const apiWorkspaces = [...mockWorkspaces];
const apiProjects = [...mockProjects];
const projectSettings = new Map<number, any>();
const workspaceProjects = new Map<number, number[]>(); // workspace_id -> project_ids

// Helper to delay responses
const delay = (ms: number = 200) => new Promise(resolve => setTimeout(resolve, ms));

export const setupMockFetch = () => {
  const originalFetch = window.fetch;

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    
    // Only intercept localhost:3001 API calls
    if (!url.includes('localhost:3001/api') && !url.includes('localhost:3001/health')) {
      return originalFetch(input, init);
    }

    await delay();

    // Parse the URL
    const urlObj = new URL(url, 'http://localhost:3001');
    const path = urlObj.pathname;
    const method = init?.method || 'GET';

    console.log(`[MOCK API] ${method} ${path}`);

    // Handle different API endpoints
    if (path === '/api/workspaces' && method === 'GET') {
      return new Response(JSON.stringify(apiWorkspaces), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (path === '/api/workspaces/create' && method === 'POST') {
      const body = JSON.parse(init?.body as string || '{}');
      const newWorkspace = {
        id: Math.max(...apiWorkspaces.map(w => w.id), 0) + 1,
        ...body,
        created_at: Date.now(),
      };
      apiWorkspaces.push(newWorkspace);
      return new Response(JSON.stringify(newWorkspace), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (path === '/api/workspaces/import' && method === 'POST') {
      const body = JSON.parse(init?.body as string || '{}');
      // Mock import logic
      return new Response(JSON.stringify({ success: true, imported: 1 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (path.startsWith('/api/workspaces/') && path.endsWith('/projects') && method === 'GET') {
      const workspaceId = parseInt(path.split('/')[3]);
      const projectIds = workspaceProjects.get(workspaceId) || [];
      const projects = apiProjects.filter(p => projectIds.includes(p.id));
      return new Response(JSON.stringify(projects), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (path.startsWith('/api/workspaces/') && method === 'PUT') {
      const workspaceId = parseInt(path.split('/')[3]);
      const body = JSON.parse(init?.body as string || '{}');
      const workspace = apiWorkspaces.find(w => w.id === workspaceId);
      if (workspace) {
        Object.assign(workspace, body);
        return new Response(JSON.stringify(workspace), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
    }

    if (path.startsWith('/api/workspaces/') && method === 'DELETE') {
      const workspaceId = parseInt(path.split('/')[3]);
      apiWorkspaces = apiWorkspaces.filter(w => w.id !== workspaceId);
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (path === '/api/projects/tags' && method === 'GET') {
      const allTags = new Set<string>();
      apiProjects.forEach(p => {
        (p.tags || []).forEach((tag: string) => allTags.add(tag));
      });
      return new Response(JSON.stringify(Array.from(allTags)), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (path.startsWith('/api/projects/') && path.endsWith('/settings') && method === 'GET') {
      const projectId = parseInt(path.split('/')[3]);
      const settings = projectSettings.get(projectId) || { script_sort_order: 'default' };
      return new Response(JSON.stringify(settings), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (path.startsWith('/api/projects/') && path.endsWith('/settings') && method === 'PUT') {
      const projectId = parseInt(path.split('/')[3]);
      const body = JSON.parse(init?.body as string || '{}');
      projectSettings.set(projectId, body);
      return new Response(JSON.stringify(body), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (path.startsWith('/api/projects/') && path.endsWith('/git-branch') && method === 'GET') {
      const projectId = parseInt(path.split('/')[3]);
      const branches = ['main', 'develop', 'feature/new-feature'];
      return new Response(JSON.stringify({ branch: branches[projectId % branches.length] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Health check
    if (path === '/health') {
      return new Response(JSON.stringify({ status: 'ok' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Default: return 404
    console.warn(`[MOCK API] Unhandled route: ${method} ${path}`);
    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  };
};

