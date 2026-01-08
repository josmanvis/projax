export interface Project {
    id: number;
    name: string;
    path: string;
    description: string | null;
    framework: string | null;
    last_scanned: number | null;
    created_at: number;
    tags?: string[];
    git_branch?: string | null;
}
export interface Test {
    id: number;
    project_id: number;
    file_path: string;
    framework: string | null;
    status: string | null;
    last_run: number | null;
    created_at: number;
}
export interface JenkinsJob {
    id: number;
    project_id: number;
    job_name: string;
    job_url: string;
    last_build_status: string | null;
    last_build_number: number | null;
    last_updated: number | null;
    created_at: number;
}
export interface ProjectPort {
    id: number;
    project_id: number;
    port: number;
    script_name: string | null;
    config_source: string;
    last_detected: number;
    created_at: number;
}
export interface TestResult {
    id: number;
    project_id: number;
    script_name: string;
    framework: string | null;
    passed: number;
    failed: number;
    skipped: number;
    total: number;
    duration: number | null;
    coverage: number | null;
    timestamp: number;
    raw_output: string | null;
}
type ScanResponse = {
    project: Project;
    testsFound: number;
    tests: Test[];
};
declare class DatabaseManager {
    private apiBaseUrl;
    private defaultPort;
    constructor();
    private request;
    addProject(name: string, projectPath: string): Project;
    getProject(id: number): Project | null;
    getProjectByPath(projectPath: string): Project | null;
    getAllProjects(): Project[];
    updateProjectLastScanned(id: number): void;
    updateProjectFramework(id: number, framework: string): void;
    updateProjectName(id: number, newName: string): Project;
    updateProject(id: number, updates: Partial<Omit<Project, 'id' | 'created_at'>>): Project;
    removeProject(id: number): void;
    scanProject(id: number): ScanResponse;
    scanAllProjects(): ScanResponse[];
    addTest(projectId: number, filePath: string, framework?: string | null): Test;
    getTest(id: number): Test | null;
    getTestsByProject(projectId: number): Test[];
    removeTestsByProject(projectId: number): void;
    addJenkinsJob(projectId: number, jobName: string, jobUrl: string): JenkinsJob;
    getJenkinsJob(id: number): JenkinsJob | null;
    getJenkinsJobsByProject(projectId: number): JenkinsJob[];
    addProjectPort(projectId: number, port: number, configSource: string, scriptName?: string | null): ProjectPort;
    getProjectPort(id: number): ProjectPort | null;
    getProjectPorts(projectId: number): ProjectPort[];
    getProjectPortsByScript(projectId: number, scriptName: string): ProjectPort[];
    removeProjectPorts(projectId: number): void;
    updateProjectPortLastDetected(projectId: number, port: number, scriptName: string | null): void;
    getSetting(key: string): string | null;
    setSetting(key: string, value: string): void;
    getAllSettings(): Record<string, string>;
    addTestResult(projectId: number, scriptName: string, passed: number, failed: number, skipped?: number, total?: number, duration?: number | null, coverage?: number | null, framework?: string | null, rawOutput?: string | null): TestResult;
    getLatestTestResult(projectId: number): TestResult | null;
    getTestResultsByProject(projectId: number, limit?: number): TestResult[];
    close(): void;
}
export declare function getDatabaseManager(): DatabaseManager;
export {};
