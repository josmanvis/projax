# Codebase Structure

**Analysis Date:** 2026-01-22

## Directory Layout

```
projax/
├── .planning/                      # Planning documents and GSD artifacts
├── .claude/                        # Claude configuration and context
├── .github/                        # GitHub workflows
├── .husky/                         # Git hooks configuration
├── docs/                           # Documentation files
├── scripts/                        # Build and release scripts
├── packages/                       # pnpm workspaces (monorepo)
│   ├── core/                       # Core business logic library (shared)
│   │   ├── src/
│   │   │   ├── __tests__/          # Jest test files
│   │   │   ├── database.ts         # DatabaseManager singleton (main export)
│   │   │   ├── detector.ts         # Test framework detection
│   │   │   ├── scanner.ts          # Project/test scanning logic
│   │   │   ├── settings.ts         # Settings management
│   │   │   ├── git-utils.ts        # Git operations (branch detection, etc.)
│   │   │   ├── backup-utils.ts     # Project backup/restore
│   │   │   ├── workspace-utils.ts  # Workspace file operations
│   │   │   └── index.ts            # Public API exports
│   │   ├── dist/                   # Compiled JavaScript (generated)
│   │   ├── package.json            # Core dependencies (jest, ts-jest, typescript)
│   │   └── tsconfig.json           # TypeScript config
│   │
│   ├── api/                        # REST API server (Express)
│   │   ├── src/
│   │   │   ├── __tests__/          # Jest test files
│   │   │   ├── routes/             # Express route handlers
│   │   │   │   ├── index.ts        # Router mounting
│   │   │   │   ├── projects.ts     # GET /api/projects, POST, DELETE, SCAN
│   │   │   │   ├── workspaces.ts   # GET /api/workspaces, POST, DELETE
│   │   │   │   ├── settings.ts     # GET /api/settings, POST
│   │   │   │   └── backup.ts       # POST /api/backup (restore)
│   │   ├── services/               # Business logic for API
│   │   │   ├── scanner.ts          # scanProject(), scanAllProjects()
│   │   │   └── test-parser.ts      # Test result parsing
│   │   ├── database.ts             # JSON database impl, DatabaseManager singleton
│   │   ├── core-bridge.ts          # Dynamic loader for projax-core
│   │   ├── types.ts                # Shared TypeScript interfaces
│   │   ├── index.ts                # Express app creation & HTTP server startup
│   │   ├── migrate.ts              # Database schema migrations
│   │   ├── dist/                   # Compiled JavaScript (generated)
│   │   ├── package.json            # Dependencies: express, cors, projax-core
│   │   └── tsconfig.json
│   │
│   ├── cli/                        # Command-line interface (Commander.js)
│   │   ├── src/
│   │   │   ├── __tests__/          # Jest test files
│   │   │   ├── index.ts            # CLI entry point, command definitions (bin: prx)
│   │   │   ├── core-bridge.ts      # Dynamic projax-core loader
│   │   │   ├── script-runner.ts    # runScript(), getProjectScripts()
│   │   │   ├── port-scanner.ts     # scanProjectPorts(), shouldRescanPorts()
│   │   │   ├── port-extractor.ts   # Port detection from config files
│   │   │   ├── port-utils.ts       # Port availability checking
│   │   │   ├── test-parser.ts      # Test result parsing
│   │   │   ├── dist/               # Compiled JavaScript (generated)
│   │   │   ├── prxi.tsx            # React component (PRXI terminal UI)
│   │   │   ├── package.json        # Dependencies: commander, electron, express, ink
│   │   │   └── tsconfig.json
│   │   └── bin/
│   │       └── prx                 # CLI binary symlink (points to dist/index.js)
│   │
│   ├── desktop/                    # Electron desktop application
│   │   ├── src/
│   │   │   ├── main/               # Electron main process (Node.js)
│   │   │   │   ├── main.ts         # Electron app creation, window setup, IPC
│   │   │   │   └── preload.ts      # IPC bridge to renderer
│   │   │   ├── renderer/           # React UI (browser process)
│   │   │   │   ├── main.tsx        # React root component
│   │   │   │   ├── App.tsx         # Main app with tabs (Projects, Workspaces, Terminal, Settings)
│   │   │   │   ├── components/     # React components
│   │   │   │   │   ├── ProjectList.tsx
│   │   │   │   │   ├── ProjectDetails.tsx
│   │   │   │   │   ├── ProjectUrls.tsx
│   │   │   │   │   ├── WorkspaceList.tsx
│   │   │   │   │   ├── WorkspaceDetails.tsx
│   │   │   │   │   ├── WorkspaceSearch.tsx
│   │   │   │   │   ├── AddProjectModal.tsx
│   │   │   │   │   ├── AddWorkspaceModal.tsx
│   │   │   │   │   ├── Terminal.tsx
│   │   │   │   │   ├── Settings.tsx
│   │   │   │   │   ├── TabBar.tsx
│   │   │   │   │   ├── StatusBar.tsx
│   │   │   │   │   ├── Titlebar.tsx
│   │   │   │   │   └── WindowControls.tsx
│   │   │   │   ├── mocks/          # Mock data and API for testing
│   │   │   │   │   ├── mockAPI.ts
│   │   │   │   │   ├── mockData.ts
│   │   │   │   │   ├── mockElectronAPI.ts
│   │   │   │   │   └── setupMocks.ts
│   │   │   ├── dist/               # Compiled main.js, renderer/, core/ (generated)
│   │   │   ├── package.json        # Dependencies: electron, react, vite, electron-builder
│   │   │   ├── tsconfig.main.json  # Main process TypeScript config
│   │   │   ├── tsconfig.preload.json
│   │   │   ├── vite.config.ts      # Vite renderer build config
│   │   │   └── electron-builder.json  # Packager configuration
│   │   └── out/                    # Built Electron app (generated)
│   │
│   ├── prxi/                       # Standalone terminal UI (Ink React)
│   │   └── src/
│   │       ├── index.ts            # PRXI CLI entry
│   │       └── components/         # Ink components
│   │
│   ├── vscode-extension/           # VS Code extension
│   │   └── src/
│   │       └── extension.ts        # Extension entry
│   │
│   ├── zed-extension/              # Zed editor extension
│   │   └── src/
│   │
│   └── docsite/                    # Documentation website (Docusaurus)
│       ├── docs/                   # Markdown docs
│       ├── docusaurus.config.js
│       └── package.json            # Docusaurus, MDX dependencies
│
├── package.json                    # Root workspaces config, Turbo tasks
├── pnpm-workspace.yaml             # pnpm workspace definition
├── turbo.json                      # Turbo build cache and task config
├── tsconfig.json                   # Root TypeScript config
├── .eslintrc.js                    # ESLint config (extends root)
├── .lintstagedrc.js                # Husky lint-staged pre-commit hook
└── README.md                       # Project documentation
```

