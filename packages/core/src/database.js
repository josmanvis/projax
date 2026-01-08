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
exports.getDatabaseManager = getDatabaseManager;
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const fs = __importStar(require("fs"));
const child_process_1 = require("child_process");
class DatabaseManager {
    apiBaseUrl;
    defaultPort = 38124;
    constructor() {
        // Read API port from file, or use default
        const dataDir = path.join(os.homedir(), '.projax');
        const portFile = path.join(dataDir, 'api-port.txt');
        let port = this.defaultPort;
        if (fs.existsSync(portFile)) {
            try {
                const portStr = fs.readFileSync(portFile, 'utf-8').trim();
                port = parseInt(portStr, 10) || this.defaultPort;
            }
            catch {
                // Use default if file read fails
            }
        }
        this.apiBaseUrl = `http://localhost:${port}/api`;
    }
    request(endpoint, options = {}) {
        const url = `${this.apiBaseUrl}${endpoint}`;
        const method = options.method || 'GET';
        const body = options.body;
        try {
            let curlCmd;
            if (method === 'GET') {
                curlCmd = `curl -s -f "${url}"`;
            }
            else if (method === 'DELETE') {
                curlCmd = `curl -s -f -X DELETE "${url}"`;
            }
            else {
                // POST, PUT, PATCH
                const tempFile = path.join(os.tmpdir(), `prx-${Date.now()}.json`);
                if (body) {
                    fs.writeFileSync(tempFile, body);
                }
                curlCmd = `curl -s -f -X ${method} -H "Content-Type: application/json" ${body ? `-d @${tempFile}` : ''} "${url}"`;
            }
            const result = (0, child_process_1.execSync)(curlCmd, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
            // Clean up temp file if created
            if (method !== 'GET' && method !== 'DELETE' && body) {
                const tempFile = path.join(os.tmpdir(), `prx-${Date.now()}.json`);
                try {
                    fs.unlinkSync(tempFile);
                }
                catch {
                    // Ignore cleanup errors
                }
            }
            if (!result || result.trim() === '') {
                return undefined;
            }
            return JSON.parse(result);
        }
        catch (error) {
            // Check if it's a 404 or other HTTP error
            if (error instanceof Error && error.message.includes('404')) {
                throw new Error('Resource not found');
            }
            throw new Error(`API request failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    // Project operations
    addProject(name, projectPath) {
        return this.request('/projects', {
            method: 'POST',
            body: JSON.stringify({ name, path: projectPath }),
        });
    }
    getProject(id) {
        try {
            return this.request(`/projects/${id}`);
        }
        catch (error) {
            if (error instanceof Error && error.message.includes('404')) {
                return null;
            }
            throw error;
        }
    }
    getProjectByPath(projectPath) {
        const projects = this.getAllProjects();
        return projects.find(p => p.path === projectPath) || null;
    }
    getAllProjects() {
        return this.request('/projects');
    }
    updateProjectLastScanned(id) {
        // Fire and forget - this is handled by the scan endpoint
        // No need to explicitly update last_scanned
    }
    updateProjectFramework(id, framework) {
        // This will be called during scan to update the detected framework
        this.request(`/projects/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ framework }),
        });
    }
    updateProjectName(id, newName) {
        return this.request(`/projects/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ name: newName }),
        });
    }
    updateProject(id, updates) {
        return this.request(`/projects/${id}`, {
            method: 'PUT',
            body: JSON.stringify(updates),
        });
    }
    removeProject(id) {
        this.request(`/projects/${id}`, {
            method: 'DELETE',
        });
    }
    scanProject(id) {
        return this.request(`/projects/${id}/scan`, {
            method: 'POST',
        });
    }
    scanAllProjects() {
        return this.request('/projects/scan/all', {
            method: 'POST',
        });
    }
    // Test operations
    addTest(projectId, filePath, framework = null) {
        // Tests are added via scan endpoint, not directly
        throw new Error('addTest should not be called directly. Use scan endpoint instead.');
    }
    getTest(id) {
        // This endpoint doesn't exist yet
        throw new Error('getTest endpoint not yet implemented in API');
    }
    getTestsByProject(projectId) {
        return this.request(`/projects/${projectId}/tests`);
    }
    removeTestsByProject(projectId) {
        // This is handled by the scan endpoint
        // For now, we'll just call scan which removes and re-adds
        throw new Error('removeTestsByProject should not be called directly. Use scan endpoint instead.');
    }
    // Jenkins operations
    addJenkinsJob(projectId, jobName, jobUrl) {
        // This endpoint doesn't exist yet
        throw new Error('addJenkinsJob endpoint not yet implemented in API');
    }
    getJenkinsJob(id) {
        // This endpoint doesn't exist yet
        throw new Error('getJenkinsJob endpoint not yet implemented in API');
    }
    getJenkinsJobsByProject(projectId) {
        // This endpoint doesn't exist yet
        throw new Error('getJenkinsJobsByProject endpoint not yet implemented in API');
    }
    // Project port operations
    addProjectPort(projectId, port, configSource, scriptName = null) {
        // This endpoint doesn't exist yet
        throw new Error('addProjectPort endpoint not yet implemented in API');
    }
    getProjectPort(id) {
        // This endpoint doesn't exist yet
        throw new Error('getProjectPort endpoint not yet implemented in API');
    }
    getProjectPorts(projectId) {
        return this.request(`/projects/${projectId}/ports`);
    }
    getProjectPortsByScript(projectId, scriptName) {
        const ports = this.getProjectPorts(projectId);
        return ports.filter(p => p.script_name === scriptName);
    }
    removeProjectPorts(projectId) {
        // This endpoint doesn't exist yet
        throw new Error('removeProjectPorts endpoint not yet implemented in API');
    }
    updateProjectPortLastDetected(projectId, port, scriptName) {
        // This endpoint doesn't exist yet - no-op for now
        // Ports are updated via the scan endpoint
    }
    // Settings operations
    getSetting(key) {
        const settings = this.getAllSettings();
        return settings[key] || null;
    }
    setSetting(key, value) {
        this.request(`/settings/${encodeURIComponent(key)}`, {
            method: 'PUT',
            body: JSON.stringify({ value }),
        });
    }
    getAllSettings() {
        return this.request('/settings');
    }
    // Test Result operations
    addTestResult(projectId, scriptName, passed, failed, skipped = 0, total = passed + failed + skipped, duration = null, coverage = null, framework = null, rawOutput = null) {
        return this.request(`/projects/${projectId}/test-results`, {
            method: 'POST',
            body: JSON.stringify({
                scriptName,
                passed,
                failed,
                skipped,
                total,
                duration,
                coverage,
                framework,
                rawOutput,
            }),
        });
    }
    getLatestTestResult(projectId) {
        try {
            return this.request(`/projects/${projectId}/test-results/latest`);
        }
        catch (error) {
            return null;
        }
    }
    getTestResultsByProject(projectId, limit = 10) {
        return this.request(`/projects/${projectId}/test-results?limit=${limit}`);
    }
    close() {
        // No-op for API client
    }
}
// Singleton instance
let dbManager = null;
function getDatabaseManager() {
    if (!dbManager) {
        dbManager = new DatabaseManager();
    }
    return dbManager;
}
