"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSetting = getSetting;
exports.setSetting = setSetting;
exports.getAllSettings = getAllSettings;
exports.getEditorSettings = getEditorSettings;
exports.setEditorSettings = setEditorSettings;
exports.getBrowserSettings = getBrowserSettings;
exports.setBrowserSettings = setBrowserSettings;
exports.getAppSettings = getAppSettings;
exports.setAppSettings = setAppSettings;
const database_1 = require("./database");
const DEFAULT_SETTINGS = {
    editor: {
        type: 'vscode',
    },
    browser: {
        type: 'chrome',
    },
};
/**
 * Get a setting value by key
 */
function getSetting(key) {
    return (0, database_1.getDatabaseManager)().getSetting(key);
}
/**
 * Set a setting value by key
 */
function setSetting(key, value) {
    (0, database_1.getDatabaseManager)().setSetting(key, value);
}
/**
 * Get all settings as a key-value object
 */
function getAllSettings() {
    return (0, database_1.getDatabaseManager)().getAllSettings();
}
/**
 * Get editor settings
 */
function getEditorSettings() {
    const db = (0, database_1.getDatabaseManager)();
    const type = db.getSetting('editor.type') || DEFAULT_SETTINGS.editor.type;
    const customPath = db.getSetting('editor.customPath') || undefined;
    return {
        type,
        customPath,
    };
}
/**
 * Set editor settings
 */
function setEditorSettings(settings) {
    const db = (0, database_1.getDatabaseManager)();
    db.setSetting('editor.type', settings.type);
    if (settings.customPath) {
        db.setSetting('editor.customPath', settings.customPath);
    }
    // Note: Removing settings is not yet supported via the API
    // Setting to empty string would achieve similar effect if needed
}
/**
 * Get browser settings
 */
function getBrowserSettings() {
    const db = (0, database_1.getDatabaseManager)();
    const type = db.getSetting('browser.type') || DEFAULT_SETTINGS.browser.type;
    const customPath = db.getSetting('browser.customPath') || undefined;
    return {
        type,
        customPath,
    };
}
/**
 * Set browser settings
 */
function setBrowserSettings(settings) {
    const db = (0, database_1.getDatabaseManager)();
    db.setSetting('browser.type', settings.type);
    if (settings.customPath) {
        db.setSetting('browser.customPath', settings.customPath);
    }
    // Note: Removing settings is not yet supported via the API
    // Setting to empty string would achieve similar effect if needed
}
/**
 * Get all app settings
 */
function getAppSettings() {
    return {
        editor: getEditorSettings(),
        browser: getBrowserSettings(),
    };
}
/**
 * Set all app settings
 */
function setAppSettings(settings) {
    setEditorSettings(settings.editor);
    setBrowserSettings(settings.browser);
}
