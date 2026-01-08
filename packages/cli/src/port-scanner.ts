import { getDatabaseManager, Project, ProjectPort } from './core-bridge';
import { extractPortsFromProject, PortInfo } from './port-extractor';
import * as fs from 'fs';

/**
 * Scan and index ports for a specific project
 */
export async function scanProjectPorts(projectId: number): Promise<void> {
  const db = getDatabaseManager();
  const project = db.getProject(projectId);

  if (!project) {
    throw new Error(`Project with id ${projectId} not found`);
  }

  if (!fs.existsSync(project.path)) {
    throw new Error(`Project path does not exist: ${project.path}`);
  }

  // Extract ports from project
  const ports = await extractPortsFromProject(project.path);

  // Remove existing ports for this project
  db.removeProjectPorts(projectId);

  // Add new ports
  for (const portInfo of ports) {
    db.addProjectPort(
      projectId,
      portInfo.port,
      portInfo.source,
      portInfo.script
    );
  }
}

/**
 * Scan ports for all projects
 */
export async function scanAllProjectPorts(): Promise<void> {
  const db = getDatabaseManager();
  const projects = db.getAllProjects();

  for (const project of projects) {
    try {
      await scanProjectPorts(project.id);
    } catch (error) {
      // Continue with other projects if one fails
      console.error(`Error scanning ports for project ${project.name}:`, error instanceof Error ? error.message : error);
    }
  }
}

/**
 * Check if ports need to be rescanned (stale check)
 * Returns true if ports haven't been scanned in the last 24 hours
 */
export function shouldRescanPorts(projectId: number): boolean {
  const db = getDatabaseManager();
  const ports = db.getProjectPorts(projectId);

  if (ports.length === 0) {
    return true; // No ports found, should scan
  }

  // Check if any port was detected 24 hours ago or older
  const twentyFourHoursAgo = Math.floor(Date.now() / 1000) - (24 * 60 * 60);
  const needsRescan = ports.some((port: ProjectPort) => (port.last_detected || 0) <= twentyFourHoursAgo);

  return needsRescan;
}

