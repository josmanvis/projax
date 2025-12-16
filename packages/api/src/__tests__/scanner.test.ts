/* eslint-disable @typescript-eslint/no-var-requires */
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// Use an object to hold testDataDir so it can be accessed before initialization
const testConfig = { dataDir: '' };

// Mock os module
jest.mock('os', () => ({
  ...jest.requireActual('os'),
  homedir: jest.fn(() => testConfig.dataDir || os.tmpdir()),
}));

// Import after mocking
import { scanProject, scanAllProjects } from '../services/scanner';
import { JSONDatabase, resetDatabase } from '../database';

describe('Scanner Service', () => {
  let testDir: string;
  let db: JSONDatabase;

  beforeEach(() => {
    // Create temporary test directories with truly unique names
    const uniqueId = `${Date.now()}-${process.hrtime.bigint()}-${Math.random().toString(36).substring(7)}`;
    testDir = path.join(os.tmpdir(), `projax-scanner-test-${uniqueId}`);
    testConfig.dataDir = path.join(os.tmpdir(), `projax-data-test-${uniqueId}`);
    
    // Ensure clean slate
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
    if (fs.existsSync(testConfig.dataDir)) {
      fs.rmSync(testConfig.dataDir, { recursive: true, force: true });
    }
    
    fs.mkdirSync(testDir, { recursive: true });
    fs.mkdirSync(testConfig.dataDir, { recursive: true });

    db = new JSONDatabase();
  });

  afterEach(() => {
    // Reset singleton before cleanup
    resetDatabase();
    
    // Clean up
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
    if (fs.existsSync(testConfig.dataDir)) {
      fs.rmSync(testConfig.dataDir, { recursive: true, force: true });
    }
  });

  describe('Jest Project Scanning', () => {
    it('should detect Jest framework from package.json', () => {
      // Create a Node.js project with Jest
      const packageJson = {
        name: 'test-project',
        devDependencies: {
          jest: '^29.0.0',
        },
      };
      fs.writeFileSync(path.join(testDir, 'package.json'), JSON.stringify(packageJson));

      // Create test files
      fs.mkdirSync(path.join(testDir, 'src'), { recursive: true });
      fs.writeFileSync(path.join(testDir, 'src', 'app.test.ts'), '// test file');
      fs.writeFileSync(path.join(testDir, 'src', 'utils.spec.ts'), '// test file');

      const project = db.addProject('Test Project', testDir);
      const result = scanProject(project.id);

      expect(result.testsFound).toBe(2);
      expect(result.tests.every(t => t.framework === 'jest')).toBe(true);
      expect(result.tests.map(t => t.file_path).sort()).toEqual([
        'src/app.test.ts',
        'src/utils.spec.ts',
      ]);
    });

    it('should find test files in nested directories', () => {
      const packageJson = {
        name: 'test-project',
        devDependencies: { jest: '^29.0.0' },
      };
      fs.writeFileSync(path.join(testDir, 'package.json'), JSON.stringify(packageJson));

      // Create nested test files
      fs.mkdirSync(path.join(testDir, 'src', 'components'), { recursive: true });
      fs.mkdirSync(path.join(testDir, 'src', 'utils'), { recursive: true });
      fs.writeFileSync(path.join(testDir, 'src', 'components', 'Button.test.tsx'), '');
      fs.writeFileSync(path.join(testDir, 'src', 'utils', 'helper.test.ts'), '');

      const project = db.addProject('Test Project', testDir);
      const result = scanProject(project.id);

      expect(result.testsFound).toBe(2);
    });

    it('should skip node_modules directory', () => {
      const packageJson = {
        name: 'test-project',
        devDependencies: { jest: '^29.0.0' },
      };
      fs.writeFileSync(path.join(testDir, 'package.json'), JSON.stringify(packageJson));

      // Create test file in node_modules (should be ignored)
      fs.mkdirSync(path.join(testDir, 'node_modules', 'some-package'), { recursive: true });
      fs.writeFileSync(path.join(testDir, 'node_modules', 'some-package', 'test.spec.js'), '');

      // Create valid test file
      fs.mkdirSync(path.join(testDir, 'src'), { recursive: true });
      fs.writeFileSync(path.join(testDir, 'src', 'app.test.js'), '');

      const project = db.addProject('Test Project', testDir);
      const result = scanProject(project.id);

      expect(result.testsFound).toBe(1);
      expect(result.tests[0].file_path).toBe('src/app.test.js');
    });

    it('should skip build and dist directories', () => {
      const packageJson = {
        name: 'test-project',
        devDependencies: { jest: '^29.0.0' },
      };
      fs.writeFileSync(path.join(testDir, 'package.json'), JSON.stringify(packageJson));

      // Create test files in ignored directories
      fs.mkdirSync(path.join(testDir, 'dist'), { recursive: true });
      fs.mkdirSync(path.join(testDir, 'build'), { recursive: true });
      fs.writeFileSync(path.join(testDir, 'dist', 'app.test.js'), '');
      fs.writeFileSync(path.join(testDir, 'build', 'app.test.js'), '');

      // Create valid test file
      fs.mkdirSync(path.join(testDir, 'src'), { recursive: true });
      fs.writeFileSync(path.join(testDir, 'src', 'app.test.js'), '');

      const project = db.addProject('Test Project', testDir);
      const result = scanProject(project.id);

      expect(result.testsFound).toBe(1);
    });
  });

  describe('Vitest Project Scanning', () => {
    it('should detect Vitest framework', () => {
      const packageJson = {
        name: 'test-project',
        devDependencies: {
          vitest: '^0.34.0',
        },
      };
      fs.writeFileSync(path.join(testDir, 'package.json'), JSON.stringify(packageJson));

      fs.mkdirSync(path.join(testDir, 'src'), { recursive: true });
      fs.writeFileSync(path.join(testDir, 'src', 'app.test.ts'), '');

      const project = db.addProject('Test Project', testDir);
      const result = scanProject(project.id);

      expect(result.testsFound).toBe(1);
      expect(result.tests[0].framework).toBe('vitest');
    });
  });

  describe('Mocha Project Scanning', () => {
    it('should detect Mocha framework', () => {
      const packageJson = {
        name: 'test-project',
        devDependencies: {
          mocha: '^10.0.0',
        },
      };
      fs.writeFileSync(path.join(testDir, 'package.json'), JSON.stringify(packageJson));

      fs.mkdirSync(path.join(testDir, 'test'), { recursive: true });
      fs.writeFileSync(path.join(testDir, 'test', 'app.test.js'), '');

      const project = db.addProject('Test Project', testDir);
      const result = scanProject(project.id);

      expect(result.testsFound).toBe(1);
      expect(result.tests[0].framework).toBe('mocha');
    });
  });

  describe('Playwright Project Scanning', () => {
    it('should detect Playwright framework', () => {
      const packageJson = {
        name: 'test-project',
        devDependencies: {
          '@playwright/test': '^1.40.0',
        },
      };
      fs.writeFileSync(path.join(testDir, 'package.json'), JSON.stringify(packageJson));

      fs.mkdirSync(path.join(testDir, 'e2e'), { recursive: true });
      fs.writeFileSync(path.join(testDir, 'e2e', 'login.spec.ts'), '');

      const project = db.addProject('Test Project', testDir);
      const result = scanProject(project.id);

      expect(result.testsFound).toBe(1);
      expect(result.tests[0].framework).toBe('playwright');
    });
  });

  describe('Cypress Project Scanning', () => {
    it('should detect Cypress framework', () => {
      const packageJson = {
        name: 'test-project',
        devDependencies: {
          cypress: '^13.0.0',
        },
      };
      fs.writeFileSync(path.join(testDir, 'package.json'), JSON.stringify(packageJson));

      fs.mkdirSync(path.join(testDir, 'cypress', 'e2e'), { recursive: true });
      fs.writeFileSync(path.join(testDir, 'cypress', 'e2e', 'spec.cy.ts'), '');

      const project = db.addProject('Test Project', testDir);
      const result = scanProject(project.id);

      expect(result.testsFound).toBe(1);
      expect(result.tests[0].framework).toBe('cypress');
    });
  });

  describe('Python Project Scanning', () => {
    it('should detect pytest framework', () => {
      const packageJson = {
        dependencies: {
          pytest: '^7.0.0',
        },
      };
      fs.writeFileSync(path.join(testDir, 'package.json'), JSON.stringify(packageJson));

      fs.mkdirSync(path.join(testDir, 'tests'), { recursive: true });
      fs.writeFileSync(path.join(testDir, 'tests', 'test_app.py'), '');
      fs.writeFileSync(path.join(testDir, 'tests', 'test_utils.py'), '');

      const project = db.addProject('Test Project', testDir);
      const result = scanProject(project.id);

      expect(result.testsFound).toBe(2);
      expect(result.tests.every(t => t.framework === 'pytest')).toBe(true);
    });

    it('should detect unittest framework', () => {
      const packageJson = {
        dependencies: {
          unittest: '^1.0.0',
        },
      };
      fs.writeFileSync(path.join(testDir, 'package.json'), JSON.stringify(packageJson));

      fs.mkdirSync(path.join(testDir, 'tests'), { recursive: true });
      fs.writeFileSync(path.join(testDir, 'tests', 'test_app.py'), '');

      const project = db.addProject('Test Project', testDir);
      const result = scanProject(project.id);

      expect(result.testsFound).toBe(1);
      expect(result.tests[0].framework).toBe('unittest');
    });
  });

  describe('Project Without Framework', () => {
    it('should still find test files without framework detection', () => {
      // No package.json, but has test files
      fs.mkdirSync(path.join(testDir, 'tests'), { recursive: true });
      fs.writeFileSync(path.join(testDir, 'tests', 'app.test.js'), '');
      fs.writeFileSync(path.join(testDir, 'tests', 'utils.spec.js'), '');

      const project = db.addProject('Test Project', testDir);
      const result = scanProject(project.id);

      expect(result.testsFound).toBe(2);
      expect(result.tests.every(t => t.framework === null)).toBe(true);
    });
  });

  describe('Update Last Scanned', () => {
    it('should update project last_scanned timestamp', () => {
      const packageJson = {
        devDependencies: { jest: '^29.0.0' },
      };
      fs.writeFileSync(path.join(testDir, 'package.json'), JSON.stringify(packageJson));
      fs.mkdirSync(path.join(testDir, 'src'), { recursive: true });
      fs.writeFileSync(path.join(testDir, 'src', 'app.test.ts'), '');

      const project = db.addProject('Test Project', testDir);
      expect(project.last_scanned).toBeNull();

      scanProject(project.id);
      // Get the singleton instance to check the updated value
      const { getDatabase } = require('../database');
      const updated = getDatabase().getProject(project.id);

      expect(updated?.last_scanned).toBeGreaterThan(0);
    });
  });

  describe('Remove Existing Tests', () => {
    it('should remove old tests before adding new ones', () => {
      const packageJson = {
        devDependencies: { jest: '^29.0.0' },
      };
      fs.writeFileSync(path.join(testDir, 'package.json'), JSON.stringify(packageJson));

      // First scan with one test
      fs.mkdirSync(path.join(testDir, 'src'), { recursive: true });
      fs.writeFileSync(path.join(testDir, 'src', 'old.test.ts'), '');

      const project = db.addProject('Test Project', testDir);
      const result1 = scanProject(project.id);
      expect(result1.testsFound).toBe(1);

      // Remove old test and add new one
      fs.unlinkSync(path.join(testDir, 'src', 'old.test.ts'));
      fs.writeFileSync(path.join(testDir, 'src', 'new.test.ts'), '');

      const result2 = scanProject(project.id);
      expect(result2.testsFound).toBe(1);
      expect(result2.tests[0].file_path).toBe('src/new.test.ts');
    });
  });

  describe('Error Handling', () => {
    it('should throw error for non-existent project', () => {
      expect(() => {
        scanProject(999);
      }).toThrow('Project with id 999 not found');
    });

    it('should throw error for non-existent project path', () => {
      const project = db.addProject('Test', '/non/existent/path');

      expect(() => {
        scanProject(project.id);
      }).toThrow('Project path does not exist');
    });
  });

  describe('Scan All Projects', () => {
    it('should scan all projects in the database', () => {
      // Create first project
      const testDir1 = path.join(testDir, 'project1');
      fs.mkdirSync(testDir1, { recursive: true });
      fs.writeFileSync(
        path.join(testDir1, 'package.json'),
        JSON.stringify({ devDependencies: { jest: '^29.0.0' } })
      );
      fs.mkdirSync(path.join(testDir1, 'src'), { recursive: true });
      fs.writeFileSync(path.join(testDir1, 'src', 'test1.test.ts'), '');

      // Create second project
      const testDir2 = path.join(testDir, 'project2');
      fs.mkdirSync(testDir2, { recursive: true });
      fs.writeFileSync(
        path.join(testDir2, 'package.json'),
        JSON.stringify({ devDependencies: { vitest: '^0.34.0' } })
      );
      fs.mkdirSync(path.join(testDir2, 'src'), { recursive: true });
      fs.writeFileSync(path.join(testDir2, 'src', 'test2.test.ts'), '');

      const project1 = db.addProject('Project 1', testDir1);
      const project2 = db.addProject('Project 2', testDir2);

      const results = scanAllProjects();

      expect(results).toHaveLength(2);
      expect(results[0].project.id).toBe(project1.id);
      expect(results[0].testsFound).toBe(1);
      expect(results[1].project.id).toBe(project2.id);
      expect(results[1].testsFound).toBe(1);
    });

    it('should continue scanning even if one project fails', () => {
      // Create valid project
      const testDir1 = path.join(testDir, 'project1');
      fs.mkdirSync(testDir1, { recursive: true });
      fs.writeFileSync(
        path.join(testDir1, 'package.json'),
        JSON.stringify({ devDependencies: { jest: '^29.0.0' } })
      );
      fs.writeFileSync(path.join(testDir1, 'test.spec.ts'), '');

      const project1 = db.addProject('Valid Project', testDir1);
      const project2 = db.addProject('Invalid Project', '/non/existent');

      // Mock console.error to suppress error output in tests
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const results = scanAllProjects();

      // Should have result for valid project only
      expect(results).toHaveLength(1);
      expect(results[0].project.id).toBe(project1.id);

      // Verify error was logged
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it('should return empty array when no projects exist', () => {
      const results = scanAllProjects();
      expect(results).toEqual([]);
    });
  });

  describe('Test File Pattern Detection', () => {
    it('should detect .test. pattern in various extensions', () => {
      const packageJson = {
        devDependencies: { jest: '^29.0.0' },
      };
      fs.writeFileSync(path.join(testDir, 'package.json'), JSON.stringify(packageJson));

      fs.mkdirSync(path.join(testDir, 'src'), { recursive: true });
      fs.writeFileSync(path.join(testDir, 'src', 'app.test.js'), '');
      fs.writeFileSync(path.join(testDir, 'src', 'utils.test.ts'), '');
      fs.writeFileSync(path.join(testDir, 'src', 'component.test.tsx'), '');
      fs.writeFileSync(path.join(testDir, 'src', 'hook.test.jsx'), '');

      const project = db.addProject('Test Project', testDir);
      const result = scanProject(project.id);

      expect(result.testsFound).toBe(4);
    });

    it('should detect .spec. pattern in various extensions', () => {
      const packageJson = {
        devDependencies: { jest: '^29.0.0' },
      };
      fs.writeFileSync(path.join(testDir, 'package.json'), JSON.stringify(packageJson));

      fs.mkdirSync(path.join(testDir, 'src'), { recursive: true });
      fs.writeFileSync(path.join(testDir, 'src', 'app.spec.js'), '');
      fs.writeFileSync(path.join(testDir, 'src', 'utils.spec.ts'), '');

      const project = db.addProject('Test Project', testDir);
      const result = scanProject(project.id);

      expect(result.testsFound).toBe(2);
    });

    it('should not detect non-test files', () => {
      const packageJson = {
        devDependencies: { jest: '^29.0.0' },
      };
      fs.writeFileSync(path.join(testDir, 'package.json'), JSON.stringify(packageJson));

      fs.mkdirSync(path.join(testDir, 'src'), { recursive: true });
      fs.writeFileSync(path.join(testDir, 'src', 'app.ts'), '// not a test');
      fs.writeFileSync(path.join(testDir, 'src', 'utils.js'), '// not a test');
      fs.writeFileSync(path.join(testDir, 'src', 'component.tsx'), '// not a test');

      const project = db.addProject('Test Project', testDir);
      const result = scanProject(project.id);

      expect(result.testsFound).toBe(0);
    });
  });
});

