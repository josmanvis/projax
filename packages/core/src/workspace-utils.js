"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseWorkspaceFile = parseWorkspaceFile;
exports.generateWorkspaceFile = generateWorkspaceFile;
exports.validateWorkspacePath = validateWorkspacePath;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
/**
 * Parse a .code-workspace file
 * @param filePath Path to the .code-workspace file
 * @returns Parsed workspace structure
 */
function parseWorkspaceFile(filePath) {
    if (!fs.existsSync(filePath)) {
        throw new Error(`Workspace file not found: ${filePath}`);
    }
    try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const workspace = JSON.parse(content);
        // Validate structure
        if (!workspace.folders || !Array.isArray(workspace.folders)) {
            throw new Error('Invalid workspace file: missing or invalid folders array');
        }
        // Normalize folder paths to absolute paths
        const workspaceDir = path.dirname(filePath);
        workspace.folders = workspace.folders.map(folder => {
            if (typeof folder === 'string') {
                // Legacy format: folders can be strings
                const absolutePath = path.isAbsolute(folder)
                    ? folder
                    : path.resolve(workspaceDir, folder);
                return { path: absolutePath };
            }
            else {
                // Modern format: folders are objects with path property
                const absolutePath = path.isAbsolute(folder.path)
                    ? folder.path
                    : path.resolve(workspaceDir, folder.path);
                return {
                    ...folder,
                    path: absolutePath,
                };
            }
        });
        return workspace;
    }
    catch (error) {
        if (error instanceof SyntaxError) {
            throw new Error(`Invalid JSON in workspace file: ${error.message}`);
        }
        throw error;
    }
}
/**
 * Generate a .code-workspace file
 * @param workspaceName Name of the workspace (used in comments)
 * @param projects Array of project paths (absolute or relative)
 * @param outputPath Path where the .code-workspace file should be created
 * @param settings Optional workspace settings
 * @param extensions Optional workspace extensions recommendations
 */
function generateWorkspaceFile(workspaceName, projects, outputPath, settings, extensions) {
    const workspaceDir = path.dirname(outputPath);
    // Convert project paths to relative paths if they're within the workspace directory
    const folders = projects.map(projectPath => {
        const absolutePath = path.isAbsolute(projectPath)
            ? projectPath
            : path.resolve(process.cwd(), projectPath);
        // Try to make path relative to workspace directory if possible
        let relativePath;
        try {
            relativePath = path.relative(workspaceDir, absolutePath);
            // If relative path goes outside workspace dir, use absolute
            if (relativePath.startsWith('..')) {
                relativePath = absolutePath;
            }
        }
        catch {
            relativePath = absolutePath;
        }
        return {
            path: relativePath,
        };
    });
    const workspace = {
        folders,
        ...(settings && { settings }),
        ...(extensions && { extensions }),
    };
    // Add comment header
    const content = JSON.stringify(workspace, null, 2);
    const withHeader = `// ${workspaceName} Workspace\n${content}`;
    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    fs.writeFileSync(outputPath, withHeader, 'utf-8');
}
/**
 * Validate that a path is a valid workspace file
 * @param filePath Path to check
 * @returns true if the path exists and is a valid .code-workspace file
 */
function validateWorkspacePath(filePath) {
    if (!fs.existsSync(filePath)) {
        return false;
    }
    if (!filePath.endsWith('.code-workspace')) {
        return false;
    }
    try {
        parseWorkspaceFile(filePath);
        return true;
    }
    catch {
        return false;
    }
}
