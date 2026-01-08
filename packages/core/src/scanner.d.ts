import { Project, Test } from './database';
export interface ScanResult {
    project: Project;
    testsFound: number;
    tests: Test[];
}
export declare function scanProject(projectId: number): ScanResult;
export declare function scanAllProjects(): ScanResult[];
