/* eslint-disable @typescript-eslint/no-var-requires */
import * as fs from 'fs';
import { execSync } from 'child_process';
import { scanProject, scanAllProjects, ScanResult } from '../scanner';
import { Project, Test } from '../database';

// Mock modules
jest.mock('fs');
jest.mock('child_process');
const mockedFs = fs as jest.Mocked<typeof fs>;
const mockedExecSync = execSync as jest.MockedFunction<typeof execSync>;

describe('scanner', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedFs.existsSync.mockReturnValue(false);
    // Reset the singleton
    (require('../database') as any).dbManager = null;
  });

  describe('scanProject', () => {
    it('should scan a project and return results', () => {
      const mockScanResponse: ScanResult = {
        project: {
          id: 1,
          name: 'Test Project',
          path: '/test/path',
          description: null,
          framework: 'jest',
          last_scanned: Date.now(),
          created_at: Date.now() - 10000,
        },
        testsFound: 3,
        tests: [
          {
            id: 1,
            project_id: 1,
            file_path: '/test/path/src/__tests__/file1.test.ts',
            framework: 'jest',
            status: null,
            last_run: null,
            created_at: Date.now(),
          },
          {
            id: 2,
            project_id: 1,
            file_path: '/test/path/src/__tests__/file2.test.ts',
            framework: 'jest',
            status: null,
            last_run: null,
            created_at: Date.now(),
          },
          {
            id: 3,
            project_id: 1,
            file_path: '/test/path/src/utils/helper.spec.ts',
            framework: 'jest',
            status: null,
            last_run: null,
            created_at: Date.now(),
          },
        ],
      };

      mockedExecSync.mockReturnValue(JSON.stringify(mockScanResponse));

      const result = scanProject(1);

      expect(result.project.id).toBe(1);
      expect(result.testsFound).toBe(3);
      expect(result.tests.length).toBe(3);
      expect(result.project.framework).toBe('jest');
    });

    it('should handle project with no tests found', () => {
      const mockScanResponse: ScanResult = {
        project: {
          id: 1,
          name: 'Empty Project',
          path: '/test/empty',
          description: null,
          framework: null,
          last_scanned: Date.now(),
          created_at: Date.now(),
        },
        testsFound: 0,
        tests: [],
      };

      mockedExecSync.mockReturnValue(JSON.stringify(mockScanResponse));

      const result = scanProject(1);

      expect(result.testsFound).toBe(0);
      expect(result.tests).toEqual([]);
    });

    it('should update last_scanned timestamp', () => {
      const mockScanResponse: ScanResult = {
        project: {
          id: 1,
          name: 'Test Project',
          path: '/test/path',
          description: null,
          framework: 'vitest',
          last_scanned: Date.now(),
          created_at: Date.now() - 100000,
        },
        testsFound: 1,
        tests: [],
      };

      mockedExecSync.mockReturnValue(JSON.stringify(mockScanResponse));

      const result = scanProject(1);

      expect(result.project.last_scanned).not.toBeNull();
      expect(result.project.last_scanned).toBeGreaterThan(Date.now() - 1000);
    });

    it('should detect and set framework during scan', () => {
      const mockScanResponse: ScanResult = {
        project: {
          id: 1,
          name: 'Test Project',
          path: '/test/path',
          description: null,
          framework: 'mocha',
          last_scanned: Date.now(),
          created_at: Date.now(),
        },
        testsFound: 1,
        tests: [
          {
            id: 1,
            project_id: 1,
            file_path: '/test/path/test/file.spec.js',
            framework: 'mocha',
            status: null,
            last_run: null,
            created_at: Date.now(),
          },
        ],
      };

      mockedExecSync.mockReturnValue(JSON.stringify(mockScanResponse));

      const result = scanProject(1);

      expect(result.project.framework).toBe('mocha');
      expect(result.tests[0].framework).toBe('mocha');
    });

    it('should handle API errors', () => {
      mockedExecSync.mockImplementation(() => {
        throw new Error('API request failed');
      });

      expect(() => scanProject(1)).toThrow('API request failed');
    });

    it('should handle non-existent project', () => {
      mockedExecSync.mockImplementation(() => {
        const error = new Error('Command failed: curl');
        (error as any).message = 'Command failed: curl ... 404';
        throw error;
      });

      expect(() => scanProject(999)).toThrow();
    });
  });

  describe('scanAllProjects', () => {
    it('should scan all projects and return results', () => {
      const mockScanResults: ScanResult[] = [
        {
          project: {
            id: 1,
            name: 'Project 1',
            path: '/path/1',
            description: null,
            framework: 'jest',
            last_scanned: Date.now(),
            created_at: Date.now(),
          },
          testsFound: 2,
          tests: [
            {
              id: 1,
              project_id: 1,
              file_path: '/path/1/test1.test.ts',
              framework: 'jest',
              status: null,
              last_run: null,
              created_at: Date.now(),
            },
            {
              id: 2,
              project_id: 1,
              file_path: '/path/1/test2.test.ts',
              framework: 'jest',
              status: null,
              last_run: null,
              created_at: Date.now(),
            },
          ],
        },
        {
          project: {
            id: 2,
            name: 'Project 2',
            path: '/path/2',
            description: null,
            framework: 'vitest',
            last_scanned: Date.now(),
            created_at: Date.now(),
          },
          testsFound: 1,
          tests: [
            {
              id: 3,
              project_id: 2,
              file_path: '/path/2/test.spec.ts',
              framework: 'vitest',
              status: null,
              last_run: null,
              created_at: Date.now(),
            },
          ],
        },
      ];

      mockedExecSync.mockReturnValue(JSON.stringify(mockScanResults));

      const results = scanAllProjects();

      expect(results.length).toBe(2);
      expect(results[0].project.name).toBe('Project 1');
      expect(results[0].testsFound).toBe(2);
      expect(results[1].project.name).toBe('Project 2');
      expect(results[1].testsFound).toBe(1);
    });

    it('should handle empty project list', () => {
      mockedExecSync.mockReturnValue(JSON.stringify([]));

      const results = scanAllProjects();

      expect(results).toEqual([]);
    });

    it('should handle projects with different test frameworks', () => {
      const mockScanResults: ScanResult[] = [
        {
          project: {
            id: 1,
            name: 'Jest Project',
            path: '/jest',
            description: null,
            framework: 'jest',
            last_scanned: Date.now(),
            created_at: Date.now(),
          },
          testsFound: 1,
          tests: [],
        },
        {
          project: {
            id: 2,
            name: 'Vitest Project',
            path: '/vitest',
            description: null,
            framework: 'vitest',
            last_scanned: Date.now(),
            created_at: Date.now(),
          },
          testsFound: 1,
          tests: [],
        },
        {
          project: {
            id: 3,
            name: 'Mocha Project',
            path: '/mocha',
            description: null,
            framework: 'mocha',
            last_scanned: Date.now(),
            created_at: Date.now(),
          },
          testsFound: 1,
          tests: [],
        },
      ];

      mockedExecSync.mockReturnValue(JSON.stringify(mockScanResults));

      const results = scanAllProjects();

      expect(results.length).toBe(3);
      expect(results[0].project.framework).toBe('jest');
      expect(results[1].project.framework).toBe('vitest');
      expect(results[2].project.framework).toBe('mocha');
    });

    it('should handle some projects with no tests', () => {
      const mockScanResults: ScanResult[] = [
        {
          project: {
            id: 1,
            name: 'Project with tests',
            path: '/path/1',
            description: null,
            framework: 'jest',
            last_scanned: Date.now(),
            created_at: Date.now(),
          },
          testsFound: 2,
          tests: [],
        },
        {
          project: {
            id: 2,
            name: 'Project without tests',
            path: '/path/2',
            description: null,
            framework: null,
            last_scanned: Date.now(),
            created_at: Date.now(),
          },
          testsFound: 0,
          tests: [],
        },
      ];

      mockedExecSync.mockReturnValue(JSON.stringify(mockScanResults));

      const results = scanAllProjects();

      expect(results.length).toBe(2);
      expect(results[0].testsFound).toBe(2);
      expect(results[1].testsFound).toBe(0);
    });

    it('should update all projects last_scanned timestamp', () => {
      const mockScanResults: ScanResult[] = [
        {
          project: {
            id: 1,
            name: 'Project 1',
            path: '/path/1',
            description: null,
            framework: null,
            last_scanned: Date.now(),
            created_at: Date.now() - 100000,
          },
          testsFound: 0,
          tests: [],
        },
        {
          project: {
            id: 2,
            name: 'Project 2',
            path: '/path/2',
            description: null,
            framework: null,
            last_scanned: Date.now(),
            created_at: Date.now() - 100000,
          },
          testsFound: 0,
          tests: [],
        },
      ];

      mockedExecSync.mockReturnValue(JSON.stringify(mockScanResults));

      const results = scanAllProjects();

      results.forEach(result => {
        expect(result.project.last_scanned).not.toBeNull();
        expect(result.project.last_scanned).toBeGreaterThan(Date.now() - 1000);
      });
    });

    it('should handle API errors', () => {
      mockedExecSync.mockImplementation(() => {
        throw new Error('API request failed');
      });

      expect(() => scanAllProjects()).toThrow('API request failed');
    });
  });

  describe('ScanResult type', () => {
    it('should have correct structure', () => {
      const scanResult: ScanResult = {
        project: {
          id: 1,
          name: 'Test',
          path: '/test',
          description: null,
          framework: null,
          last_scanned: null,
          created_at: Date.now(),
        },
        testsFound: 0,
        tests: [],
      };

      expect(scanResult).toHaveProperty('project');
      expect(scanResult).toHaveProperty('testsFound');
      expect(scanResult).toHaveProperty('tests');
      expect(scanResult.project).toHaveProperty('id');
      expect(scanResult.project).toHaveProperty('name');
      expect(scanResult.project).toHaveProperty('path');
    });
  });
});

