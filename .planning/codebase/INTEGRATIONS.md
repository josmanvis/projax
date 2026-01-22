# External Integrations

**Analysis Date:** 2026-01-22

## APIs & External Services

**Local REST API:**
- PROJAX API Server - Local HTTP service for data access
  - SDK/Client: Custom implementation via `axios` (VS Code extension), direct Express (API)
  - Connection mode: Auto-detection via `~/.projax/api-port.txt`
  - Port range: 38124-38133 (automatic allocation)
  - Health check: `GET /health` endpoint
  - Base path: `http://localhost:{port}/api`

**Jenkins Integration:**
- Jenkins job tracking (structure exists, implementation in progress)
  - Storage: `jenkins_jobs` table in JSON database
  - Fields: job_name, job_url, last_build_status, last_build_number

---

## Data Storage

**Databases:**
- JSON flat-file database
  - Location: `~/.projax/data.json`
  - Client: Custom `JSONDatabase` class in `packages/api/src/database.ts`
  - Tables: projects, tests, jenkins_jobs, project_ports, test_results, settings, workspaces, workspace_projects, project_settings
  - ORM: None (direct object manipulation)

**Optional SQLite:**
- `better-sqlite3` 9.2.2 included as optional dependency
  - Not currently used but available for future optimization
  - Setup: `packages/api/src/migrate.ts` exists for future migrations

**File Storage:**
- Local filesystem only
  - Stored data: Project configurations, test metadata, port mappings
  - Scanned projects: Project paths stored as strings (no active copying)
  - Watched files: Via chokidar file system watcher

**Caching:**
- None detected - all queries access JSON file directly

---

## Authentication & Identity

**Auth Provider:**
- Custom (local only)
- Implementation: No authentication layer
- Scope: Single-machine, local user only
- Access: Direct filesystem + local API ports

---

## Monitoring & Observability

**Error Tracking:**
- None detected - no external error tracking service

**Logs:**
- Console output via `console.log()`, `console.error()`
- API: Logs HTTP endpoints and port allocation
- CLI: Outputs progress and results to stdout/stderr
- No persistent logging configured

**Application Metrics:**
- Test results stored: passed, failed, skipped, total, duration, coverage percentage
- Port usage tracked: detected ports, script name associations
- Scan timestamps: per-project last_scanned, per-test last_run

---

## CI/CD & Deployment

**Hosting:**
- Multi-platform:
  - macOS/Windows/Linux: Electron desktop app
  - Any OS with Node.js: CLI (`projax` npm package)
  - VS Code/Cursor/Windsurf: Extension

**CI Pipeline:**
- GitHub Actions: `.github/` configuration exists
- Turbo caching: Monorepo task orchestration
- Build steps: Turbo orchestrates parallel builds across packages

**Release Process:**
- Scripts: `scripts/release.js`, `scripts/bump-version.js`
- Commands: `pnpm run release`, `pnpm run release:patch/minor/major`
- Docsite deployment: `pnpm run release:docsite`

---

## Environment Configuration

**Required env vars:**
- None required at runtime (file-based configuration only)
- Optional: Manual `projax.apiPort` override in VS Code settings

**Secrets location:**
- No secrets management system detected
- Configuration: `~/.projax/data.json` (local, unencrypted)
- Port discovery: `~/.projax/api-port.txt` (local file)

**VS Code Extension Settings:**
```json
projax.apiPort        // Manual API port override (optional, auto-detects if omitted)
projax.autoDetect     // Workspace auto-detection (default: true)
projax.refreshInterval // Process polling interval (default: 5000ms)
projax.preferredOpenMode // How to open projects: newWindow|currentWindow|addToWorkspace|ask
```

---

## Webhooks & Callbacks

**Incoming:**
- None detected

**Outgoing:**
- File system events: Via chokidar watcher (internal, not external)
- Port scanning: Shell-based detection (not webhook based)

---

## Monorepo Structure & Package Integrations

**Internal Dependencies:**
- `projax-core` (shared library) - Used by: api, cli, desktop
- `projax-api` - Used by: desktop, vscode-extension (HTTP client)
- `projax-cli` - Standalone + bundles desktop and api
- `projax-desktop` - Electron app, includes core and CLI binaries
- `projax-prxi` - Terminal UI (uses core logic)
- `projax-vscode` - VS Code extension (calls API via axios)
- `@projax/docsite` - Documentation site (Docusaurus)
- `projax-zed-extension` - Zed editor integration (not found in exploration, marked as missing)

**Data Provider Pattern:**
- `ProjaxDataProvider` interface in `packages/vscode-extension/src/services/ConnectionManager.ts`
- Two implementations:
  - `APIDataProvider` - HTTP-based (axios client)
  - `DirectDataProvider` - Direct JSON database access
- Auto-fallback: Attempts API first, falls back to direct if unreachable

**API Endpoints (from mocks and code):**
```
GET  /health                 // Health check
GET  /api/projects          // List all projects
GET  /api/projects/:id      // Get single project
POST /api/projects          // Create project
PUT  /api/projects/:id      // Update project
DEL  /api/projects/:id      // Delete project
GET  /api/projects/:id/tests     // Get project tests
GET  /api/projects/:id/ports     // Get project ports
POST /api/projects/:id/scan      // Scan single project
POST /api/projects/scan/all      // Scan all projects
GET  /api/projects/tags     // Get all tags
GET  /api/workspaces        // Get workspaces
POST /api/workspaces        // Create workspace
```

---

## Test Framework Integration

**Jest Configuration:**
- Shared devDependency: `jest` 29.7.0, `ts-jest` 29.1.1
- Test discovery: Inferred from `test` scripts in package.json
- Test patterns: `**/*.test.ts`, `**/*.spec.ts` (from tsconfig exclusions)
- HTTP mocking: Supertest for API route testing
- Direct mocking: Mock fetch in desktop renderer (`setupMocks.ts`)

---

*Integration audit: 2026-01-22*
