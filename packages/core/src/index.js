"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDatabaseManager = void 0;
exports.getAllProjects = getAllProjects;
exports.addProject = addProject;
exports.removeProject = removeProject;
exports.getTestsByProject = getTestsByProject;
__exportStar(require("./database"), exports);
__exportStar(require("./detector"), exports);
__exportStar(require("./scanner"), exports);
__exportStar(require("./settings"), exports);
__exportStar(require("./git-utils"), exports);
__exportStar(require("./workspace-utils"), exports);
__exportStar(require("./backup-utils"), exports);
var database_1 = require("./database");
Object.defineProperty(exports, "getDatabaseManager", { enumerable: true, get: function () { return database_1.getDatabaseManager; } });
// Convenience functions for common operations
const database_2 = require("./database");
function getAllProjects() {
    return (0, database_2.getDatabaseManager)().getAllProjects();
}
function addProject(name, projectPath) {
    return (0, database_2.getDatabaseManager)().addProject(name, projectPath);
}
function removeProject(id) {
    (0, database_2.getDatabaseManager)().removeProject(id);
}
function getTestsByProject(projectId) {
    return (0, database_2.getDatabaseManager)().getTestsByProject(projectId);
}
