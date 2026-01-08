export interface WorkspaceFolder {
    path: string;
    name?: string;
}
export interface WorkspaceSettings {
    [key: string]: any;
}
export interface WorkspaceExtensions {
    recommendations?: string[];
    unwantedRecommendations?: string[];
}
export interface ParsedWorkspace {
    folders: WorkspaceFolder[];
    settings?: WorkspaceSettings;
    extensions?: WorkspaceExtensions;
}
/**
 * Parse a .code-workspace file
 * @param filePath Path to the .code-workspace file
 * @returns Parsed workspace structure
 */
export declare function parseWorkspaceFile(filePath: string): ParsedWorkspace;
/**
 * Generate a .code-workspace file
 * @param workspaceName Name of the workspace (used in comments)
 * @param projects Array of project paths (absolute or relative)
 * @param outputPath Path where the .code-workspace file should be created
 * @param settings Optional workspace settings
 * @param extensions Optional workspace extensions recommendations
 */
export declare function generateWorkspaceFile(workspaceName: string, projects: string[], outputPath: string, settings?: WorkspaceSettings, extensions?: WorkspaceExtensions): void;
/**
 * Validate that a path is a valid workspace file
 * @param filePath Path to check
 * @returns true if the path exists and is a valid .code-workspace file
 */
export declare function validateWorkspacePath(filePath: string): boolean;
