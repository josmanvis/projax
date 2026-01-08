/* eslint-disable @typescript-eslint/no-var-requires */
import * as fs from 'fs';
import { execSync } from 'child_process';
import {
  getSetting,
  setSetting,
  getAllSettings,
  getEditorSettings,
  setEditorSettings,
  getBrowserSettings,
  setBrowserSettings,
  getAppSettings,
  setAppSettings,
  EditorSettings,
  BrowserSettings,
} from '../settings';

// Mock modules
jest.mock('fs');
jest.mock('child_process');
const mockedFs = fs as jest.Mocked<typeof fs>;
const mockedExecSync = execSync as jest.MockedFunction<typeof execSync>;

describe('settings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedFs.existsSync.mockReturnValue(false);
    // Reset the singleton
    (require('../database') as any).dbManager = null;
  });

  describe('getSetting', () => {
    it('should get a setting value', () => {
      const settings = {
        'editor.type': 'vscode',
        'browser.type': 'chrome',
      };

      mockedExecSync.mockReturnValue(JSON.stringify(settings));

      const result = getSetting('editor.type');
      expect(result).toBe('vscode');
    });

    it('should return null for non-existent setting', () => {
      mockedExecSync.mockReturnValue(JSON.stringify({}));

      const result = getSetting('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('setSetting', () => {
    it('should set a setting value', () => {
      mockedExecSync.mockReturnValue('');

      expect(() => setSetting('editor.type', 'cursor')).not.toThrow();
      expect(mockedExecSync).toHaveBeenCalled();
    });
  });

  describe('getAllSettings', () => {
    it('should get all settings', () => {
      const settings = {
        'editor.type': 'vscode',
        'browser.type': 'chrome',
        'editor.customPath': '/path/to/editor',
      };

      mockedExecSync.mockReturnValue(JSON.stringify(settings));

      const result = getAllSettings();
      expect(result).toEqual(settings);
      expect(Object.keys(result).length).toBe(3);
    });

    it('should return empty object when no settings exist', () => {
      mockedExecSync.mockReturnValue(JSON.stringify({}));

      const result = getAllSettings();
      expect(result).toEqual({});
    });
  });

  describe('getEditorSettings', () => {
    it('should get editor settings with default values', () => {
      mockedExecSync.mockReturnValue(JSON.stringify({}));

      const result = getEditorSettings();
      expect(result.type).toBe('vscode');
      expect(result.customPath).toBeUndefined();
    });

    it('should get editor settings with custom values', () => {
      const settings = {
        'editor.type': 'cursor',
        'editor.customPath': '/path/to/cursor',
      };

      mockedExecSync.mockReturnValue(JSON.stringify(settings));

      const result = getEditorSettings();
      expect(result.type).toBe('cursor');
      expect(result.customPath).toBe('/path/to/cursor');
    });

    it('should handle only type being set', () => {
      const settings = {
        'editor.type': 'zed',
      };

      mockedExecSync.mockReturnValue(JSON.stringify(settings));

      const result = getEditorSettings();
      expect(result.type).toBe('zed');
      expect(result.customPath).toBeUndefined();
    });

    it('should support all editor types', () => {
      const editorTypes = ['vscode', 'cursor', 'windsurf', 'zed', 'custom'];

      editorTypes.forEach(type => {
        const settings = { 'editor.type': type };
        mockedExecSync.mockReturnValue(JSON.stringify(settings));

        const result = getEditorSettings();
        expect(result.type).toBe(type);
      });
    });
  });

  describe('setEditorSettings', () => {
    it('should set editor type', () => {
      mockedExecSync.mockReturnValue('');

      const settings: EditorSettings = { type: 'cursor' };
      expect(() => setEditorSettings(settings)).not.toThrow();
      expect(mockedExecSync).toHaveBeenCalled();
    });

    it('should set editor type and custom path', () => {
      mockedExecSync.mockReturnValue('');

      const settings: EditorSettings = {
        type: 'custom',
        customPath: '/usr/local/bin/myeditor',
      };

      expect(() => setEditorSettings(settings)).not.toThrow();
      expect(mockedExecSync).toHaveBeenCalledTimes(2);
    });

    it('should handle setting without custom path', () => {
      mockedExecSync.mockReturnValue('');

      const settings: EditorSettings = { type: 'vscode' };
      expect(() => setEditorSettings(settings)).not.toThrow();
      expect(mockedExecSync).toHaveBeenCalledTimes(1);
    });
  });

  describe('getBrowserSettings', () => {
    it('should get browser settings with default values', () => {
      mockedExecSync.mockReturnValue(JSON.stringify({}));

      const result = getBrowserSettings();
      expect(result.type).toBe('chrome');
      expect(result.customPath).toBeUndefined();
    });

    it('should get browser settings with custom values', () => {
      const settings = {
        'browser.type': 'firefox',
        'browser.customPath': '/path/to/firefox',
      };

      mockedExecSync.mockReturnValue(JSON.stringify(settings));

      const result = getBrowserSettings();
      expect(result.type).toBe('firefox');
      expect(result.customPath).toBe('/path/to/firefox');
    });

    it('should support all browser types', () => {
      const browserTypes = ['chrome', 'firefox', 'safari', 'edge', 'custom'];

      browserTypes.forEach(type => {
        const settings = { 'browser.type': type };
        mockedExecSync.mockReturnValue(JSON.stringify(settings));

        const result = getBrowserSettings();
        expect(result.type).toBe(type);
      });
    });
  });

  describe('setBrowserSettings', () => {
    it('should set browser type', () => {
      mockedExecSync.mockReturnValue('');

      const settings: BrowserSettings = { type: 'firefox' };
      expect(() => setBrowserSettings(settings)).not.toThrow();
      expect(mockedExecSync).toHaveBeenCalled();
    });

    it('should set browser type and custom path', () => {
      mockedExecSync.mockReturnValue('');

      const settings: BrowserSettings = {
        type: 'custom',
        customPath: '/usr/local/bin/mybrowser',
      };

      expect(() => setBrowserSettings(settings)).not.toThrow();
      expect(mockedExecSync).toHaveBeenCalledTimes(2);
    });
  });

  describe('getAppSettings', () => {
    it('should get all app settings with defaults', () => {
      mockedExecSync.mockReturnValue(JSON.stringify({}));

      const result = getAppSettings();
      expect(result.editor.type).toBe('vscode');
      expect(result.browser.type).toBe('chrome');
    });

    it('should get all app settings with custom values', () => {
      const settings = {
        'editor.type': 'cursor',
        'editor.customPath': '/path/to/cursor',
        'browser.type': 'firefox',
        'browser.customPath': '/path/to/firefox',
      };

      mockedExecSync.mockReturnValue(JSON.stringify(settings));

      const result = getAppSettings();
      expect(result.editor.type).toBe('cursor');
      expect(result.editor.customPath).toBe('/path/to/cursor');
      expect(result.browser.type).toBe('firefox');
      expect(result.browser.customPath).toBe('/path/to/firefox');
    });

    it('should return complete app settings structure', () => {
      mockedExecSync.mockReturnValue(JSON.stringify({}));

      const result = getAppSettings();
      expect(result).toHaveProperty('editor');
      expect(result).toHaveProperty('browser');
      expect(result.editor).toHaveProperty('type');
      expect(result.browser).toHaveProperty('type');
    });
  });

  describe('setAppSettings', () => {
    it('should set both editor and browser settings', () => {
      mockedExecSync.mockReturnValue('');

      const settings = {
        editor: { type: 'cursor' as const },
        browser: { type: 'firefox' as const },
      };

      expect(() => setAppSettings(settings)).not.toThrow();
      expect(mockedExecSync).toHaveBeenCalledTimes(2);
    });

    it('should set all settings including custom paths', () => {
      mockedExecSync.mockReturnValue('');

      const settings = {
        editor: {
          type: 'custom' as const,
          customPath: '/path/to/editor',
        },
        browser: {
          type: 'custom' as const,
          customPath: '/path/to/browser',
        },
      };

      expect(() => setAppSettings(settings)).not.toThrow();
      expect(mockedExecSync).toHaveBeenCalledTimes(4);
    });
  });

  describe('type definitions', () => {
    it('should allow valid editor types', () => {
      const validTypes: Array<EditorSettings['type']> = [
        'vscode',
        'cursor',
        'windsurf',
        'zed',
        'custom',
      ];

      validTypes.forEach(type => {
        const settings: EditorSettings = { type };
        expect(settings.type).toBe(type);
      });
    });

    it('should allow valid browser types', () => {
      const validTypes: Array<BrowserSettings['type']> = [
        'chrome',
        'firefox',
        'safari',
        'edge',
        'custom',
      ];

      validTypes.forEach(type => {
        const settings: BrowserSettings = { type };
        expect(settings.type).toBe(type);
      });
    });
  });
});

