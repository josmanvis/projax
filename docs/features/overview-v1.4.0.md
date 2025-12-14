# PROJAX Features & Built-in Tools v1.4.0

## Introduction

**PROJAX** is a cross-platform project management dashboard for tracking and managing local development projects. It provides a unified interface for managing multiple projects across different directories, technologies, and frameworks.

### What is PROJAX?

PROJAX is a comprehensive development tool that combines:
- **CLI Tool** (`prx`) - Full-featured command-line interface for project management
- **Terminal UI** (`prxi`) - Interactive full-screen terminal interface
- **Desktop App** - Beautiful Electron-based visual interface
- **REST API** - Express-based API server for centralized data access
- **Core Library** - Shared utilities and database management

### Core Purpose

PROJAX helps developers:
- Track multiple local projects from different directories
- Automatically detect test files and frameworks
- Manage port conflicts and detect ports from configuration files
- Run scripts in foreground or background with intelligent selection
- Organize projects with tags, descriptions, and custom names
- Navigate quickly between projects
- Monitor running processes and detected URLs

### Installation

```bash
npm install -g projax
```

After installation, the `prx` command is available globally.

---

## CLI Component

The CLI component (`packages/cli`) provides a powerful command-line interface for managing projects.

### Complete Command Reference

#### `prx add [path]`

Add a project to the dashboard.

**Options:**
- `-n, --name <name>` - Set a custom name for the project (defaults to directory name)
- `-d, --description <description>` - Set a description for the project
- `--tags <tags>` - Comma-separated list of tags

**Examples:**
```bash
prx add /path/to/project --name "My Project" --description "Frontend app" --tags "react,frontend"
prx add ~/projects/api-server
prx add  # Interactive mode
```

**Features:**
- Interactive prompts if path not provided
- Automatic test scanning option
- Automatic port scanning
- Duplicate path detection

#### `prx list`

List all tracked projects in a formatted table.

**Options:**
- `-v, --verbose` - Show detailed information (legacy format)
- `--ports` - Show detailed port information per script

**Examples:**
```bash
prx list              # Default table view
prx list --ports      # Detailed port information
prx list --verbose    # Legacy verbose format
```

**Display:**
- Project ID, Name, Path (truncated)
- Detected ports (comma-separated)
- Number of test files
- Last scanned timestamp

**Auto-features:**
- Automatically rescans ports if older than 24 hours
- Background port scanning during list operation

#### `prx scan [project]`

Scan projects for test files and ports.

**Examples:**
```bash
prx scan              # Scan all projects
prx scan 1            # Scan project by ID
prx scan "My Project"  # Scan project by name
```

**Features:**
- Scans for test files (Jest, Vitest, Mocha)
- Scans for ports in configuration files
- Updates database with findings
- Shows test file paths and frameworks

#### `prx rn <project> <newName>` / `prx rename <project> <newName>`

Rename a project. Only updates the display name; path remains unchanged.

**Examples:**
```bash
prx rn 1 "New Name"
prx rename "Old Name" "New Name"
```

#### `prx desc <project> [description]` / `prx description <project> [description]`

Set or get project description.

**Examples:**
```bash
prx desc 1                    # View current description
prx desc 1 "New description"  # Set description
prx desc 1 ""                 # Remove description
```

#### `prx tags <project> [action] [tag]`

Manage project tags.

**Actions:**
- `list` (default) - List all tags for project
- `add` - Add a tag
- `remove` - Remove a tag

**Examples:**
```bash
prx tags 1                    # List tags
prx tags 1 add frontend        # Add tag
prx tags 1 remove frontend     # Remove tag
```

#### `prx remove <project>`

Remove a project from the dashboard.

**Options:**
- `-f, --force` - Skip confirmation prompt

**Examples:**
```bash
prx remove 1
prx remove "My Project" --force
```

#### `prx scripts [project]`

List all available scripts for a project.

**Examples:**
```bash
prx scripts              # Interactive selection
prx scripts 1            # List scripts for project ID 1
prx scripts "My Project"  # List scripts by name
```