## Directory Purposes

**packages/core:**
- Purpose: Shared library providing database, scanning, and utility functions
- Contains: TypeScript source, database schema logic, framework detection, project scanning
- Key files: `database.ts` (DatabaseManager singleton), `detector.ts` (framework detection), `scanner.ts` (scanning algorithms)
- Output: Compiled to `dist/` as CommonJS modules and TypeScript declarations
- Consumed by: All other packages (api, cli, desktop)

**packages/api:**
- Purpose: REST HTTP API server for remote access to project data
- Contains: Express.js routes, service layer, database wrapper, type definitions
- Key files: `index.ts` (HTTP server startup), `routes/` (endpoint handlers), `database.ts` (JSON file abstraction)
- Startup: Dynamically finds available port 38124-38133, writes to `~/.projax/api-port.txt`
- Used by: Desktop app (localhost), external HTTP clients

**packages/cli:**
- Purpose: Command-line interface for terminal users
- Contains: Commander.js command definitions, utility modules (port scanning, script execution, test parsing)
- Key files: `index.ts` (CLI entry point, bin target), `core-bridge.ts` (projax-core loader), `port-scanner.ts`, `script-runner.ts`
- Bin entry: `prx` command mapped to `dist/index.js`
- Features: Project CRUD, script execution, port detection, workspace management, platform-specific app aliases (macOS/Linux/Windows)

