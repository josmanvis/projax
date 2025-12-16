/* eslint-disable @typescript-eslint/no-var-requires */
import request from 'supertest';
import express, { Express } from 'express';
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
import apiRouter from '../routes';
import { JSONDatabase, resetDatabase } from '../database';

describe('API Routes', () => {
  let app: Express;
  let testProjectDir: string;

  beforeEach(() => {
    // Create test directories with truly unique names
    const uniqueId = `${Date.now()}-${process.hrtime.bigint()}-${Math.random().toString(36).substring(7)}`;
    testConfig.dataDir = path.join(os.tmpdir(), `projax-api-test-${uniqueId}`);
    testProjectDir = path.join(testConfig.dataDir, 'test-project');
    
    // Ensure clean slate
    if (fs.existsSync(testConfig.dataDir)) {
      fs.rmSync(testConfig.dataDir, { recursive: true, force: true });
    }
    
    fs.mkdirSync(testProjectDir, { recursive: true });

    // Create Express app with routes
    app = express();
    app.use(express.json());
    app.use('/api', apiRouter);

    // Initialize database
    new JSONDatabase();
  });

  afterEach(() => {
    // Reset singleton before cleanup
    resetDatabase();
    
    // Clean up
    if (fs.existsSync(testConfig.dataDir)) {
      fs.rmSync(testConfig.dataDir, { recursive: true, force: true });
    }
  });

  describe('GET /api/projects', () => {
    it('should return empty array when no projects exist', async () => {
      const response = await request(app).get('/api/projects');

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it('should return all projects', async () => {
      // Add projects directly via database
      const db = new JSONDatabase();
      db.addProject('Project 1', testProjectDir);
      const dir2 = path.join(testConfig.dataDir, 'project2');
      fs.mkdirSync(dir2, { recursive: true });
      db.addProject('Project 2', dir2);

      const response = await request(app).get('/api/projects');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[0].name).toBe('Project 1');
      expect(response.body[1].name).toBe('Project 2');
    });
  });

  describe('POST /api/projects', () => {
    it('should create a new project', async () => {
      const response = await request(app)
        .post('/api/projects')
        .send({
          name: 'My Project',
          path: testProjectDir,
        });

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        id: 1,
        name: 'My Project',
        path: testProjectDir,
      });
    });

    it('should return 400 if name is missing', async () => {
      const response = await request(app)
        .post('/api/projects')
        .send({
          path: testProjectDir,
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Name and path are required');
    });

    it('should return 400 if path is missing', async () => {
      const response = await request(app)
        .post('/api/projects')
        .send({
          name: 'My Project',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Name and path are required');
    });

    it('should return 400 if path does not exist', async () => {
      const response = await request(app)
        .post('/api/projects')
        .send({
          name: 'My Project',
          path: '/non/existent/path',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Path does not exist');
    });

    it('should return 400 if path is not a directory', async () => {
      const filePath = path.join(testConfig.dataDir, 'file.txt');
      fs.writeFileSync(filePath, 'test');

      const response = await request(app)
        .post('/api/projects')
        .send({
          name: 'My Project',
          path: filePath,
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Path must be a directory');
    });

    it('should return 409 if project with path already exists', async () => {
      // Create first project
      await request(app)
        .post('/api/projects')
        .send({
          name: 'Project 1',
          path: testProjectDir,
        });

      // Try to create duplicate
      const response = await request(app)
        .post('/api/projects')
        .send({
          name: 'Project 2',
          path: testProjectDir,
        });

      expect(response.status).toBe(409);
      expect(response.body.error).toBe('Project with this path already exists');
    });
  });

  describe('GET /api/projects/:id', () => {
    it('should return a project by ID', async () => {
      const db = new JSONDatabase();
      const project = db.addProject('Test Project', testProjectDir);

      const response = await request(app).get(`/api/projects/${project.id}`);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        id: project.id,
        name: 'Test Project',
      });
    });

    it('should return 404 for non-existent project', async () => {
      const response = await request(app).get('/api/projects/999');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Project not found');
    });

    it('should return 404 for invalid ID format', async () => {
      const response = await request(app).get('/api/projects/invalid');

      // The route regex only matches numeric IDs, so non-numeric IDs return 404
      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/projects/:id', () => {
    it('should update project name', async () => {
      const db = new JSONDatabase();
      const project = db.addProject('Old Name', testProjectDir);

      const response = await request(app)
        .put(`/api/projects/${project.id}`)
        .send({ name: 'New Name' });

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('New Name');
    });

    it('should update project description', async () => {
      const db = new JSONDatabase();
      const project = db.addProject('Test', testProjectDir);

      const response = await request(app)
        .put(`/api/projects/${project.id}`)
        .send({ description: 'A test project' });

      expect(response.status).toBe(200);
      expect(response.body.description).toBe('A test project');
    });

    it('should update project framework', async () => {
      const db = new JSONDatabase();
      const project = db.addProject('Test', testProjectDir);

      const response = await request(app)
        .put(`/api/projects/${project.id}`)
        .send({ framework: 'Node.js' });

      expect(response.status).toBe(200);
      expect(response.body.framework).toBe('Node.js');
    });

    it('should update project tags', async () => {
      const db = new JSONDatabase();
      const project = db.addProject('Test', testProjectDir);

      const response = await request(app)
        .put(`/api/projects/${project.id}`)
        .send({ tags: ['web', 'api'] });

      expect(response.status).toBe(200);
      expect(response.body.tags).toEqual(['web', 'api']);
    });

    it('should update multiple fields at once', async () => {
      const db = new JSONDatabase();
      const project = db.addProject('Test', testProjectDir);

      const response = await request(app)
        .put(`/api/projects/${project.id}`)
        .send({
          name: 'Updated Name',
          description: 'Updated description',
          framework: 'React',
          tags: ['frontend'],
        });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        name: 'Updated Name',
        description: 'Updated description',
        framework: 'React',
        tags: ['frontend'],
      });
    });

    it('should return 400 when no fields to update', async () => {
      const db = new JSONDatabase();
      const project = db.addProject('Test', testProjectDir);

      const response = await request(app)
        .put(`/api/projects/${project.id}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('No valid fields to update');
    });

    it('should return 404 for invalid ID format', async () => {
      const response = await request(app)
        .put('/api/projects/invalid')
        .send({ name: 'New Name' });

      // The route regex only matches numeric IDs, so non-numeric IDs return 404
      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/projects/:id', () => {
    it('should delete a project', async () => {
      const db = new JSONDatabase();
      const project = db.addProject('Test', testProjectDir);

      const response = await request(app).delete(`/api/projects/${project.id}`);

      expect(response.status).toBe(204);
      // Use getDatabase() to verify deletion from the singleton
      const { getDatabase } = require('../database');
      expect(getDatabase().getProject(project.id)).toBeNull();
    });

    it('should return 404 for non-existent project', async () => {
      const response = await request(app).delete('/api/projects/999');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Project not found');
    });

    it('should return 404 for invalid ID format', async () => {
      const response = await request(app).delete('/api/projects/invalid');

      // The route regex only matches numeric IDs, so non-numeric IDs return 404
      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/projects/:id/tests', () => {
    it('should return tests for a project', async () => {
      const db = new JSONDatabase();
      const project = db.addProject('Test', testProjectDir);
      db.addTest(project.id, 'test1.js', 'jest');
      db.addTest(project.id, 'test2.js', 'jest');

      const response = await request(app).get(`/api/projects/${project.id}/tests`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
    });

    it('should return empty array when no tests exist', async () => {
      const db = new JSONDatabase();
      const project = db.addProject('Test', testProjectDir);

      const response = await request(app).get(`/api/projects/${project.id}/tests`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it('should return 404 for non-existent project', async () => {
      const response = await request(app).get('/api/projects/999/tests');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Project not found');
    });
  });

  describe('GET /api/projects/:id/ports', () => {
    it('should return ports for a project', async () => {
      const db = new JSONDatabase();
      const project = db.addProject('Test', testProjectDir);
      db.addProjectPort(project.id, 3000, 'package.json', 'dev');
      db.addProjectPort(project.id, 8080, 'package.json', 'api');

      const response = await request(app).get(`/api/projects/${project.id}/ports`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body.map((p: any) => p.port)).toEqual([3000, 8080]);
    });

    it('should return empty array when no ports exist', async () => {
      const db = new JSONDatabase();
      const project = db.addProject('Test', testProjectDir);

      const response = await request(app).get(`/api/projects/${project.id}/ports`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it('should return 404 for non-existent project', async () => {
      const response = await request(app).get('/api/projects/999/ports');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Project not found');
    });
  });

  describe('POST /api/projects/:id/scan', () => {
    it('should scan a project for tests', async () => {
      // Create project with test files
      const packageJson = {
        devDependencies: { jest: '^29.0.0' },
      };
      fs.writeFileSync(path.join(testProjectDir, 'package.json'), JSON.stringify(packageJson));
      fs.mkdirSync(path.join(testProjectDir, 'src'), { recursive: true });
      fs.writeFileSync(path.join(testProjectDir, 'src', 'app.test.ts'), '');

      const db = new JSONDatabase();
      const project = db.addProject('Test', testProjectDir);

      const response = await request(app).post(`/api/projects/${project.id}/scan`);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        testsFound: 1,
      });
      expect(response.body.tests).toHaveLength(1);
      expect(response.body.project.last_scanned).toBeGreaterThan(0);
    });

    it('should return 404 for invalid ID format', async () => {
      const response = await request(app).post('/api/projects/invalid/scan');

      // The route regex only matches numeric IDs, so non-numeric IDs return 404
      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/projects/scan/all', () => {
    it('should scan all projects', async () => {
      // Create two projects with test files
      const packageJson = { devDependencies: { jest: '^29.0.0' } };
      
      const dir1 = path.join(testConfig.dataDir, 'project1');
      fs.mkdirSync(dir1, { recursive: true });
      fs.writeFileSync(path.join(dir1, 'package.json'), JSON.stringify(packageJson));
      fs.writeFileSync(path.join(dir1, 'test.spec.ts'), '');

      const dir2 = path.join(testConfig.dataDir, 'project2');
      fs.mkdirSync(dir2, { recursive: true });
      fs.writeFileSync(path.join(dir2, 'package.json'), JSON.stringify(packageJson));
      fs.writeFileSync(path.join(dir2, 'test.spec.ts'), '');

      const db = new JSONDatabase();
      db.addProject('Project 1', dir1);
      db.addProject('Project 2', dir2);

      const response = await request(app).post('/api/projects/scan/all');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[0].testsFound).toBe(1);
      expect(response.body[1].testsFound).toBe(1);
    });

    it('should return empty array when no projects exist', async () => {
      const response = await request(app).post('/api/projects/scan/all');

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });
  });

  describe('GET /api/projects/tags', () => {
    it('should return all unique tags', async () => {
      const db = new JSONDatabase();
      const dir1 = path.join(testConfig.dataDir, 'p1');
      const dir2 = path.join(testConfig.dataDir, 'p2');
      fs.mkdirSync(dir1, { recursive: true });
      fs.mkdirSync(dir2, { recursive: true });

      db.addProject('Project 1', dir1);
      db.updateProject(1, { tags: ['web', 'api'] });
      
      db.addProject('Project 2', dir2);
      db.updateProject(2, { tags: ['api', 'mobile'] });

      const response = await request(app).get('/api/projects/tags');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(['api', 'mobile', 'web']);
    });

    it('should return empty array when no tags exist', async () => {
      const response = await request(app).get('/api/projects/tags');

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });
  });

  describe('GET /api/settings', () => {
    it('should return all settings', async () => {
      const db = new JSONDatabase();
      db.setSetting('theme', 'dark');
      db.setSetting('language', 'en');

      const response = await request(app).get('/api/settings');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        theme: 'dark',
        language: 'en',
      });
    });

    it('should return empty object when no settings exist', async () => {
      const response = await request(app).get('/api/settings');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({});
    });
  });

  describe('PUT /api/settings/:key', () => {
    it('should create a new setting', async () => {
      const response = await request(app)
        .put('/api/settings/theme')
        .send({ value: 'dark' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        key: 'theme',
        value: 'dark',
      });
    });

    it('should update an existing setting', async () => {
      const db = new JSONDatabase();
      db.setSetting('theme', 'dark');

      const response = await request(app)
        .put('/api/settings/theme')
        .send({ value: 'light' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        key: 'theme',
        value: 'light',
      });
    });

    it('should return 400 if value is missing', async () => {
      const response = await request(app)
        .put('/api/settings/theme')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Value is required');
    });

    it('should convert value to string', async () => {
      const response = await request(app)
        .put('/api/settings/count')
        .send({ value: 42 });

      expect(response.status).toBe(200);
      // The response returns the original value, but it's stored as a string in DB
      expect(response.body.value).toBe(42);
      
      // Verify it was actually stored as a string
      const { getDatabase } = require('../database');
      expect(getDatabase().getSetting('count')).toBe('42');
    });
  });
});