**Display:**
- Script name
- Command that will be executed
- Runner type (npm, yarn, pnpm, python, poetry, cargo, go, make)

#### `prx pwd [project]`

Get the path to a project directory (outputs only the path).

**Examples:**
```bash
prx pwd 1
cd $(prx pwd 1)  # Use with command substitution
```

#### `prx cd [project]`

Change to a project directory. Outputs a shell command for use with `eval`.

**Examples:**
```bash
eval "$(prx cd 1)"
eval "$(prx cd projax)"
```

**Shell Integration:**
Add to `~/.zshrc` or `~/.bashrc`:
```bash
prxcd() { eval "$(prx cd $@)"; }
```

#### `prx run <project> <script>`

Run a script from a project with explicit command syntax.

**Options:**
- `-b, --background` - Run script in background mode
- `-f, --force` - Auto-resolve port conflicts

**Examples:**
```bash
prx run 1 dev
prx run projax build --background
prx run 1 dev -b -f  # Background with force
```

#### `prx <project> [script] [args...]`

Quick script execution with intelligent selection.

**Intelligent Script Selection:**
- If project has "start" but no "dev" → runs "start"
- If project has "dev" but no "start" → runs "dev"
- Otherwise → shows interactive script selection menu

**Options:**
- `-M, --background, -b, --daemon` - Run in background
- `--force, -F` - Auto-resolve port conflicts

**Examples:**
```bash
prx 1                    # Auto-selects dev or start
prx 1 dev                # Run specific script
prx 2 build --watch      # With arguments
prx 1 dev -M             # Background mode
prx 1 dev --force        # Auto-resolve conflicts
```

#### `prx ps`

List all running background processes.

**Display:**
- Process ID (PID)
- Project name and script name
- Uptime
- Command executed
- Log file location
- Detected URLs (when available)

**Example Output:**
```
Running processes (3):

  PID 12345: projax (dev) - 5m 30s
  Command: npm run dev
  Logs: /Users/username/.projax/logs/process-1234567890-dev.log
  URLs: http://localhost:3000
```

#### `prx stop <pid>`

Stop a running background process by PID.

**Examples:**
```bash
prx stop 12345
```

#### `prx prxi` / `prx i`

Launch the interactive terminal UI (TUI).

**Examples:**
```bash
prx i         # Short alias
prx prxi      # Full command
```