**packages/desktop:**
- Purpose: Electron GUI application with React interface
- Contains: Electron main process, React renderer, components, IPC bridge
- Key files: `src/main/main.ts` (Electron app), `src/renderer/App.tsx` (React root), `src/renderer/components/` (UI components)
- Build: TypeScript main process + Vite React renderer
- IPC: Preload script bridges main to renderer, renderer uses HTTP to API

**packages/docsite:**
- Purpose: Docusaurus documentation website
- Contains: Markdown docs, blog posts, static site generation config
- Build: `docusaurus build` generates static HTML

**packages/prxi:**
- Purpose: Terminal UI using Ink (React for terminal)
- Contains: Standalone PRXI CLI entry point
- Status: Separate from main CLI, likely experimental/secondary interface

**packages/vscode-extension, packages/zed-extension:**
- Purpose: Editor integrations
- Status: Minimal implementation, likely future work

## Key File Locations

**Entry Points:**

- `packages/cli/src/index.ts`: CLI main, bin target `prx`, imports Commander and core-bridge
- `packages/api/src/index.ts`: HTTP server, starts on dynamic port, exports Express app
- `packages/desktop/src/main/main.ts`: Electron main process, creates BrowserWindow
- `packages/desktop/src/renderer/main.tsx`: React DOM root (index.html mounts to #app)
- `packages/core/src/index.ts`: Library exports, re-exports all public modules

**Configuration:**

- `package.json`: Root workspace and Turbo task definitions
- `pnpm-workspace.yaml`: Workspace package paths
- `turbo.json`: Turbo task graph (build, test, typecheck, lint dependencies)
- `tsconfig.json`: Root TypeScript config (extends to all packages)
- `.eslintrc.js`: ESLint configuration for all packages
- `packages/desktop/electron-builder.json`: Electron packager config for macOS/Windows/Linux

**Core Logic:**

- `packages/core/src/database.ts`: DatabaseManager singleton, CRUD operations, JSON persistence
- `packages/core/src/detector.ts`: Test framework detection (Jest, Vitest, Mocha)
- `packages/core/src/scanner.ts`: Project/test discovery algorithms
- `packages/api/src/database.ts`: API database wrapper, JSON file abstraction
- `packages/api/src/routes/`: Endpoint implementations (projects, workspaces, settings, backup)
- `packages/cli/src/port-scanner.ts`: Port detection and tracking
- `packages/cli/src/script-runner.ts`: Script execution wrapper

**Testing:**

- `packages/core/src/__tests__/`: Jest test files for core module
- `packages/api/src/__tests__/`: Jest test files for API (routes, database, scanner)
- `packages/cli/src/__tests__/`: Jest test files for CLI (port-scanner, script-runner, core-bridge)
- Each has `jest.config.js` (or inherited from root)
- Coverage directories: `packages/*/coverage/` (gitignored)

**Type Definitions:**

- `packages/api/src/types.ts`: Shared TypeScript interfaces (Project, Test, Workspace, etc.)
- `packages/core/src/database.ts`: Interface definitions (also exported from index)
- `packages/*/src/*.d.ts`: Generated declaration files after TypeScript compilation

## Naming Conventions

**Files:**

- Source files: `camelCase.ts` or `camelCase.tsx` (React)
- Test files: `*.test.ts` or `*.spec.ts` (Jest convention)
- Declaration files: `*.d.ts` (TypeScript declarations)
- Config files: `jest.config.js`, `tsconfig.json`, `vite.config.ts`, `electron-builder.json`
- Entry points: `index.ts` (re-exports) or specific names like `main.ts`

**Directories:**

- Source directories: `src/` (TypeScript source), `dist/` (compiled output)
- Test directories: `__tests__/` (Jest convention) or `test/`
- Feature-specific: `routes/`, `services/`, `components/`, `mocks/`
- Build output: `dist/`, `build/`, `out/` (Electron builds)
- Package tools: `.turbo/`, `.husky/`, `.claude/`, `.cursor/`

**Functions/Exports:**

- Camel case: `getAllProjects()`, `addProject()`, `scanProject()`, `detectTestFramework()`
- Factory/Singleton: `getDatabaseManager()`, `getDatabase()`, `getDatabase()`
- Type names: PascalCase: `Project`, `Test`, `DatabaseManager`, `TestFramework`
- Interfaces: PascalCase with leading I or no prefix: `TestFramework` (in detector.ts), `Project`, `DatabaseSchema`

## Where to Add New Code

**New Feature (e.g., new project metadata):**
- Define interface: `packages/api/src/types.ts`
- Add database field: `packages/core/src/database.ts` (DatabaseManager class, DatabaseSchema interface)
- Add migration: `packages/core/src/__tests__/` verify migrateData() handles field
- Add API route: `packages/api/src/routes/projects.ts` (new endpoint)
- Add service method: `packages/core/src/database.ts` (accessor method)
- Add CLI command: `packages/cli/src/index.ts` (new Commander command)
- Add UI component: `packages/desktop/src/renderer/components/` (new React component)

**New Component/Module:**
- Implementation file: `packages/[target]/src/newFeature.ts`
- Test file: `packages/[target]/src/__tests__/newFeature.test.ts`
- Export from index: `packages/[target]/src/index.ts` (add export)
- If shared across packages: Place in `packages/core/src/` and export from `index.ts`

**Utilities:**
- Shared: `packages/core/src/utils-*.ts` (e.g., `git-utils.ts`, `backup-utils.ts`)
- Package-specific: `packages/[target]/src/utils-*.ts`
- Do not create separate `utils/` directory; keep at module level

**Tests:**
- Colocate: `__tests__/` directory in same `src/` directory as code
- File naming: `*.test.ts` (Jest runner convention)
- Pattern: Import component under test, mock dependencies (fs, child_process, net)

## Special Directories

**packages/core/dist:**
- Purpose: Compiled JavaScript output from TypeScript source
- Generated: By `npm run build` (tsc command)
- Committed: No (in .gitignore)
- Used by: Other packages via import 'projax-core' (workspace alias) or relative path from node_modules

**packages/api/dist:**
- Purpose: Compiled API server code
- Generated: By `npm run build` from API package
- Committed: No
- Runtime: Node.js server loads `dist/index.js`

**packages/desktop/dist:**
- Purpose: Compiled Electron main.js, preload.js, and Vite-built renderer/
- Generated: By `npm run build:main` (TypeScript main) and `npm run build:renderer` (Vite React)
- Committed: No
- Also contains: Symlinked core/ directory (copy via build script)

**packages/cli/dist:**
- Purpose: Compiled CLI JavaScript, bin target, and bundled assets (core, api, electron for full build)
- Generated: By `npm run build` (TypeScript) and build:* scripts (copies core, api, electron)
- Committed: No (generated)
- Structure: Contains `index.js` (bin target), `core/`, `api/`, `electron/` subdirectories for bundled dependencies

**.planning/codebase:**
- Purpose: Generated codebase documentation (ARCHITECTURE.md, STRUCTURE.md, CONVENTIONS.md, TESTING.md, CONCERNS.md)
- Generated: By GSD codebase mapper (/gsd:map-codebase)
- Committed: Yes
- Used by: GSD plan-phase and execute-phase commands for context

**~/.projax:**
- Purpose: User data directory (not in repo, on user's system)
- Contains: `data.json` (database), `api-port.txt` (current API port), backups/
- Created: On first run by DatabaseManager and API server

## File Placement Summary

| What | Primary Location | Secondary |
|------|------------------|-----------|
| Database logic | `packages/core/src/database.ts` | `packages/api/src/database.ts` (wrapper) |
| Type definitions | `packages/api/src/types.ts` | `packages/core/src/database.ts` (interfaces) |
| Project scanning | `packages/core/src/scanner.ts` | `packages/api/src/services/scanner.ts` (service wrapper) |
| Framework detection | `packages/core/src/detector.ts` | — |
| API routes | `packages/api/src/routes/*.ts` | — |
| CLI commands | `packages/cli/src/index.ts` | Command-specific logic in separate `.ts` files |
| Port scanning | `packages/cli/src/port-scanner.ts` | — |
| Script execution | `packages/cli/src/script-runner.ts` | — |
| React components | `packages/desktop/src/renderer/components/` | — |
| Electron main | `packages/desktop/src/main/main.ts` | — |
| Tests | `packages/[target]/src/__tests__/*.test.ts` | Colocated with source |

---

*Structure analysis: 2026-01-22*
