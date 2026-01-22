# Architecture

**Analysis Date:** 2026-01-22

## Pattern Overview

**Overall:** Monorepo with independent, layered packages sharing a common core library via workspace dependencies. The architecture follows a hub-and-spoke pattern where `projax-core` is the central data and business logic layer consumed by multiple consumers (`cli`, `api`, `desktop`).

**Key Characteristics:**
- Monorepo managed with pnpm workspaces and Turbo for task orchestration
- Layered architecture: Core data layer → API adapter layer → Multiple UI/CLI consumers
- Shared type definitions and interfaces across packages
- Explicit module resolution via core-bridge adapters for import flexibility
- JSON-based database stored in `~/.projax/data.json`
- TypeScript for type safety across all packages

## Layers

**Core Library (`projax-core`):**
- Purpose: Provides database management, project scanning, detection, and file I/O utilities
- Location: `/packages/core/src/`
- Contains: Database singleton, project/test/workspace data models, scanning algorithms, framework detection, git utilities, backup utilities
- Depends on: Node.js stdlib (fs, path, os, child_process)
- Used by: CLI, API, Desktop (via direct import or core-bridge adapters)
- Exports: DatabaseManager singleton, Project/Test/Workspace/Port interfaces, scanner functions, detector functions, backup/git utilities

**API Layer (`projax-api`):**
- Purpose: Express.js REST API server providing HTTP endpoints for project/workspace/settings operations
- Location: `/packages/api/src/`
- Contains: Express middleware setup, route handlers, database wrapper, service layer (scanner, test-parser)
- Depends on: `projax-core`, Express.js, CORS middleware
- Used by: Desktop app, external clients
- Entry point: `index.ts` - starts HTTP server on dynamic port (38124-38133), writes port to `~/.projax/api-port.txt`
- Routes: `/api/projects/*`, `/api/workspaces/*`, `/api/settings/*`, `/api/backup/*`, `/health`

**CLI Layer (`projax`):**
- Purpose: Command-line interface for project management using Commander.js
- Location: `/packages/cli/src/`
- Contains: CLI commands, script runner, port scanner, test parser, core-bridge loader
- Depends on: `projax-core`, Commander.js, child_process utilities, file system utilities
- Used by: End users via `prx` command
- Entry point: `index.ts` - #!/usr/bin/env node, bin target `prx`

**Desktop Layer (`projax-desktop`):**
- Purpose: Electron-based GUI application with React renderer
- Location: `/packages/desktop/src/`
- Contains: Main process (Electron), preload scripts, React renderer components, IPC bridge
- Depends on: `projax-core`, Electron, React, electron-builder
- Components: ProjectList, WorkspaceList, Terminal, Settings, ProjectDetails, AddProjectModal, AddWorkspaceModal
- Build: TypeScript main/preload, Vite React renderer

## Data Flow

**Project Discovery & Scanning:**

1. User initiates scan via CLI command or Desktop UI
2. Request routed to `scanProjectPorts()` or `scanProject()` (CLI) or API endpoint (Desktop via API)
3. Scanner reads project `package.json`, `tsconfig.json`, configuration files
4. Test framework detector (`detectTestFramework()`) analyzes dependencies
5. Port extractor searches config files for configured ports
6. Results written to database via DatabaseManager singleton
7. UI updated with results

**Project Data Persistence:**

1. DatabaseManager loads from `~/.projax/data.json` on startup
2. In-memory JSON object modified by CRUD operations
3. Changes written back to file on each write operation
4. Schema migration runs on load to ensure backward compatibility
5. API provides JSON database with transaction semantics (write after update)

**API Communication Flow:**

1. Desktop/Client HTTP POST/GET/DELETE to `http://localhost:PORT/api/*`
2. API listens on dynamic port (finds available port in 38124-38133 range)
3. Port written to `~/.projax/api-port.txt` for discovery by other processes
4. Routes delegate to DatabaseManager for data operations
5. Services (scanner, test-parser) handle complex operations
6. JSON responses returned with 200, 201, 400, 404, 409, 500 status codes

**State Management:**

- **Core Database State:** Single DatabaseManager singleton in each process, JSON file backing store at `~/.projax/data.json`
- **API State:** Express app state persists DatabaseManager instance, clients query via HTTP
- **Desktop UI State:** React component state, fetches from API on mount and polls for updates
- **CLI State:** No persistent state during execution, reads database at command start

## Key Abstractions

**DatabaseManager:**
- Purpose: Singleton that manages all project/test/workspace/settings data with JSON persistence
- Examples: `/packages/core/src/database.ts`, `/packages/api/src/database.ts` (wrapper)
- Pattern: Singleton with lazy initialization, in-memory JSON object with file writes
- Methods: getAllProjects(), addProject(), removeProject(), getProject(), updateProject(), getTestsByProject(), addWorkspace(), etc.
- Database Schema: projects[], tests[], jenkins_jobs[], project_ports[], test_results[], settings[], workspaces[], workspace_projects[], project_settings[]

