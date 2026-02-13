import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import { DatabaseSchema, Project, Test, JenkinsJob, ProjectPort, TestResult, Workspace, WorkspaceProject, ProjectSettings, Agent, AgentCliType } from './types';

const defaultData: DatabaseSchema = {
  projects: [],
  tests: [],
  jenkins_jobs: [],
  project_ports: [],
  test_results: [],
  settings: [],
  workspaces: [],
  workspace_projects: [],
  project_settings: [],
  agents: [],
};

class JSONDatabase {
  private data: DatabaseSchema;
  private dbPath: string;

  constructor() {
    const dataDir = path.join(os.homedir(), '.projax');
    
    // Ensure data directory exists
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    this.dbPath = path.join(dataDir, 'data.json');
    
    // Load data from file or use defaults
    if (fs.existsSync(this.dbPath)) {
      try {
        const fileContent = fs.readFileSync(this.dbPath, 'utf-8');
        this.data = JSON.parse(fileContent);
        // Migrate/validate loaded data to ensure type safety
        this.migrateData();
      } catch (error) {
        console.error('Error reading database file, using defaults:', error);
        this.data = JSON.parse(JSON.stringify(defaultData));
        this.write();
      }
    } else {
      this.data = JSON.parse(JSON.stringify(defaultData));
      this.write();
    }
  }

  /**
   * Migrate and validate loaded data to ensure compatibility with current schema.
   * This ensures that projects loaded from older database versions have all required fields.
   */
  private migrateData(): void {
    let needsWrite = false;
    
    // Ensure all projects have the framework, description, tags, and git_branch fields
    if (this.data.projects) {
      for (const project of this.data.projects) {
        if (project.framework === undefined) {
          project.framework = null;
          needsWrite = true;
        }
        if (project.description === undefined) {
          project.description = null;
          needsWrite = true;
        }
        if (project.tags === undefined) {
          project.tags = [];
          needsWrite = true;
        }
        if (project.git_branch === undefined) {
          project.git_branch = null;
          needsWrite = true;
        }
      }
    }
    
    // Ensure all required top-level arrays exist
    if (!this.data.tests) {
      this.data.tests = [];
      needsWrite = true;
    }
    if (!this.data.jenkins_jobs) {
      this.data.jenkins_jobs = [];
      needsWrite = true;
    }
    if (!this.data.project_ports) {
      this.data.project_ports = [];
      needsWrite = true;
    }
    if (!this.data.test_results) {
      this.data.test_results = [];
      needsWrite = true;
    }
    if (!this.data.settings) {
      this.data.settings = [];
      needsWrite = true;
    }
    if (!this.data.workspaces) {
      this.data.workspaces = [];
      needsWrite = true;
    }
    if (!this.data.workspace_projects) {
      this.data.workspace_projects = [];
      needsWrite = true;
    }
    if (!this.data.project_settings) {
      this.data.project_settings = [];
      needsWrite = true;
    }
    if (!this.data.agents) {
      this.data.agents = [];
      needsWrite = true;
    }

    // Write migrated data back to disk if any changes were made
    if (needsWrite) {
      this.write();
    }
  }

