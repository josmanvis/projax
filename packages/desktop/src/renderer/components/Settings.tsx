import React, { useState, useEffect } from 'react';
import { ElectronAPI } from '../../main/preload';
import './Settings.css';

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

interface SettingsProps {
  onClose: () => void;
}

interface AppSettings {
  editor: {
    type: 'vscode' | 'cursor' | 'windsurf' | 'zed' | 'custom';
    customPath?: string;
  };
  browser: {
    type: 'chrome' | 'firefox' | 'safari' | 'edge' | 'custom';
    customPath?: string;
  };
}

const Settings: React.FC<SettingsProps> = ({ onClose }) => {
  const [settings, setSettings] = useState<AppSettings>({
    editor: { type: 'vscode' },
    browser: { type: 'chrome' },
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [backupLoading, setBackupLoading] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);

  // ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const loadedSettings = await window.electronAPI.getSettings();
      setSettings({
        editor: {
          type: loadedSettings.editor.type as AppSettings['editor']['type'],
          customPath: loadedSettings.editor.customPath,
        },
        browser: {
          type: loadedSettings.browser.type as AppSettings['browser']['type'],
          customPath: loadedSettings.browser.customPath,
        },
      });
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await window.electronAPI.saveSettings(settings);
      onClose();
    } catch (error) {
      console.error('Error saving settings:', error);
      alert(`Failed to save settings: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setSaving(false);
    }
  };

  const handleEditorTypeChange = (type: 'vscode' | 'cursor' | 'windsurf' | 'zed' | 'custom') => {
    setSettings({
      ...settings,
      editor: {
        type,
        customPath: type === 'custom' ? settings.editor.customPath : undefined,
      },
    });
  };

  const handleBrowserTypeChange = (type: 'chrome' | 'firefox' | 'safari' | 'edge' | 'custom') => {
    setSettings({
      ...settings,
      browser: {
        type,
        customPath: type === 'custom' ? settings.browser.customPath : undefined,
      },
    });
  };

  if (loading) {
    return (
      <div className="settings-overlay">
        <div className="settings-modal">
          <div className="loading-state">Loading settings...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h2>Settings</h2>
        <button type="button" onClick={onClose} className="btn btn-secondary">
          Close
        </button>
      </div>

      <div className="settings-content">
          <div className="settings-section">
            <h3>Editor</h3>
            <div className="settings-field">
              <label>Editor Type</label>
              <select
                value={settings.editor.type}
                onChange={(e) => handleEditorTypeChange(e.target.value as any)}
                className="settings-select"
              >
                <option value="vscode">VS Code</option>
                <option value="cursor">Cursor</option>
                <option value="windsurf">Windsurf</option>
                <option value="zed">Zed</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            {settings.editor.type === 'custom' && (
              <div className="settings-field">
                <label>Custom Editor Path</label>
                <input
                  type="text"
                  value={settings.editor.customPath || ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      editor: { ...settings.editor, customPath: e.target.value },
                    })
                  }
                  placeholder="/path/to/editor"
                  className="settings-input"
                />
              </div>
            )}
          </div>

          <div className="settings-section">
            <h3>Browser</h3>
            <div className="settings-field">
              <label>Browser Type</label>
              <select
                value={settings.browser.type}
                onChange={(e) => handleBrowserTypeChange(e.target.value as any)}
                className="settings-select"
              >
                <option value="chrome">Chrome</option>
                <option value="firefox">Firefox</option>
                <option value="safari">Safari</option>
                <option value="edge">Edge</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            {settings.browser.type === 'custom' && (
              <div className="settings-field">
                <label>Custom Browser Path</label>
                <input
                  type="text"
                  value={settings.browser.customPath || ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      browser: { ...settings.browser, customPath: e.target.value },
                    })
                  }
                  placeholder="/path/to/browser"
                  className="settings-input"
                />
              </div>
            )}
          </div>

          <div className="settings-section">
            <h3>Backup & Restore</h3>
            <div className="settings-field">
              <label>Create Backup</label>
              <p className="settings-description">Create a backup of all PROJAX data</p>
              <button
                onClick={async () => {
                  try {
                    setBackupLoading(true);
                    const result = await window.electronAPI.selectDirectory();
                    if (result) {
                      const backupResult = await window.electronAPI.createBackup(result);
                      alert(`Backup created successfully!\n${backupResult.backup_path}`);
                    }
                  } catch (error) {
                    alert(`Failed to create backup: ${error instanceof Error ? error.message : String(error)}`);
                  } finally {
                    setBackupLoading(false);
                  }
                }}
                disabled={backupLoading}
                className="btn btn-secondary"
              >
                {backupLoading ? 'Creating...' : 'Create Backup'}
              </button>
            </div>
            <div className="settings-field">
              <label>Restore from Backup</label>
              <p className="settings-description">Restore PROJAX data from a backup file</p>
              <button
                onClick={async () => {
                  if (!confirm('This will overwrite your current PROJAX data. Continue?')) {
                    return;
                  }
                  try {
                    setRestoreLoading(true);
                    const filePath = await window.electronAPI.selectFile({
                      filters: [{ name: 'PROJAX Backup', extensions: ['pbz'] }],
                    });
                    if (filePath) {
                      await window.electronAPI.restoreBackup(filePath);
                      alert('Backup restored successfully! The app will refresh.');
                      window.location.reload();
                    }
                  } catch (error) {
                    alert(`Failed to restore backup: ${error instanceof Error ? error.message : String(error)}`);
                  } finally {
                    setRestoreLoading(false);
                  }
                }}
                disabled={restoreLoading}
                className="btn btn-danger"
              >
                {restoreLoading ? 'Restoring...' : 'Restore from Backup'}
              </button>
            </div>
          </div>
        </div>

      <div className="settings-footer">
        <button type="button" onClick={handleSave} disabled={saving} className="btn btn-primary">
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
};

export default Settings;