**Project Model:**
- Purpose: Represents a tracked project with metadata
- Fields: id, name, path, description, framework, last_scanned, created_at, tags, git_branch
- Used across: Core database, API types, CLI operations, Desktop UI

**CoreBridge:**
- Purpose: Dynamic module loader that resolves `projax-core` from multiple locations (workspace alias, dist paths, node_modules)
- Examples: `/packages/api/src/core-bridge.ts`, `/packages/cli/src/core-bridge.ts`
- Pattern: Caching loader with fallback chain for development vs. published installations
- Why needed: Supports both workspace development mode and published npm package

**Test Framework Detector:**
- Purpose: Identifies Node.js test framework (Jest, Vitest, Mocha) by analyzing package.json and config files
- Implementation: `/packages/core/src/detector.ts`
- Pattern: Configuration-driven with TestFramework array defining detection patterns per framework
- Checks: dependencies, devDependencies, package.json.jest property, test script presence, config files

**Port Scanner:**
- Purpose: Extracts and tracks ports from project configuration files
- Examples: `/packages/cli/src/port-scanner.ts`, `/packages/cli/src/port-extractor.ts`
- Pattern: File system analysis with regex patterns for port detection
- Searches: package.json scripts, Webpack config, Next.js config, Express code patterns
- Stores: ProjectPort records with source config file reference

**Script Runner:**
- Purpose: Executes npm/yarn scripts with output capture and background execution
- Implementation: `/packages/cli/src/script-runner.ts`
- Pattern: Child process wrapper with stream management
- Features: Foreground (piped) and background (detached) execution modes

## Entry Points

**CLI (`/packages/cli/src/index.ts`):**
- Location: `packages/cli/src/index.ts` (bin: `prx`)
- Triggers: User runs `prx [command]` from terminal
- Responsibilities: Command parsing via Commander.js, delegating to handlers (project add/remove/list, script run, port scan, port utils, workspace management, app alias creation)
- Main Commands: `prx projects`, `prx add`, `prx remove`, `prx scan`, `prx run`, `prx ports`, `prx scripts`, `prx workspaces`, `prx app`

**API Server (`/packages/api/src/index.ts`):**
- Location: `packages/api/src/index.ts`
- Triggers: `npm run dev` (ts-node) or `npm start` (node compiled) from api package or via CLI/Desktop
- Responsibilities: HTTP server initialization, middleware setup (CORS, JSON parsing), route mounting, port discovery, graceful shutdown
- Initialization: Finds available port, writes to `~/.projax/api-port.txt`, logs health endpoint

**Desktop App (`/packages/desktop/src/main/main.ts`):**
- Location: `packages/desktop/src/main/` (main process via Electron)
- Triggers: `electron dist/main.js` during development or packaged app launch
- Responsibilities: Electron window creation, IPC setup, renderer process management, file dialogs
- Renderer: React components at `/packages/desktop/src/renderer/`

**Desktop Renderer (`/packages/desktop/src/renderer/main.tsx`):**
- Location: `packages/desktop/src/renderer/main.tsx`
- Triggers: Loaded in Electron BrowserWindow
- Responsibilities: React app root, API client initialization, UI state management, route/tab switching
- Main Component: `App.tsx` with ProjectList, WorkspaceList, Terminal, Settings tabs

## Error Handling

**Strategy:** Try-catch with context-aware responses

**Patterns:**

- **Core Database:** Error logging with fallback to defaults (e.g., if database.json corrupted, uses empty schema)
- **API Routes:** Try-catch wrapping handlers, 400/404/409/500 status codes with JSON error messages
- **CLI Commands:** Command error handling via Commander, process exit(1) on critical failures
- **Module Loading:** CoreBridge uses try-catch with fallback chain (8 candidate paths for core module)
- **File Operations:** Existence checks before reads/writes, directory creation with recursive option
- **Port Detection:** isPortAvailable() tests each port with timeout handling, throws if no port found

## Cross-Cutting Concerns

**Logging:** Console-based (console.log, console.error) with context prefix (✓ for success, error objects for failures). No structured logging framework.

**Validation:** Input validation at route handlers (type checking, path existence, directory validation). Type safety from TypeScript interfaces.

**Authentication:** Not implemented. API has no auth; assumes local-only use (`localhost:38124-38133`).

**Concurrency:** Single-threaded Node.js. File-based database has implicit race condition risk (no locking). Reads/writes are synchronous (fs.readFileSync, fs.writeFileSync).

**Configuration:** Environment variables for NODE_ENV (desktop dev detection). Data directory is hardcoded `~/.projax`. Port range is hardcoded 38124-38133.

**IPC (Desktop):** Electron IPC between main and renderer processes via preload script bridge. Renderer communicates via HTTP to API (not IPC).

---

*Architecture analysis: 2026-01-22*