  private write(): void {
    try {
      fs.writeFileSync(this.dbPath, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (error) {
      console.error('Error writing database file:', error);
    }
  }

  // Project operations
  addProject(name: string, projectPath: string): Project {
    const projects = this.data.projects;
    
    // Check if project with same path already exists
    const existing = projects.find(p => p.path === projectPath);
    if (existing) {
      throw new Error('Project with this path already exists');
    }
    
    const newId = projects.length > 0 
      ? Math.max(...projects.map(p => p.id)) + 1 
      : 1;
    
    const project: Project = {
      id: newId,
      name,
      path: projectPath,
      description: null,
      framework: null,  // Will be detected on first scan
      last_scanned: null,
      created_at: Math.floor(Date.now() / 1000),
      tags: [],
    };
    
    projects.push(project);
    this.write();
    return project;
  }
  
  getAllTags(): string[] {
    const tagsSet = new Set<string>();
    for (const project of this.data.projects) {
      if (project.tags) {
        for (const tag of project.tags) {
          tagsSet.add(tag);
        }
      }
    }
    return Array.from(tagsSet).sort();
  }

  getProject(id: number): Project | null {
    return this.data.projects.find(p => p.id === id) || null;
  }

  getProjectByPath(projectPath: string): Project | null {
    return this.data.projects.find(p => p.path === projectPath) || null;
  }

  getAllProjects(): Project[] {
    return [...this.data.projects].sort((a, b) => a.id - b.id);
  }

  updateProjectLastScanned(id: number): void {
    const project = this.data.projects.find(p => p.id === id);
    if (project) {
      project.last_scanned = Math.floor(Date.now() / 1000);
      this.write();
    }
  }

  updateProjectName(id: number, newName: string): Project {
    const project = this.data.projects.find(p => p.id === id);
    if (!project) {
      throw new Error('Project not found');
    }
    project.name = newName;
    this.write();
    return project;
  }

  updateProject(id: number, updates: Partial<Omit<Project, 'id' | 'created_at'>>): Project {
    const project = this.data.projects.find(p => p.id === id);
    if (!project) {
      throw new Error('Project not found');
    }
    
    if (updates.name !== undefined) project.name = updates.name;
    if (updates.path !== undefined) project.path = updates.path;
    if (updates.description !== undefined) project.description = updates.description;
    if (updates.framework !== undefined) project.framework = updates.framework;
    if (updates.last_scanned !== undefined) project.last_scanned = updates.last_scanned;
    if (updates.tags !== undefined) project.tags = updates.tags;
    
    this.write();
    return project;
  }

  removeProject(id: number): void {
    this.data.projects = this.data.projects.filter(p => p.id !== id);
    // Also remove related data
    this.data.tests = this.data.tests.filter(t => t.project_id !== id);
    this.data.jenkins_jobs = this.data.jenkins_jobs.filter(j => j.project_id !== id);
    this.data.project_ports = this.data.project_ports.filter(p => p.project_id !== id);
    this.data.test_results = this.data.test_results.filter(r => r.project_id !== id);
    this.data.agents = this.data.agents.filter(a => a.project_id !== id);
    this.write();
  }

  // Test operations
  addTest(projectId: number, filePath: string, framework: string | null = null): Test {
    const tests = this.data.tests;
    
    // Check if test already exists
    const existing = tests.find(t => t.project_id === projectId && t.file_path === filePath);
    if (existing) {
      existing.framework = framework;
      this.write();
      return existing;
    }
    
    const newId = tests.length > 0 
      ? Math.max(...tests.map(t => t.id)) + 1 
      : 1;
    
    const test: Test = {
      id: newId,
      project_id: projectId,
      file_path: filePath,
      framework,
      status: null,
      last_run: null,
      created_at: Math.floor(Date.now() / 1000),
    };
    
    tests.push(test);
    this.write();
    return test;
  }

  getTest(id: number): Test | null {
    
    return this.data.tests.find(t => t.id === id) || null;
  }

  getTestsByProject(projectId: number): Test[] {
    
    return this.data.tests
      .filter(t => t.project_id === projectId)
      .sort((a, b) => a.file_path.localeCompare(b.file_path));
  }

  removeTestsByProject(projectId: number): void {
    
    this.data.tests = this.data.tests.filter(t => t.project_id !== projectId);
    this.write();
  }

  // Test Result operations
  addTestResult(
    projectId: number,
    scriptName: string,
    passed: number,
    failed: number,
    skipped: number = 0,
    total: number = passed + failed + skipped,
    duration: number | null = null,
    coverage: number | null = null,
    framework: string | null = null,
    rawOutput: string | null = null
  ): TestResult {
    const results = this.data.test_results;
    
    const newId = results.length > 0 
      ? Math.max(...results.map(r => r.id)) + 1 
      : 1;
    
    const testResult: TestResult = {
      id: newId,
      project_id: projectId,
      script_name: scriptName,
      framework,
      passed,
      failed,
      skipped,
      total,
      duration,
      coverage,
      timestamp: Math.floor(Date.now() / 1000),
      raw_output: rawOutput,
    };
    
    results.push(testResult);
    this.write();
    return testResult;
  }

  getTestResult(id: number): TestResult | null {
    return this.data.test_results.find(r => r.id === id) || null;
  }

  getLatestTestResult(projectId: number): TestResult | null {
    const projectResults = this.data.test_results
      .filter(r => r.project_id === projectId)
      .sort((a, b) => b.timestamp - a.timestamp);
    
    return projectResults.length > 0 ? projectResults[0] : null;
  }

  getTestResultsByProject(projectId: number, limit: number = 10): TestResult[] {
    return this.data.test_results
      .filter(r => r.project_id === projectId)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  removeTestResultsByProject(projectId: number): void {
    this.data.test_results = this.data.test_results.filter(r => r.project_id !== projectId);
    this.write();
  }

  // Jenkins operations
  addJenkinsJob(projectId: number, jobName: string, jobUrl: string): JenkinsJob {
    
    const jobs = this.data.jenkins_jobs;
    
    // Check if job already exists
    const existing = jobs.find(j => j.project_id === projectId && j.job_name === jobName);
    if (existing) {
      existing.job_url = jobUrl;
      this.write();
      return existing;
    }
    
    const newId = jobs.length > 0 
      ? Math.max(...jobs.map(j => j.id)) + 1 
      : 1;
    
    const job: JenkinsJob = {
      id: newId,
      project_id: projectId,
      job_name: jobName,
      job_url: jobUrl,
      last_build_status: null,
      last_build_number: null,
      last_updated: null,
      created_at: Math.floor(Date.now() / 1000),
    };
    
    jobs.push(job);
    this.write();
    return job;
  }

  getJenkinsJob(id: number): JenkinsJob | null {
    
    return this.data.jenkins_jobs.find(j => j.id === id) || null;
  }

  getJenkinsJobsByProject(projectId: number): JenkinsJob[] {
    
    return this.data.jenkins_jobs
      .filter(j => j.project_id === projectId)
      .sort((a, b) => a.job_name.localeCompare(b.job_name));
  }

  // Project port operations
  addProjectPort(
    projectId: number,
    port: number,
    configSource: string,
    scriptName: string | null = null
  ): ProjectPort {
    
    const ports = this.data.project_ports;
    
    // Check if port already exists for this project/script combination
    const existing = ports.find(
      p => p.project_id === projectId && 
           p.port === port && 
           ((p.script_name === scriptName) || (p.script_name === null && scriptName === null))
    );
    
    if (existing) {
      existing.config_source = configSource;
      existing.last_detected = Math.floor(Date.now() / 1000);
      this.write();
      return existing;
    }
    
    const newId = ports.length > 0 
      ? Math.max(...ports.map(p => p.id)) + 1 
      : 1;
    
    const projectPort: ProjectPort = {
      id: newId,
      project_id: projectId,
      port,
      script_name: scriptName,
      config_source: configSource,
      last_detected: Math.floor(Date.now() / 1000),
      created_at: Math.floor(Date.now() / 1000),
    };
    
    ports.push(projectPort);
    this.write();
    return projectPort;
  }

  getProjectPort(id: number): ProjectPort | null {
    
    return this.data.project_ports.find(p => p.id === id) || null;
  }

  getProjectPorts(projectId: number): ProjectPort[] {
    
    return this.data.project_ports
      .filter(p => p.project_id === projectId)
      .sort((a, b) => a.port - b.port);
  }

  getProjectPortsByScript(projectId: number, scriptName: string): ProjectPort[] {
    
    return this.data.project_ports
      .filter(p => p.project_id === projectId && p.script_name === scriptName)
      .sort((a, b) => a.port - b.port);
  }

  removeProjectPorts(projectId: number): void {
    
    this.data.project_ports = this.data.project_ports.filter(p => p.project_id !== projectId);
    this.write();
  }

  updateProjectPortLastDetected(projectId: number, port: number, scriptName: string | null): void {
    
    const projectPort = this.data.project_ports.find(
      p => p.project_id === projectId && 
           p.port === port && 
           ((p.script_name === scriptName) || (p.script_name === null && scriptName === null))
    );
    if (projectPort) {
      projectPort.last_detected = Math.floor(Date.now() / 1000);
      this.write();
    }
  }

  // Settings operations
  getSetting(key: string): string | null {
    
    const setting = this.data.settings.find(s => s.key === key);
    return setting ? setting.value : null;
  }

  setSetting(key: string, value: string): void {
    
    const existing = this.data.settings.find(s => s.key === key);
    if (existing) {
      existing.value = value;
      existing.updated_at = Math.floor(Date.now() / 1000);
    } else {
      this.data.settings.push({
        key,
        value,
        updated_at: Math.floor(Date.now() / 1000),
      });
    }
    this.write();
  }

  getAllSettings(): Record<string, string> {
    
    const settings: Record<string, string> = {};
    for (const setting of this.data.settings) {
      settings[setting.key] = setting.value;
    }
    return settings;
  }

  // Workspace operations
  addWorkspace(name: string, workspaceFilePath: string, description: string | null = null, tags: string[] = []): Workspace {
    const workspaces = this.data.workspaces;
    
    // Check if workspace with same file path already exists
    const existing = workspaces.find(w => w.workspace_file_path === workspaceFilePath);
    if (existing) {
      throw new Error('Workspace with this file path already exists');
    }
    
    const newId = workspaces.length > 0 
      ? Math.max(...workspaces.map(w => w.id)) + 1 
      : 1;
    
    const workspace: Workspace = {
      id: newId,
      name,
      workspace_file_path: workspaceFilePath,
      description,
      tags: tags || [],
      created_at: Math.floor(Date.now() / 1000),
      last_opened: null,
    };
    
    workspaces.push(workspace);
    this.write();
    return workspace;
  }

  getWorkspace(id: number): Workspace | null {
    return this.data.workspaces.find(w => w.id === id) || null;
  }

  getAllWorkspaces(): Workspace[] {
    return [...this.data.workspaces];
  }

  updateWorkspace(id: number, updates: Partial<Omit<Workspace, 'id' | 'created_at'>>): Workspace {
    const workspace = this.data.workspaces.find(w => w.id === id);
    if (!workspace) {
      throw new Error('Workspace not found');
    }
    
    Object.assign(workspace, updates);
    this.write();
    return workspace;
  }

  removeWorkspace(id: number): void {
    const index = this.data.workspaces.findIndex(w => w.id === id);
    if (index === -1) {
      throw new Error('Workspace not found');
    }
    
    // Remove associated workspace projects
    this.data.workspace_projects = this.data.workspace_projects.filter(wp => wp.workspace_id !== id);
    
    this.data.workspaces.splice(index, 1);
    this.write();
  }

  // WorkspaceProject operations
  addProjectToWorkspace(workspaceId: number, projectPath: string): WorkspaceProject {
    const workspaceProjects = this.data.workspace_projects.filter(wp => wp.workspace_id === workspaceId);
    
    // Check if project already in workspace
    const existing = workspaceProjects.find(wp => wp.project_path === projectPath);
    if (existing) {
      throw new Error('Project already in workspace');
    }
    
    const newId = this.data.workspace_projects.length > 0
      ? Math.max(...this.data.workspace_projects.map(wp => wp.id)) + 1
      : 1;
    
    const maxOrder = workspaceProjects.length > 0
      ? Math.max(...workspaceProjects.map(wp => wp.order))
      : -1;
    
    const workspaceProject: WorkspaceProject = {
      id: newId,
      workspace_id: workspaceId,
      project_path: projectPath,
      order: maxOrder + 1,
      created_at: Math.floor(Date.now() / 1000),
    };
    
    this.data.workspace_projects.push(workspaceProject);
    this.write();
    return workspaceProject;
  }

  getWorkspaceProjects(workspaceId: number): WorkspaceProject[] {
    return this.data.workspace_projects
      .filter(wp => wp.workspace_id === workspaceId)
      .sort((a, b) => a.order - b.order);
  }

  removeProjectFromWorkspace(workspaceId: number, projectPath: string): void {
    const index = this.data.workspace_projects.findIndex(
      wp => wp.workspace_id === workspaceId && wp.project_path === projectPath
    );
    if (index === -1) {
      throw new Error('Project not found in workspace');
    }
    
    this.data.workspace_projects.splice(index, 1);
    this.write();
  }

  updateWorkspaceProjectOrder(workspaceId: number, projectPath: string, newOrder: number): void {
    const workspaceProject = this.data.workspace_projects.find(
      wp => wp.workspace_id === workspaceId && wp.project_path === projectPath
    );
    if (!workspaceProject) {
      throw new Error('Project not found in workspace');
    }
    
    workspaceProject.order = newOrder;
    this.write();
  }

  // ProjectSettings operations
  getProjectSettings(projectId: number): ProjectSettings | null {
    return this.data.project_settings.find(ps => ps.project_id === projectId) || null;
  }

  updateProjectSettings(projectId: number, updates: Partial<Omit<ProjectSettings, 'id' | 'project_id' | 'created_at'>>): ProjectSettings {
    let settings = this.data.project_settings.find(ps => ps.project_id === projectId);

    if (!settings) {
      // Create new settings if they don't exist
      const newId = this.data.project_settings.length > 0
        ? Math.max(...this.data.project_settings.map(ps => ps.id)) + 1
        : 1;

      settings = {
        id: newId,
        project_id: projectId,
        script_sort_order: 'default',
        updated_at: Math.floor(Date.now() / 1000),
      };
      this.data.project_settings.push(settings);
    }

    Object.assign(settings, updates);
    settings.updated_at = Math.floor(Date.now() / 1000);
    this.write();
    return settings;
  }

  // Agent operations
  addAgent(
    projectId: number,
    data: {
      name: string;
      cli_type: AgentCliType;
      cli_command?: string | null;
      model?: string | null;
      api_key?: string | null;
      system_prompt?: string | null;
      temperature?: number | null;
      max_tokens?: number | null;
      additional_args?: string | null;
    }
  ): Agent {
    const agents = this.data.agents;

    // Check if agent with same name already exists for this project
    const existing = agents.find(a => a.project_id === projectId && a.name === data.name);
    if (existing) {
      throw new Error('Agent with this name already exists for this project');
    }

    const newId = agents.length > 0
      ? Math.max(...agents.map(a => a.id)) + 1
      : 1;

    const now = Math.floor(Date.now() / 1000);
    const agent: Agent = {
      id: newId,
      project_id: projectId,
      name: data.name,
      cli_type: data.cli_type,
      cli_command: data.cli_command ?? null,
      model: data.model ?? null,
      api_key: data.api_key ?? null,
      system_prompt: data.system_prompt ?? null,
      temperature: data.temperature ?? null,
      max_tokens: data.max_tokens ?? null,
      additional_args: data.additional_args ?? null,
      created_at: now,
      updated_at: now,
    };

    agents.push(agent);
    this.write();
    return agent;
  }

  getAgent(id: number): Agent | null {
    return this.data.agents.find(a => a.id === id) || null;
  }

  getAgentsByProject(projectId: number): Agent[] {
    return this.data.agents
      .filter(a => a.project_id === projectId)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  getAllAgents(): Agent[] {
    return [...this.data.agents].sort((a, b) => a.name.localeCompare(b.name));
  }

  updateAgent(
    id: number,
    updates: Partial<Omit<Agent, 'id' | 'project_id' | 'created_at' | 'updated_at'>>
  ): Agent {
    const agent = this.data.agents.find(a => a.id === id);
    if (!agent) {
      throw new Error('Agent not found');
    }

    // Check for name conflict if name is being updated
    if (updates.name !== undefined && updates.name !== agent.name) {
      const nameConflict = this.data.agents.find(
        a => a.project_id === agent.project_id && a.name === updates.name && a.id !== id
      );
      if (nameConflict) {
        throw new Error('Agent with this name already exists for this project');
      }
    }

    if (updates.name !== undefined) agent.name = updates.name;
    if (updates.cli_type !== undefined) agent.cli_type = updates.cli_type;
    if (updates.cli_command !== undefined) agent.cli_command = updates.cli_command;
    if (updates.model !== undefined) agent.model = updates.model;
    if (updates.api_key !== undefined) agent.api_key = updates.api_key;
    if (updates.system_prompt !== undefined) agent.system_prompt = updates.system_prompt;
    if (updates.temperature !== undefined) agent.temperature = updates.temperature;
    if (updates.max_tokens !== undefined) agent.max_tokens = updates.max_tokens;
    if (updates.additional_args !== undefined) agent.additional_args = updates.additional_args;

    agent.updated_at = Math.floor(Date.now() / 1000);
    this.write();
    return agent;
  }

  removeAgent(id: number): void {
    const index = this.data.agents.findIndex(a => a.id === id);
    if (index === -1) {
      throw new Error('Agent not found');
    }

    this.data.agents.splice(index, 1);
    this.write();
  }

  removeAgentsByProject(projectId: number): void {
    this.data.agents = this.data.agents.filter(a => a.project_id !== projectId);
    this.write();
  }
}

// Singleton instance
let dbInstance: JSONDatabase | null = null;

export function getDatabase(): JSONDatabase {
  if (!dbInstance) {
    dbInstance = new JSONDatabase();
  }
  return dbInstance;
}

export function resetDatabase(): void {
  dbInstance = null;
}

export { JSONDatabase };