See [TUI Component](#tui-component-prxi) section for details.

#### `prx web` / `prx ui`

Start the UI web interface.

**Options:**
- `--dev` - Start in development mode (with hot reload)

**Examples:**
```bash
prx web
prx web --dev  # Development mode
```

**Features:**
- Automatically starts API server if not running
- Clears Electron cache on launch
- Supports both bundled and development builds

#### `prx api`

Show API server information and manage the API server.

**Options:**
- `-s, --start` - Start the API server
- `-k, --kill` - Stop the API server (not yet implemented)

**Examples:**
```bash
prx api              # Show status
prx api --start      # Start server
```

**Display:**
- Running status
- Port number
- Health check URL
- API base URL

#### `prx scan-ports [project]`

Manually scan projects for port information.

**Examples:**
```bash
prx scan-ports              # Scan all projects
prx scan-ports 1            # Scan specific project
prx scan-ports "My Project"
```

**Supported Config Files:**
- `vite.config.js/ts` - Vite server port
- `next.config.js/ts` - Next.js dev server port
- `webpack.config.js` - Webpack devServer port
- `angular.json` - Angular serve port
- `nuxt.config.js/ts` - Nuxt server port
- `package.json` - Scripts with `--port`, `-p`, or `PORT=` patterns
- `.env` files - `PORT`, `VITE_PORT`, `NEXT_PORT`, etc.

#### `prx open <project>`

Open project in configured editor.

**Examples:**
```bash
prx open 1
prx open "My Project"
```

**Supported Editors:**
- VS Code (`code`)
- Cursor (`cursor`)
- Windsurf (`windsurf`)
- Zed (`zed`)
- Custom editor path (via settings)

#### `prx files <project>`

Open project directory in file manager.

**Examples:**
```bash
prx files 1
prx files "My Project"
```

**Platform Support:**
- macOS: `open`
- Windows: `explorer`
- Linux: `xdg-open`

#### `prx urls <project>`

List detected URLs for a project.

**Examples:**
```bash
prx urls 1
prx urls "My Project"
```

**URL Sources:**
- Detected from running process output
- Generated from detected ports (`http://localhost:{port}`)

### CLI Features

#### Intelligent Script Selection

When running `prx <project>` without specifying a script:
1. If project has "start" but no "dev" → automatically runs "start"
2. If project has "dev" but no "start" → automatically runs "dev"
3. Otherwise → shows interactive menu to select from all available scripts

#### Port Conflict Detection & Remediation

**Proactive Detection:**
- Checks known ports before running scripts
- Uses port information from database
- Checks ports by script name

**Reactive Detection:**
- Monitors script output for port errors
- Extracts port numbers from error messages
- Supports multiple error message formats

**Remediation:**
- Interactive prompt to kill conflicting process
- Auto-resolve with `--force` or `-F` flag
- Cross-platform process identification
- Automatic retry after resolution

**Supported Error Patterns:**
- `EADDRINUSE: address already in use :::3000`
- `Port 3000 is already in use`
- `Error: listen EADDRINUSE: address already in use 0.0.0.0:3000`
- And many more common port error formats

#### Background Script Execution

**Features:**
- Script runs detached from terminal
- Output saved to log files in `~/.projax/logs/`
- Process tracked with PID
- Continue using terminal immediately
- Automatic cleanup on process exit

**Background Mode Flags:**
- `-M` (shortest)
- `--background`
- `-b`
- `--daemon`

**Log Files:**
- Location: `~/.projax/logs/process-<timestamp>-<script>.log`
- View logs: `tail -f ~/.projax/logs/process-*.log`

#### URL Detection

Automatically detects URLs from running process output:
- Extracts URLs from stdout/stderr
- Common patterns: `http://localhost:3000`, `http://127.0.0.1:8080`
- Stored with process information
- Accessible via `prx ps` and `prx urls`

---

## TUI Component (prxi)

The Terminal UI (`packages/prxi`) provides a full-screen interactive terminal interface built with Ink (React for terminals).

### Launch

```bash
prx i         # Short alias
prx prxi      # Full command
```

### Features

#### Project List View

- Browse all tracked projects
- Running process indicators (●) with count
- Scrollable list with visible range indication
- Fuzzy search support (`/` key)
- Color-coded display matching desktop app

#### Project Details Panel

- Project name, description, path
- Tags display and management
- Statistics: Tests, Frameworks, Ports, Scripts
- Framework detection
- Last scanned timestamp
- Running processes with uptime
- Available scripts list
- Detected ports list
- Test files list

#### Keyboard Navigation

**Navigation:**
- `↑` / `k` - Move up in project list
- `↓` / `j` - Move down in project list
- `Tab` / `←` / `→` - Switch between list and details panels
- `Enter` - Select project (updates details panel)

**List Panel Actions:**
- `/` - Search projects (fuzzy search)
- `s` - Scan selected project for tests

**Details Panel Actions:**
- `e` - Edit project name
- `t` - Add/edit tags (with suggestions)
- `o` - Open project in editor
- `f` - Open project directory
- `u` - Show detected URLs
- `s` - Scan project for tests
- `p` - Scan ports for project
- `r` - Show available scripts
- `x` - Stop all scripts for project
- `d` - Delete project

**Editing:**
- `Enter` - Save changes
- `Esc` - Cancel editing

**General:**
- `q` / `Esc` - Quit
- `?` - Show help screen

#### Tag Management

- Add tags with auto-suggestions
- Remove tags
- Tag suggestions from existing tags across all projects
- Inline editing with Enter/Esc

#### Search

- Fuzzy search across project names
- Real-time filtering
- Search indicator in UI

#### Color Scheme

Matches desktop app design:
- Dark theme (`#0d1117` background)
- Accent colors: Cyan, Blue, Green, Purple, Orange
- Consistent with desktop UI

#### Help Modal

Press `?` to show comprehensive help:
- All keyboard shortcuts
- Navigation instructions
- Action descriptions

### Technical Details

- Built with Ink (React for terminals)
- Uses `tsx` for TypeScript + JSX execution
- Independent scrolling panels
- Real-time data updates
- Connects to API server for data

---

## API Component

The API component (`packages/api`) provides a RESTful API server for centralized data access.

### REST Endpoints

#### Health Check

**GET** `/health`

Check API server status.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### Projects

**GET** `/api/projects`

List all projects.

**Response:** `Project[]`

**GET** `/api/projects/tags`

Get all unique tags across all projects.

**Response:** `string[]`

**POST** `/api/projects`

Add a new project.

**Request Body:**
```json
{
  "name": "Project Name",
  "path": "/path/to/project"
}
```

**Response:** `Project`

**GET** `/api/projects/:id`

Get project details.

**Response:** `Project`

**PUT** `/api/projects/:id`

Update project.

**Request Body:**
```json
{
  "name": "New Name",
  "description": "New description",
  "framework": "react",
  "tags": ["frontend", "react"]
}
```

**Response:** `Project`

**DELETE** `/api/projects/:id`

Remove project.

**Response:** `204 No Content`

**GET** `/api/projects/:id/tests`

Get tests for project.

**Response:** `Test[]`

**GET** `/api/projects/:id/ports`

Get project ports.

**Response:** `ProjectPort[]`

**POST** `/api/projects/:id/scan`

Scan project for tests.

**Response:**
```json
{
  "project": Project,
  "testsFound": 5,
  "tests": Test[]
}
```

**POST** `/api/projects/scan/all`

Scan all projects.

**Response:** `Array<{ project: Project, testsFound: number, tests: Test[] }>`

#### Settings

**GET** `/api/settings`

Get all settings.

**Response:** `Record<string, string>`

**PUT** `/api/settings/:key`

Update a setting.

**Request Body:**
```json
{
  "value": "setting_value"
}
```

**Response:**
```json
{
  "key": "setting_key",
  "value": "setting_value"
}
```

### API Features

#### Express-based REST API

- RESTful design
- JSON request/response format
- Standard HTTP status codes
- Error handling with descriptive messages

#### JSON Database

- Uses `lowdb` for JSON-based storage
- Lightweight and fast
- No external database required
- File-based persistence

#### SQLite Migration

- Automatic migration from SQLite (v1.2) to JSON
- Backs up original SQLite file to `~/.projax/dashboard.db.backup`
- Runs on first API start if SQLite database exists
- Preserves all data

#### Port Management

- Automatically finds available port in range 38124-38133
- Writes selected port to `~/.projax/api-port.txt`
- Other components read port from file
- Health check endpoint for status verification

#### CORS Enabled

- Cross-origin requests enabled
- Allows desktop app and other clients to connect
- Secure configuration

### Data Models

#### Project

```typescript
interface Project {
  id: number;
  name: string;
  path: string;
  description: string | null;
  framework: string | null;
  last_scanned: number | null;
  created_at: number;
  tags?: string[];
}
```

#### Test

```typescript
interface Test {
  id: number;
  project_id: number;
  file_path: string;
  framework: string | null;
  status: string | null;
  last_run: number | null;
  created_at: number;
}
```

#### ProjectPort

```typescript
interface ProjectPort {
  id: number;
  project_id: number;
  port: number;
  script_name: string | null;
  config_source: string;
  last_detected: number;
  created_at: number;
}
```

### Error Handling

All endpoints return appropriate HTTP status codes:
- `200` - Success
- `201` - Created
- `204` - No Content
- `400` - Bad Request
- `404` - Not Found
- `409` - Conflict
- `500` - Internal Server Error

Error responses include an `error` field:
```json
{
  "error": "Project not found"
}
```

---

## CORE Component

The Core component (`packages/core`) provides shared utilities, database management, and core functionality used by all other components.

### Modules

#### `database.ts` - Database Manager

Provides database abstraction layer and data access methods.

**Key Functions:**
- `getDatabaseManager()` - Get database manager instance
- `getAllProjects()` - Get all projects
- `addProject(name, path)` - Add new project
- `removeProject(id)` - Remove project
- `updateProject(id, updates)` - Update project
- `getProject(id)` - Get project by ID
- `getProjectByPath(path)` - Get project by path
- `getTestsByProject(projectId)` - Get tests for project
- `getProjectPorts(projectId)` - Get ports for project
- `getAllTags()` - Get all unique tags
- `getSetting(key)` - Get setting value
- `setSetting(key, value)` - Set setting value
- `getAllSettings()` - Get all settings

**Data Types:**
- `Project` - Project data structure
- `Test` - Test file data structure
- `ProjectPort` - Port information structure
- `JenkinsJob` - Jenkins job structure (future use)

#### `detector.ts` - Test Framework Detection

Detects test frameworks and identifies test files.

**Supported Frameworks:**
- **Jest** - Detects `jest.config.js`, `jest.config.ts`, `jest.config.json`, etc.
- **Vitest** - Detects `vitest.config.ts`, `vitest.config.js`, etc.
- **Mocha** - Detects `.mocharc.js`, `.mocharc.json`, etc.

**Detection Methods:**
1. Configuration files in project root
2. `package.json` dependencies and devDependencies
3. `package.json` test scripts
4. File naming patterns (`*.test.js`, `*.spec.js`)
5. Test directory structures (`__tests__`, `test`, `tests`)

**Functions:**
- `detectTestFramework(projectPath)` - Detect framework for project
- `isTestFile(filePath, detectedFramework)` - Check if file is a test file

#### `scanner.ts` - Project Scanning

Provides project scanning functionality.

**Functions:**
- `scanProject(projectId)` - Scan single project for tests
- `scanAllProjects()` - Scan all projects

**Scan Results:**
```typescript
interface ScanResult {
  project: Project;
  testsFound: number;
  tests: Test[];
}
```

#### `settings.ts` - Settings Management

Manages application settings.

**Editor Types:**
- `vscode` - VS Code
- `cursor` - Cursor
- `windsurf` - Windsurf
- `zed` - Zed
- `custom` - Custom editor path

**Browser Types:**
- `chrome` - Chrome
- `firefox` - Firefox
- `safari` - Safari
- `edge` - Edge
- `custom` - Custom browser path

**Functions:**
- `getEditorSettings()` - Get editor configuration
- `setEditorSettings(settings)` - Set editor configuration
- `getBrowserSettings()` - Get browser configuration
- `setBrowserSettings(settings)` - Set browser configuration
- `getAppSettings()` - Get all app settings
- `setAppSettings(settings)` - Set all app settings
- `getSetting(key)` - Get setting value
- `setSetting(key, value)` - Set setting value
- `getAllSettings()` - Get all settings

**Default Settings:**
- Editor: `vscode`
- Browser: `chrome`

### Core Features

#### Database Abstraction

- Unified interface for data access
- API-based implementation (uses HTTP requests)
- Fallback to local database when API unavailable
- Consistent data structures across components

#### Test Framework Detection

- Automatic framework detection
- Multiple detection strategies
- Support for Jest, Vitest, Mocha
- Extensible for additional frameworks

#### Project Scanning Logic

- Recursive file system scanning
- Framework-aware test file detection
- Efficient scanning with caching
- Batch scanning support

#### Settings Management

- Persistent settings storage
- Type-safe settings access
- Default values for all settings
- Custom path support for editors and browsers

---

## Desktop App Component

The Desktop App component (`packages/desktop`) provides a beautiful Electron-based visual interface for managing projects.

### UI Components

#### Titlebar

- Custom frameless window title bar
- Compact design matching status bar height
- Centered "PROJAX" logo
- Link-style buttons (Settings, Add Project)
- Window controls (minimize, maximize, close)

#### ProjectList

- Sidebar with all tracked projects
- Resizable width (200-600px)
- Running process indicators
- Tag display
- Keyboard navigation support
- Scrollable list

#### ProjectDetails

- Main content area
- Project information display
- Editable name and description
- Tag management with auto-suggestions
- Statistics display (tests, ports, scripts)
- Script execution interface
- Running processes display
- Detected URLs display
- Port information
- Test files list

#### ProjectSearch

- Search input with sort icon
- Real-time filtering
- 6 sort options:
  - Name (A-Z)
  - Name (Z-A)
  - Recently Scanned
  - Oldest First
  - Most Tests
  - Running First
- Search includes: names, paths, tags

#### ProjectUrls

- Displays detected URLs for project
- Clickable links (opens in browser)
- "Open" button for configured browser
- Secure external link handling

#### Settings

- Editor configuration
  - Type selection (VS Code, Cursor, Windsurf, Zed, Custom)
  - Custom path input
- Browser configuration
  - Type selection (Chrome, Firefox, Safari, Edge, Custom)
  - Custom path input
- Save/Cancel buttons

#### StatusBar

- API server status
- API port display
- Keyboard shortcuts hint
- Running processes count

#### AddProjectModal

- Directory picker
- Project name input
- Description input (optional)
- Tags input (optional)
- Add/Cancel buttons

### Desktop Features

#### Electron-based Interface

- Frameless window design
- Custom title bar
- Native OS integration
- Cross-platform support

#### Resizable Sidebar

- Width range: 200-600px
- Drag handle for resizing
- Persistent width preference
- Smooth resizing animation

#### Search & Sort

- Real-time search filtering
- Fuzzy search across names, paths, tags
- 6 sort options with active indicator
- Sort menu with checkmarks

#### Tag Management

- Add tags with "+ Add Tag" button
- Remove tags with × button
- Auto-complete suggestions (5 results)
- Tag pills display
- Inline editing
- Suggestions from existing tags

#### Script Execution

- Run scripts in foreground
- Run scripts in background
- Script selection dropdown
- Process tracking
- Stop script functionality

#### Running Processes Display

- Real-time process list
- Auto-refresh every 5 seconds
- Process details: PID, script name, uptime
- Stop process button
- Log file link

#### URL Detection & Display

- Automatic URL detection from process output
- URL generation from detected ports
- Clickable URL links
- "Open" button for configured browser
- Secure external link handling via IPC

#### Settings Management

- Editor preferences
- Browser preferences
- Custom path support
- Persistent storage
- Applied immediately

#### Secure External Link Handling

- IPC-based communication
- URL protocol validation (http/https only)
- Blocks file:, javascript:, data: URLs
- `shell.openExternal()` for secure browser opening
- `setWindowOpenHandler` for target="_blank" links

#### Keyboard Navigation

- Keyboard shortcuts support
- Focus management
- Tab navigation
- Enter to activate
- Escape to cancel

### Technical Details

- Built with Electron
- React + TypeScript renderer
- Vite for build tooling
- IPC for main/renderer communication
- Auto-starts API server on launch
- Cache clearing on launch (macOS)

---

## Built-in Tools

PROJAX includes several built-in tools for project management and analysis.

### Test Scanner

**Location:** `packages/core/src/scanner.ts`

Scans projects for test files and frameworks.

**Features:**
- Recursive directory scanning
- Framework detection (Jest, Vitest, Mocha)
- Test file pattern matching
- Test directory detection
- Database integration

**Usage:**
- Automatic on `prx add` (optional)
- Manual via `prx scan`
- API endpoint: `POST /api/projects/:id/scan`

### Port Extractor

**Location:** `packages/cli/src/port-extractor.ts`

Extracts port information from project configuration files.

**Supported Config Files:**
- **Vite**: `vite.config.js/ts` - `server.port`
- **Next.js**: `next.config.js/ts` - dev server port
- **Webpack**: `webpack.config.js` - `devServer.port`
- **Angular**: `angular.json` - `serve.options.port`
- **Nuxt**: `nuxt.config.js/ts` - `server.port`
- **Package.json**: Scripts with `--port`, `-p`, `PORT=` patterns
- **Environment Files**: `.env`, `.env.local`, `.env.development` - `PORT`, `VITE_PORT`, `NEXT_PORT`, etc.

**Features:**
- Multiple config file support
- Script-specific port detection
- Environment variable parsing
- Port validation
- Source tracking (which file/config detected the port)

### Process Manager

**Location:** `packages/cli/src/script-runner.ts`

Manages background script execution and process tracking.

**Features:**
- Background process spawning
- Process tracking with PID
- Log file generation
- URL detection from output
- Process cleanup on exit
- Dead process detection and removal
- Process list (`prx ps`)
- Process stopping (`prx stop`)

**Process Storage:**
- Location: `~/.projax/processes.json`
- Tracks: PID, project path, script name, command, start time, log file, detected URLs

### Script Runner

**Location:** `packages/cli/src/script-runner.ts`

Executes scripts from project configuration files.

**Supported Project Types:**
- **Node.js**: `package.json` scripts (npm, yarn, pnpm)
- **Python**: `pyproject.toml` scripts (Poetry, pip)
- **Rust**: `Cargo.toml` commands (cargo build, run, test)
- **Go**: `go.mod` or Makefile targets
- **Makefile**: Makefile targets

**Features:**
- Intelligent script selection
- Port conflict detection
- Background execution support
- Argument passing
- Output capture
- Error handling

### Framework Detector

**Location:** `packages/core/src/detector.ts`

Detects test frameworks in projects.

**Detection Methods:**
1. Configuration files
2. Package.json dependencies
3. Package.json scripts
4. File naming patterns
5. Directory structures

**Supported Frameworks:**
- Jest
- Vitest
- Mocha

### Database Manager

**Location:** `packages/core/src/database.ts`

Manages project data storage and retrieval.

**Features:**
- Project CRUD operations
- Test file management
- Port information storage
- Tag management
- Settings storage
- SQLite migration support
- JSON database backend

**Database Location:**
- macOS/Linux: `~/.projax/data.json`
- Windows: `%USERPROFILE%\.projax\data.json`

---

## Project Type Support

PROJAX supports multiple project types and package managers.

### Node.js Projects

**Package Managers:**
- npm
- yarn
- pnpm

**Detection:**
- `package.json` file
- Scripts section

**Script Execution:**
- `npm run <script>`
- `yarn <script>`
- `pnpm run <script>`

### Python Projects

**Package Managers:**
- Poetry (`pyproject.toml`)
- pip

**Detection:**
- `pyproject.toml` file
- `requirements.txt` file

**Script Execution:**
- Poetry: `poetry run <script>`
- pip: Direct command execution

### Rust Projects

**Package Manager:**
- Cargo

**Detection:**
- `Cargo.toml` file

**Script Execution:**
- `cargo build`
- `cargo run`
- `cargo test`
- Other cargo commands

### Go Projects

**Detection:**
- `go.mod` file
- Makefile

**Script Execution:**
- `go` commands
- Makefile targets

### Makefile Projects

**Detection:**
- `Makefile` or `makefile`

**Script Execution:**
- `make <target>`

---

## Database & Storage

### JSON Database

PROJAX uses a lightweight JSON-based database for storing project metadata.

**Location:**
- macOS/Linux: `~/.projax/data.json`
- Windows: `%USERPROFILE%\.projax\data.json`

**Database Structure:**
```json
{
  "projects": [
    {
      "id": 1,
      "name": "Project Name",
      "path": "/path/to/project",
      "description": "Project description",
      "framework": "react",
      "last_scanned": 1234567890,
      "created_at": 1234567890,
      "tags": ["frontend", "react"]
    }
  ],
  "tests": [...],
  "project_ports": [...],
  "settings": [...],
  "jenkins_jobs": []
}
```

**Features:**
- Lightweight and fast
- No external dependencies
- Human-readable format
- Easy backup and migration

### SQLite Migration

**Migration Process:**
- Automatic on first API start
- Detects existing SQLite database at `~/.projax/dashboard.db`
- Migrates all data to JSON format
- Backs up original to `~/.projax/dashboard.db.backup`
- Preserves all project data, tests, ports, settings

**Migration Support:**
- Projects
- Tests
- Ports
- Settings
- Jenkins jobs (future)

### Data Persistence

**Automatic Persistence:**
- All changes saved immediately
- No manual save required
- Atomic writes prevent corruption
- Backup recommended before major operations

**Backup:**
```bash
cp ~/.projax/data.json ~/.projax/data.json.backup
```

---

## Cross-Platform Support

PROJAX works on all major operating systems.

### macOS

**Tested Versions:**
- macOS 10.15+
- Apple Silicon (M1/M2)
- Intel processors

**Features:**
- Native file manager integration (`open`)
- Full Electron support
- Process management via `lsof`
- Port detection

### Linux

**Tested Distributions:**
- Ubuntu 20.04+
- Debian 11+
- Fedora 34+
- Arch Linux

**Features:**
- File manager integration (`xdg-open`)
- Full Electron support
- Process management via `lsof` or `netstat`
- Port detection

### Windows

**Tested Versions:**
- Windows 10
- Windows 11

**Features:**
- File manager integration (`explorer`)
- Full Electron support
- Process management via `netstat` and `taskkill`
- Port detection

**Database Location:**
- `%USERPROFILE%\.projax\data.json`

### Platform-Specific Features

**Process Management:**
- macOS/Linux: Uses `lsof` for port detection
- Windows: Uses `netstat` and `taskkill`

**File Operations:**
- macOS: `open` command
- Linux: `xdg-open` command
- Windows: `explorer` command

**Path Handling:**
- Automatic path normalization
- Cross-platform path separators
- Home directory expansion (`~`)

---

## Shell Integration

PROJAX provides shell integration helpers for improved workflow.

### Recommended Setup

Add to `~/.zshrc` or `~/.bashrc`:

```bash
# Quick directory navigation
prxcd() {
  eval "$(prx cd $@)"
}

# Run script in background
prxbg() {
  prx run "$@" --background
}

# Quick stop all processes for a project
prxstop() {
  local project="$1"
  prx ps | grep "$project" | awk '{print $2}' | while read pid; do
    prx stop "$pid"
  done
}
```

### Usage Examples

```bash
# Navigate to projects quickly
prxcd 1                    # Jump to project ID 1
prxcd projax               # Jump to project by name

# Run scripts in background
prxbg 1 dev                # Start dev server in background
prxbg projax build         # Build in background

# Stop all processes for a project
prxstop projax             # Stop all projax processes

# Combine with other commands
prxcd 1 && npm install     # Navigate and install
prxcd 2 && git pull        # Navigate and pull
```

### Aliases

Add to your shell config for even shorter commands:

```bash
alias p='prx'              # prx shorthand
alias pi='prx i'           # Interactive UI
alias pl='prx list'        # List projects
alias ps='prx ps'          # List processes (note: overrides system ps)
alias prun='prx run'       # Run script
```

**Usage:**
```bash
p list                     # List projects
pi                         # Launch interactive UI
prun 1 dev -b              # Run dev in background
```

### Tips

1. **Keep the native `ps` command**: If you want to keep using the system `ps` command, don't alias it. Instead use `prx ps` directly.

2. **Use project IDs over names**: Project IDs are more reliable and shorter to type.

3. **Background mode by default**: If you usually run scripts in background, use the `prxbg` function.

4. **Interactive mode**: When in doubt, just run `prx i` for the interactive terminal UI.

---

## Summary

PROJAX v1.4.0 provides a comprehensive project management solution with:

- **20+ CLI commands** for project management
- **Interactive Terminal UI** (prxi) with full keyboard navigation
- **REST API** with 13+ endpoints
- **Core utilities** for database, scanning, and detection
- **Desktop App** with beautiful Electron interface
- **Built-in tools** for port extraction, process management, and script execution
- **Multi-project type support** (Node.js, Python, Rust, Go, Makefile)
- **Cross-platform compatibility** (macOS, Linux, Windows)
- **Shell integration** helpers for improved workflow

All components work together seamlessly to provide a unified project management experience.

