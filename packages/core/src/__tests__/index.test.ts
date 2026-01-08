/* eslint-disable @typescript-eslint/no-var-requires */
import * as fs from 'fs';
import { execSync } from 'child_process';
import {
  getAllProjects,
  addProject,
  removeProject,
  getTestsByProject,
  getDatabaseManager,
} from '../index';
import { Project, Test } from '../database';

// Mock modules
jest.mock('fs');
jest.mock('child_process');
const mockedFs = fs as jest.Mocked<typeof fs>;
const mockedExecSync = execSync as jest.MockedFunction<typeof execSync>;

describe('index - convenience functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedFs.existsSync.mockReturnValue(false);
    // Reset the singleton
    (require('../database') as any).dbManager = null;
  });

  describe('getAllProjects', () => {
    it('should return all projects', () => {
      const mockProjects: Project[] = [
        {
          id: 1,
          name: 'Project 1',
          path: '/path/1',
          description: 'First project',
          framework: 'react',
          last_scanned: Date.now(),
          created_at: Date.now() - 10000,
          tags: ['frontend', 'react'],
        },
        {
          id: 2,
          name: 'Project 2',
          path: '/path/2',
          description: 'Second project',
          framework: 'express',
          last_scanned: Date.now(),
          created_at: Date.now() - 20000,
          tags: ['backend', 'api'],
        },
      ];

      mockedExecSync.mockReturnValue(JSON.stringify(mockProjects));

      const result = getAllProjects();

      expect(result).toEqual(mockProjects);
      expect(result.length).toBe(2);
      expect(result[0].name).toBe('Project 1');
      expect(result[1].name).toBe('Project 2');
    });

    it('should return empty array when no projects exist', () => {
      mockedExecSync.mockReturnValue(JSON.stringify([]));

      const result = getAllProjects();

      expect(result).toEqual([]);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle projects with different properties', () => {
      const mockProjects: Project[] = [
        {
          id: 1,
          name: 'Basic Project',
          path: '/basic',
          description: null,
          framework: null,
          last_scanned: null,
          created_at: Date.now(),
        },
        {
          id: 2,
          name: 'Full Project',
          path: '/full',
          description: 'Complete details',
          framework: 'next.js',
          last_scanned: Date.now(),
          created_at: Date.now(),
          tags: ['fullstack', 'nextjs'],
        },
      ];

      mockedExecSync.mockReturnValue(JSON.stringify(mockProjects));

      const result = getAllProjects();

      expect(result[0].description).toBeNull();
      expect(result[0].framework).toBeNull();
      expect(result[1].description).toBe('Complete details');
      expect(result[1].framework).toBe('next.js');
    });
  });

  describe('addProject', () => {
    it('should add a new project', () => {
      const mockProject: Project = {
        id: 1,
        name: 'New Project',
        path: '/new/path',
        description: null,
        framework: null,
        last_scanned: null,
        created_at: Date.now(),
      };

      mockedExecSync.mockReturnValue(JSON.stringify(mockProject));

      const result = addProject('New Project', '/new/path');

      expect(result).toEqual(mockProject);
      expect(result.name).toBe('New Project');
      expect(result.path).toBe('/new/path');
    });

    it('should add project with special characters in name', () => {
      const mockProject: Project = {
        id: 1,
        name: 'My Project (v2.0) [Test]',
        path: '/special/path',
        description: null,
        framework: null,
        last_scanned: null,
        created_at: Date.now(),
      };

      mockedExecSync.mockReturnValue(JSON.stringify(mockProject));

      const result = addProject('My Project (v2.0) [Test]', '/special/path');

      expect(result.name).toBe('My Project (v2.0) [Test]');
    });

    it('should add project with absolute path', () => {
      const mockProject: Project = {
        id: 1,
        name: 'Test Project',
        path: '/Users/username/projects/test',
        description: null,
        framework: null,
        last_scanned: null,
        created_at: Date.now(),
      };

      mockedExecSync.mockReturnValue(JSON.stringify(mockProject));

      const result = addProject('Test Project', '/Users/username/projects/test');

      expect(result.path).toBe('/Users/username/projects/test');
    });

    it('should handle API errors when adding project', () => {
      mockedExecSync.mockImplementation(() => {
        throw new Error('API request failed: Project already exists');
      });

      expect(() => addProject('Duplicate', '/path')).toThrow('API request failed');
    });

    it('should return project with correct created_at timestamp', () => {
      const now = Date.now();
      const mockProject: Project = {
        id: 1,
        name: 'Test',
        path: '/test',
        description: null,
        framework: null,
        last_scanned: null,
        created_at: now,
      };

      mockedExecSync.mockReturnValue(JSON.stringify(mockProject));

      const result = addProject('Test', '/test');

      expect(result.created_at).toBe(now);
    });
  });

  describe('removeProject', () => {
    it('should remove a project by id', () => {
      mockedExecSync.mockReturnValue('');

      expect(() => removeProject(1)).not.toThrow();
      expect(mockedExecSync).toHaveBeenCalledWith(
        expect.stringContaining('DELETE'),
        expect.any(Object)
      );
    });

    it('should handle removing multiple projects', () => {
      mockedExecSync.mockReturnValue('');

      expect(() => {
        removeProject(1);
        removeProject(2);
        removeProject(3);
      }).not.toThrow();

      expect(mockedExecSync).toHaveBeenCalledTimes(3);
    });

    it('should handle errors when removing non-existent project', () => {
      mockedExecSync.mockImplementation(() => {
        const error = new Error('Command failed: curl');
        (error as any).message = 'Command failed: curl ... 404';
        throw error;
      });

      expect(() => removeProject(999)).toThrow();
    });

    it('should not return a value', () => {
      mockedExecSync.mockReturnValue('');

      const result = removeProject(1);

      expect(result).toBeUndefined();
    });
  });

  describe('getTestsByProject', () => {
    it('should get all tests for a project', () => {
      const mockTests: Test[] = [
        {
          id: 1,
          project_id: 1,
          file_path: '/test/file1.test.ts',
          framework: 'jest',
          status: 'passed',
          last_run: Date.now(),
          created_at: Date.now() - 10000,
        },
        {
          id: 2,
          project_id: 1,
          file_path: '/test/file2.spec.ts',
          framework: 'jest',
          status: 'failed',
          last_run: Date.now(),
          created_at: Date.now() - 10000,
        },
      ];

      mockedExecSync.mockReturnValue(JSON.stringify(mockTests));

      const result = getTestsByProject(1);

      expect(result).toEqual(mockTests);
      expect(result.length).toBe(2);
    });

    it('should return empty array for project with no tests', () => {
      mockedExecSync.mockReturnValue(JSON.stringify([]));

      const result = getTestsByProject(1);

      expect(result).toEqual([]);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle tests with different frameworks', () => {
      const mockTests: Test[] = [
        {
          id: 1,
          project_id: 1,
          file_path: '/test/jest.test.ts',
          framework: 'jest',
          status: null,
          last_run: null,
          created_at: Date.now(),
        },
        {
          id: 2,
          project_id: 1,
          file_path: '/test/vitest.spec.ts',
          framework: 'vitest',
          status: null,
          last_run: null,
          created_at: Date.now(),
        },
      ];

      mockedExecSync.mockReturnValue(JSON.stringify(mockTests));

      const result = getTestsByProject(1);

      expect(result[0].framework).toBe('jest');
      expect(result[1].framework).toBe('vitest');
    });

    it('should handle tests without status or last_run', () => {
      const mockTests: Test[] = [
        {
          id: 1,
          project_id: 1,
          file_path: '/test/new.test.ts',
          framework: 'jest',
          status: null,
          last_run: null,
          created_at: Date.now(),
        },
      ];

      mockedExecSync.mockReturnValue(JSON.stringify(mockTests));

      const result = getTestsByProject(1);

      expect(result[0].status).toBeNull();
      expect(result[0].last_run).toBeNull();
    });

    it('should handle API errors', () => {
      mockedExecSync.mockImplementation(() => {
        throw new Error('API request failed');
      });

      expect(() => getTestsByProject(1)).toThrow('API request failed');
    });

    it('should filter tests by project_id', () => {
      const mockTests: Test[] = [
        {
          id: 1,
          project_id: 5,
          file_path: '/test/file.test.ts',
          framework: 'jest',
          status: null,
          last_run: null,
          created_at: Date.now(),
        },
      ];

      mockedExecSync.mockReturnValue(JSON.stringify(mockTests));

      const result = getTestsByProject(5);

      expect(result[0].project_id).toBe(5);
    });
  });

  describe('getDatabaseManager', () => {
    it('should return database manager instance', () => {
      const db = getDatabaseManager();

      expect(db).toBeDefined();
      expect(typeof db.getAllProjects).toBe('function');
      expect(typeof db.addProject).toBe('function');
      expect(typeof db.removeProject).toBe('function');
    });

    it('should return singleton instance', () => {
      const db1 = getDatabaseManager();
      const db2 = getDatabaseManager();

      expect(db1).toBe(db2);
    });

    it('should have all expected methods', () => {
      const db = getDatabaseManager();

      // Project methods
      expect(db).toHaveProperty('addProject');
      expect(db).toHaveProperty('getProject');
      expect(db).toHaveProperty('getAllProjects');
      expect(db).toHaveProperty('updateProject');
      expect(db).toHaveProperty('removeProject');
      expect(db).toHaveProperty('scanProject');
      expect(db).toHaveProperty('scanAllProjects');

      // Test methods
      expect(db).toHaveProperty('getTestsByProject');

      // Settings methods
      expect(db).toHaveProperty('getSetting');
      expect(db).toHaveProperty('setSetting');
      expect(db).toHaveProperty('getAllSettings');

      // Test result methods
      expect(db).toHaveProperty('addTestResult');
      expect(db).toHaveProperty('getLatestTestResult');
      expect(db).toHaveProperty('getTestResultsByProject');

      // Port methods
      expect(db).toHaveProperty('getProjectPorts');
      expect(db).toHaveProperty('getProjectPortsByScript');

      // Utility methods
      expect(db).toHaveProperty('close');
    });
  });

  describe('module exports', () => {
    it('should export all necessary functions', () => {
      const index = require('../index');

      expect(index.getAllProjects).toBeDefined();
      expect(index.addProject).toBeDefined();
      expect(index.removeProject).toBeDefined();
      expect(index.getTestsByProject).toBeDefined();
      expect(index.getDatabaseManager).toBeDefined();
    });

    it('should re-export types from other modules', () => {
      const index = require('../index');

      // These should be available via re-exports
      expect(index.detectTestFramework).toBeDefined();
      expect(index.detectProjectFramework).toBeDefined();
      expect(index.isTestFile).toBeDefined();
      expect(index.scanProject).toBeDefined();
      expect(index.scanAllProjects).toBeDefined();
      expect(index.getSetting).toBeDefined();
      expect(index.setSetting).toBeDefined();
      expect(index.getAllSettings).toBeDefined();
    });
  });

  describe('integration scenarios', () => {
    it('should support adding and then getting a project', () => {
      const mockProject: Project = {
        id: 1,
        name: 'Integration Test',
        path: '/integration',
        description: null,
        framework: null,
        last_scanned: null,
        created_at: Date.now(),
      };

      // First call: addProject
      mockedExecSync.mockReturnValueOnce(JSON.stringify(mockProject));

      // Second call: getAllProjects
      mockedExecSync.mockReturnValueOnce(JSON.stringify([mockProject]));

      const addedProject = addProject('Integration Test', '/integration');
      const allProjects = getAllProjects();

      expect(addedProject.id).toBe(1);
      expect(allProjects.length).toBe(1);
      expect(allProjects[0].id).toBe(addedProject.id);
    });

    it('should support adding project and getting its tests', () => {
      const mockProject: Project = {
        id: 1,
        name: 'Test Project',
        path: '/test',
        description: null,
        framework: 'jest',
        last_scanned: null,
        created_at: Date.now(),
      };

      const mockTests: Test[] = [
        {
          id: 1,
          project_id: 1,
          file_path: '/test/file.test.ts',
          framework: 'jest',
          status: null,
          last_run: null,
          created_at: Date.now(),
        },
      ];

      // First call: addProject
      mockedExecSync.mockReturnValueOnce(JSON.stringify(mockProject));

      // Second call: getTestsByProject
      mockedExecSync.mockReturnValueOnce(JSON.stringify(mockTests));

      const project = addProject('Test Project', '/test');
      const tests = getTestsByProject(project.id);

      expect(tests.length).toBe(1);
      expect(tests[0].project_id).toBe(project.id);
    });

    it('should handle multiple operations in sequence', () => {
      // Add project
      mockedExecSync.mockReturnValueOnce(JSON.stringify({
        id: 1,
        name: 'Project 1',
        path: '/p1',
        description: null,
        framework: null,
        last_scanned: null,
        created_at: Date.now(),
      }));

      // Add another project
      mockedExecSync.mockReturnValueOnce(JSON.stringify({
        id: 2,
        name: 'Project 2',
        path: '/p2',
        description: null,
        framework: null,
        last_scanned: null,
        created_at: Date.now(),
      }));

      // Get all projects
      mockedExecSync.mockReturnValueOnce(JSON.stringify([
        { id: 1, name: 'Project 1', path: '/p1', description: null, framework: null, last_scanned: null, created_at: Date.now() },
        { id: 2, name: 'Project 2', path: '/p2', description: null, framework: null, last_scanned: null, created_at: Date.now() },
      ]));

      // Remove first project
      mockedExecSync.mockReturnValueOnce('');

      // Get all projects again
      mockedExecSync.mockReturnValueOnce(JSON.stringify([
        { id: 2, name: 'Project 2', path: '/p2', description: null, framework: null, last_scanned: null, created_at: Date.now() },
      ]));

      const p1 = addProject('Project 1', '/p1');
      const p2 = addProject('Project 2', '/p2');
      
      let projects = getAllProjects();
      expect(projects.length).toBe(2);

      removeProject(p1.id);
      
      projects = getAllProjects();
      expect(projects.length).toBe(1);
      expect(projects[0].id).toBe(p2.id);
    });
  });
});

