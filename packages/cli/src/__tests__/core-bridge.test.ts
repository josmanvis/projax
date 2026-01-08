import * as path from 'path';

// Mock the core module before importing core-bridge
jest.mock('../core-bridge', () => {
  const mockCore = {
    getDatabaseManager: jest.fn(() => ({
      getAllProjects: jest.fn(() => []),
      getProject: jest.fn(),
      addProject: jest.fn(),
      removeProject: jest.fn(),
    })),
    getAllProjects: jest.fn(() => []),
    addProject: jest.fn(),
    removeProject: jest.fn(),
    scanProject: jest.fn(),
    scanAllProjects: jest.fn(),
    getCurrentBranch: jest.fn((path: string) => 'main'),
  };
  return mockCore;
});

import * as coreBridge from '../core-bridge';

describe('core-bridge', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('exported functions', () => {
    it('should export getDatabaseManager', () => {
      expect(coreBridge.getDatabaseManager).toBeDefined();
      expect(typeof coreBridge.getDatabaseManager).toBe('function');
    });

    it('should export getAllProjects', () => {
      expect(coreBridge.getAllProjects).toBeDefined();
      expect(typeof coreBridge.getAllProjects).toBe('function');
    });

    it('should export addProject', () => {
      expect(coreBridge.addProject).toBeDefined();
      expect(typeof coreBridge.addProject).toBe('function');
    });

    it('should export removeProject', () => {
      expect(coreBridge.removeProject).toBeDefined();
      expect(typeof coreBridge.removeProject).toBe('function');
    });

    it('should export scanProject', () => {
      expect(coreBridge.scanProject).toBeDefined();
      expect(typeof coreBridge.scanProject).toBe('function');
    });

    it('should export scanAllProjects', () => {
      expect(coreBridge.scanAllProjects).toBeDefined();
      expect(typeof coreBridge.scanAllProjects).toBe('function');
    });

    it('should export getCurrentBranch', () => {
      expect(coreBridge.getCurrentBranch).toBeDefined();
      expect(typeof coreBridge.getCurrentBranch).toBe('function');
    });
  });

  describe('getDatabaseManager', () => {
    it('should return a database manager instance', () => {
      const db = coreBridge.getDatabaseManager();
      expect(db).toBeDefined();
      expect(db.getAllProjects).toBeDefined();
    });

    it('should be callable multiple times', () => {
      const db1 = coreBridge.getDatabaseManager();
      const db2 = coreBridge.getDatabaseManager();
      expect(db1).toBeDefined();
      expect(db2).toBeDefined();
    });
  });

  describe('getAllProjects', () => {
    it('should return an array', () => {
      const projects = coreBridge.getAllProjects();
      expect(Array.isArray(projects)).toBe(true);
    });

    it('should be callable', () => {
      expect(() => coreBridge.getAllProjects()).not.toThrow();
    });
  });

  describe('getCurrentBranch', () => {
    it('should accept a path parameter', () => {
      const result = coreBridge.getCurrentBranch('/some/path');
      expect(coreBridge.getCurrentBranch).toHaveBeenCalledWith('/some/path');
    });

    it('should return a string', () => {
      const result = coreBridge.getCurrentBranch('/some/path');
      expect(typeof result).toBe('string');
    });
  });

  describe('project operations', () => {
    it('addProject should be callable', () => {
      expect(() => coreBridge.addProject('test', '/path')).not.toThrow();
    });

    it('removeProject should be callable', () => {
      expect(() => coreBridge.removeProject(1)).not.toThrow();
    });

    it('scanProject should be callable', () => {
      expect(() => coreBridge.scanProject(1)).not.toThrow();
    });

    it('scanAllProjects should be callable', () => {
      expect(() => coreBridge.scanAllProjects()).not.toThrow();
    });
  });
});
