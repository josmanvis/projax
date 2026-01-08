"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scanProject = scanProject;
exports.scanAllProjects = scanAllProjects;
const database_1 = require("./database");
function scanProject(projectId) {
    return (0, database_1.getDatabaseManager)().scanProject(projectId);
}
function scanAllProjects() {
    return (0, database_1.getDatabaseManager)().scanAllProjects();
}
