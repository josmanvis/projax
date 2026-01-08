export type EditorType = 'vscode' | 'cursor' | 'windsurf' | 'zed' | 'custom';
export type BrowserType = 'chrome' | 'firefox' | 'safari' | 'edge' | 'custom';
export interface EditorSettings {
    type: EditorType;
    customPath?: string;
}
export interface BrowserSettings {
    type: BrowserType;
    customPath?: string;
}
export interface AppSettings {
    editor: EditorSettings;
    browser: BrowserSettings;
}
/**
 * Get a setting value by key
 */
export declare function getSetting(key: string): string | null;
/**
 * Set a setting value by key
 */
export declare function setSetting(key: string, value: string): void;
/**
 * Get all settings as a key-value object
 */
export declare function getAllSettings(): Record<string, string>;
/**
 * Get editor settings
 */
export declare function getEditorSettings(): EditorSettings;
/**
 * Set editor settings
 */
export declare function setEditorSettings(settings: EditorSettings): void;
/**
 * Get browser settings
 */
export declare function getBrowserSettings(): BrowserSettings;
/**
 * Set browser settings
 */
export declare function setBrowserSettings(settings: BrowserSettings): void;
/**
 * Get all app settings
 */
export declare function getAppSettings(): AppSettings;
/**
 * Set all app settings
 */
export declare function setAppSettings(settings: AppSettings): void;
