# projax

A cross-platform project management dashboard for tracking local development projects. Features a powerful CLI tool, interactive Terminal UI (TUI), Desktop app (Electron-based), **VS Code/Cursor/Windsurf extension**, REST API, and built-in tools for test detection, port management, and script execution.

## 🌟 Key Interfaces

- **🖥️ CLI**: Full-featured command-line tool - `prx <command>`
- **⚡ Terminal UI**: Interactive TUI with real-time updates - `prx i`
- **🎨 Desktop App**: Beautiful Electron-based UI - `prx web`
- **📝 Editor Extension**: Native sidebar for VS Code, Cursor, and Windsurf - [Get Extension](#vscode-cursorf-windsurf-extension)
- **🔌 REST API**: Express-based API server for integrations

## Features

- **Project Management**: Track multiple local projects from different directories with custom names
- **Test Detection**: Automatically detects test files (Jest, Vitest, Mocha)
- **Port Conflict Detection & Remediation**: Automatically detects and resolves port conflicts when running scripts
- **Background Script Execution**: Run scripts in the background with minimal logging
- **Intelligent Script Selection**: Automatically selects the right script (dev/start) when running projects
- **Port Scanning & Indexing**: Automatically extracts and indexes ports from project config files
- **CLI Interface**: Full-featured command-line tool for project management
- **Terminal UI (TUI)**: Interactive terminal interface with real-time updates
- **Desktop App**: Beautiful Desktop UI (Electron-based) for visual project management
- **Editor Extension**: Native sidebar extension for VS Code, Cursor, and Windsurf editors
- **JSON Database**: Lightweight JSON-based database stores all project metadata
- **REST API**: Express-based API server for centralized data access
- **Cross-Platform Support**: Works on macOS, Linux, and Windows
- **Multi-Project Type Support**: Node.js, Python, Rust, Go, and Makefile projects
- **Future Jenkins Integration**: Database schema ready for Jenkins job tracking

## Installation

```bash
# Install globally
npm install -g projax

# Or run directly with npx (no install required)
npx projax --help
npx projax list
npx projax i          # Launch Terminal UI
```

After global installation, the `prx` command will be available globally.

## VS Code/Cursor/Windsurf Extension

**PROJAX for Editors** brings the power of PROJAX directly into your editor's sidebar with a native extension for VS Code, Cursor, and Windsurf.

### 🎯 Features

- **📂 Projects Browser**: Search and browse all PROJAX projects in a sidebar panel
- **🎯 Auto-Detection**: Automatically detects and highlights the current workspace project
- **📊 Project Details**: View tests, ports, scripts, and statistics at a glance
- **▶️ Script Execution**: Run and stop npm/yarn scripts directly from the editor
- **🔗 Quick Access**: One-click access to development server URLs
- **⌨️ Command Palette**: 13 PROJAX commands accessible via `Cmd+Shift+P`
- **🔄 Real-Time Updates**: Live process status and port information
- **🎨 Native UI**: Beautiful sidebar panels that match your editor's theme

### 📦 Installation

```bash
# Get installation instructions and .vsix location
prx vscode-extension

# Or install directly:
code --install-extension ./release/projax-vscode-3.0.0.vsix      # VS Code
cursor --install-extension ./release/projax-vscode-3.0.0.vsix    # Cursor
windsurf --install-extension ./release/projax-vscode-3.0.0.vsix  # Windsurf
```

### 📚 Documentation

- [Extension Overview](https://projax.dev/docs/editors/overview)
- [Installation Guide](https://projax.dev/docs/editors/installation)
- [Usage Guide](https://projax.dev/docs/editors/usage)
- [Command Reference](https://projax.dev/docs/editors/commands)

### Database Setup

The database is automatically created on first use. No manual setup required.

**Location:**
- **macOS/Linux**: `~/.projax/data.json`
- **Windows**: `%USERPROFILE%\.projax\data.json`

The directory structure is created automatically when you first run any `prx` command.

**Migration from SQLite (v1.2):**
If you're upgrading from version 1.2 or earlier, your SQLite database will be automatically migrated to JSON format on first run. The original SQLite file will be backed up to `~/.projax/dashboard.db.backup`.

### API Server

The API server is automatically started when you launch the Desktop web interface (`prx web`). It can also be started manually:

```bash
# Start API server
prx api --start

# Check API status
prx api

# View API info in CLI welcome screen
prx --help
```

**API Port:**
The API server automatically finds an available port in the range 38124-38133. The selected port is displayed in:
- CLI welcome screen
- Desktop app status bar
- `prx api` command output

**API Endpoints:**
See [packages/api/README.md](packages/api/README.md) for complete API documentation.

## Usage

### CLI Commands

#### `prx add [path]`

Add a project to the dashboard. If no path is provided, you'll be prompted to enter one.

**Options:**
- `-n, --name <name>`: Set a custom name for the project (defaults to directory name)

**Examples:**
```bash
# Add with custom name
prx add /path/to/project --name "My Awesome Project"

# Add with short flag
prx add /path/to/project -n "Frontend App"

# Interactive mode (will prompt for path and name)
prx add

# Add with path only (will prompt for name with directory name as default)
prx add /path/to/project
```

When adding a project, you'll be prompted to:
1. Enter a custom name (if not provided via `--name`)
2. Optionally scan for test files
3. Automatically scan for ports in configuration files

#### `prx list`

List all tracked projects in a formatted table. Projects are sorted by ID.

**Options:**
- `-v, --verbose`: Show detailed information (legacy format)
- `--ports`: Show detailed port information per script

**Examples:**
```bash
# Default table view with ports
prx list

# Detailed port information
prx list --ports

# Legacy verbose format
prx list --verbose
```

The default table view displays:
- **ID**: Project ID
- **Name**: Project name (custom or directory name)
- **Path**: Project directory path (truncated if long)
- **Ports**: Detected ports (comma-separated) or "N/A"
- **Tests**: Number of test files found
- **Last Scanned**: Timestamp of last test scan

#### `prx scan [project]`

Scan projects for test files and ports. If no project is specified, all projects are scanned.

**Examples:**
```bash
# Scan all projects
prx scan

# Scan specific project by ID
prx scan 1

# Scan specific project by name
prx scan "My Project"
```

This command:
- Scans for test files (Jest, Vitest, Mocha)
- Scans for ports in configuration files
- Updates the database with findings

#### `prx rn <project> <newName>` / `prx rename <project> <newName>`

Rename a project. The directory path remains unchanged; only the display name is updated.

**Examples:**
```bash
# Rename by ID
prx rn 1 "My New Project Name"

# Rename by current name
prx rn "Old Name" "New Name"

# Using full command name
prx rename 2 "Frontend App"
```

#### `prx remove <project>`

Remove a project from the dashboard.

**Options:**
- `-f, --force`: Skip confirmation prompt

**Examples:**
```bash
# Remove with confirmation
prx remove 1
prx remove "My Project"

# Remove without confirmation
prx remove 1 --force
prx remove "My Project" -f
```

#### `prx scripts [project]`

List all available scripts for a project. If no project is specified, you'll be prompted to select one.

**Examples:**
```bash
# Interactive selection
prx scripts

# List scripts for specific project
prx scripts 1
prx scripts "My Project"
```

Shows:
- Script name
- Command that will be executed
- Runner type (npm, yarn, pnpm, python, poetry, cargo, go, make)

#### `prx pwd [project]`

Get the path to a project directory. Outputs only the path for use with command substitution.

**Examples:**
```bash
# Get path by ID
prx pwd 1

# Get path by name
prx pwd "My Project"

# Use with command substitution
cd $(prx pwd 1)

# Interactive selection
prx pwd
```

#### `prx cd [project]`

Change to a project directory. Outputs a shell command that changes directory.

**Examples:**
```bash
# Change directory by ID
eval "$(prx cd 1)"

# Change directory by name
eval "$(prx cd projax)"

# Interactive selection
eval "$(prx cd)"

# Create a shell function for convenience
prxcd() { eval "$(prx cd $@)"; }
# Then use: prxcd 1
```

**Shell Integration Tip:** Add this to your `~/.zshrc` or `~/.bashrc`:
```bash
prxcd() {
  eval "$(prx cd $@)"
}
```

Then simply use: `prxcd 1` or `prxcd projax`

#### `prx <project> [script] [args...]`

Run a script from a project. Supports intelligent script selection and multiple execution modes.

**Intelligent Script Selection:**
When no script is specified, `prx` automatically selects:
1. If project has "start" but no "dev" → runs "start"
2. If project has "dev" but no "start" → runs "dev"
3. Otherwise → shows interactive script selection menu

**Options:**
- `-M, --background, -b, --daemon`: Run script in background mode (minimal logging)
- `--force, -F`: Auto-resolve port conflicts without prompting

**Examples:**
```bash
# Intelligent selection (auto-selects dev or start)
prx 1
prx "My Project"

# Run specific script
prx 1 dev
prx 2 build
prx "My Project" test --watch

# Run in background
prx 1 dev -M
prx 2 start --background
prx "My Project" dev -b

# Auto-resolve port conflicts
prx 1 dev --force
prx 2 start -F

# Combine flags
prx 1 dev -M --force
```

**Supported Project Types:**
- **Node.js**: Runs scripts from `package.json` (npm, yarn, pnpm)
- **Python**: Runs scripts from `pyproject.toml` (supports Poetry)
- **Rust**: Runs common `cargo` commands (build, run, test, etc.)
- **Go**: Runs common `go` commands or Makefile targets
- **Makefile**: Runs Makefile targets

#### `prx run <project> <script>`

Run a script from a project with explicit command syntax.

**Options:**
- `-b, --background`: Run script in background mode
- `-f, --force`: Auto-resolve port conflicts

**Examples:**
```bash
# Run a script in foreground
prx run 1 dev
prx run projax build

# Run in background
prx run 1 dev --background
prx run projax dev -b

# Auto-resolve port conflicts
prx run 1 dev --force
prx run 1 dev -b -f
```

#### `prx ps`

List all running background processes.

**Examples:**
```bash
prx ps

# Output shows:
# Running processes (3):
#
#   PID 12345: projax (dev) - 5m 30s
#   Command: npm run dev
#   Logs: /Users/username/.projax/logs/process-1234567890-dev.log
#   URLs: http://localhost:3000
```

#### `prx stop <pid>`

Stop a running background process.

**Examples:**
```bash
# Stop process by PID
prx stop 12345

# Find PIDs with ps command
prx ps
```

#### `prx prxi` / `prx i`

Launch the interactive terminal UI - a full-screen terminal interface for managing projects.

**Features:**
- Navigate projects with arrow keys or vim bindings (j/k)
- View project details, tests, ports, and running scripts
- **npm package detection** - automatically shows if project is published on npm
- Git branch display with color-coded status
- Scan projects for tests and ports
- Stop running scripts
- Full-height columns with independent scrolling
- Virtual scrolling for large script/port lists

**Keyboard Shortcuts:**
- `↑/k` - Move up in project list
- `↓/j` - Move down in project list
- `Tab/←/→` - Switch between project list and details
- `s` - Scan selected project
- `p` - Scan ports for selected project
- `r` - Show available scripts
- `x` - Stop all scripts for selected project
- `?` - Show help
- `q/Esc` - Quit

**Examples:**
```bash
prx i         # Short alias
prx prxi      # Full command
```

#### `prx scan-ports [project]`

Manually scan projects for port information. Ports are automatically extracted from:
- `vite.config.js/ts` - Vite server port
- `next.config.js/ts` - Next.js dev server port
- `webpack.config.js` - Webpack devServer port
- `angular.json` - Angular serve port
- `nuxt.config.js/ts` - Nuxt server port
- `package.json` - Scripts with `--port`, `-p`, or `PORT=` patterns
- `.env` files - `PORT`, `VITE_PORT`, `NEXT_PORT`, etc.

**Examples:**
```bash
# Scan all projects
prx scan-ports

# Scan specific project
prx scan-ports 1
prx scan-ports "My Project"
```

#### `prx web`

Start the Desktop web interface. The API server is automatically started when launching the web interface.

**Options:**
- `--dev`: Start in development mode (with hot reload)

**Examples:**
```bash
# Production mode
prx web

# Development mode
prx web --dev
```

#### `prx api`

Show API server information and manage the API server.

**Options:**
- `-s, --start`: Start the API server
- `-k, --kill`: Stop the API server (not yet implemented)

**Examples:**
```bash
# Show API status
prx api

# Start API server manually
prx api --start
```

The API server status is also shown in:
- CLI welcome screen (when running any command)
- Desktop app status bar (bottom of window)


### Advanced Features

#### Intelligent Script Selection

When you run `prx <project>` without specifying a script, the CLI intelligently selects the appropriate script:

1. **If project has "start" but no "dev"** → automatically runs "start"
2. **If project has "dev" but no "start"** → automatically runs "dev"
3. **If both exist or neither exists** → shows interactive menu to select from all available scripts

This makes it easy to quickly start projects without remembering script names.

#### Background Script Execution

Run scripts in the background with minimal logging. The script output is redirected to log files, allowing you to continue using your terminal.

**Background Mode Flags:**
- `-M` (shortest)
- `--background`
- `-b`
- `--daemon`

**Features:**
- Script runs detached from your terminal
- Output saved to log files in `~/.projax/logs/`
- Process tracked with PID
- You can continue using your terminal immediately

**Example:**
```bash
# Start dev server in background
prx 1 dev -M

# Output shows:
# ✓ Started "My Project" (dev) in background [PID: 12345]
#   Logs: /Users/username/.projax/logs/process-1234567890-dev.log
#   Command: npm run dev
```

**Viewing Logs:**
```bash
# Logs are stored in:
~/.projax/logs/process-<timestamp>-<script>.log

# View recent log
tail -f ~/.projax/logs/process-*.log
```

#### Port Conflict Detection & Remediation

The CLI automatically detects and helps resolve port conflicts when running scripts.

**How It Works:**

1. **Proactive Detection**: Before running a script, checks if known ports are in use
2. **Reactive Detection**: If a script fails with a port error, extracts the port number from the error message
3. **Process Identification**: Finds the process using the port (cross-platform)
4. **Remediation Options**:
   - **Interactive**: Prompts to kill the process and retry
   - **Auto-resolve**: Use `--force` or `-F` flag to automatically kill and retry

**Port Detection Sources:**
- Automatically extracted from config files during scanning
- Detected from error messages when scripts fail
- Stored in database for quick reference

**Examples:**
```bash
# Port conflict detected - interactive prompt
prx 1 dev
# ⚠️  Port 3000 is already in use by process 12345 (node)
# Kill process 12345 (node) and continue? (y/N)

# Auto-resolve port conflicts
prx 1 dev --force
# Port 3000 is already in use by process 12345 (node)
# Killing process 12345 on port 3000...
# ✓ Process killed. Retrying...
```

**Supported Error Patterns:**
- `EADDRINUSE: address already in use :::3000`
- `Port 3000 is already in use`
- `Error: listen EADDRINUSE: address already in use 0.0.0.0:3000`
- And many more common port error formats

#### Port Scanning & Indexing

The CLI automatically scans and indexes ports from project configuration files.

**Automatic Scanning:**
- Runs when adding a project (`prx add`)
- Runs when scanning for tests (`prx scan`)
- Runs in background when listing projects (`prx list`) if ports are stale (>24 hours)

**Supported Config Files:**
- **Vite**: `vite.config.js/ts` - `server.port`
- **Next.js**: `next.config.js/ts` - dev server port
- **Webpack**: `webpack.config.js` - `devServer.port`
- **Angular**: `angular.json` - `serve.options.port`
- **Nuxt**: `nuxt.config.js/ts` - `server.port`
- **Package.json**: Scripts with `--port`, `-p`, `PORT=` patterns
- **Environment Files**: `.env`, `.env.local`, `.env.development` - `PORT`, `VITE_PORT`, `NEXT_PORT`, etc.

**Port Information Display:**
- Shown in `prx list` table view
- Detailed view with `prx list --ports`
- Grouped by script name when applicable

### Web Interface

The Desktop web interface provides a visual way to manage your projects:

1. **Add Projects**: Use the file system picker to select project directories
2. **View Projects**: See all tracked projects in the sidebar
3. **Test Information**: View detected test files and frameworks per project
4. **Scan Projects**: Trigger test scans directly from the UI

## Troubleshooting

### Port Conflicts

**Problem:** Script fails with "port already in use" error

**Solutions:**
1. Use `--force` or `-F` flag to auto-resolve:
   ```bash
   prx 1 dev --force
   ```

2. Manually kill the process:
   ```bash
   # Find process on port (macOS/Linux)
   lsof -ti:3000
   kill -9 $(lsof -ti:3000)
   
   # Windows
   netstat -ano | findstr :3000
   taskkill /F /PID <pid>
   ```

3. Check what's using the port:
   ```bash
   # The CLI will show this when detecting conflicts
   prx 1 dev
   # ⚠️  Port 3000 is already in use by process 12345 (node)
   ```

### Background Processes

**Problem:** Background process logs or management

**Solutions:**
- Logs are stored in `~/.projax/logs/`
- View logs: `tail -f ~/.projax/logs/process-*.log`
- Process information is tracked in `~/.projax/processes.json`

**Problem:** Background process not starting

**Solutions:**
1. Check if port is available (see Port Conflicts above)
2. Check log files for errors
3. Try running in foreground first to see errors:
   ```bash
   prx 1 dev  # Remove -M flag
   ```

### Port Scanning Issues

**Problem:** Ports not detected in `prx list`

**Solutions:**
1. Manually trigger port scan:
   ```bash
   prx scan-ports 1
   prx scan-ports  # All projects
   ```

2. Check if config file is supported (see Port Scanning section)

3. Verify config file syntax is correct

4. Ports are rescanned automatically if older than 24 hours

### Database Issues

**Problem:** Database errors or corruption

**Solutions:**
1. Database location: `~/.projax/data.json`
2. Backup database before troubleshooting:
   ```bash
   cp ~/.projax/data.json ~/.projax/data.json.backup
   ```
3. Delete database to start fresh (will lose all data):
   ```bash
   rm ~/.projax/data.json
   ```
4. If you have an old SQLite database, migration happens automatically on first API start

### API Server Issues

**Problem:** API server not running or connection errors

**Solutions:**
1. Check API status:
   ```bash
   prx api
   ```

2. Start API server manually:
   ```bash
   prx api --start
   ```

3. Check if port is available:
   ```bash
   # The API tries ports 38124-38133 automatically
   # Check which port is in use
   lsof -i :38124  # macOS/Linux
   netstat -ano | findstr :38124  # Windows
   ```

4. The API port is displayed in:
   - CLI welcome screen
   - Desktop app status bar
   - `prx api` command output

### Script Execution Issues

**Problem:** Script not found or not running

**Solutions:**
1. List available scripts:
   ```bash
   prx scripts 1
   ```

2. Check project type is supported:
   - Node.js (package.json)
   - Python (pyproject.toml)
   - Rust (Cargo.toml)
   - Go (go.mod or Makefile)
   - Makefile

3. Verify script exists in project's config file

4. Try running script directly to see error:
   ```bash
   cd $(prx pwd 1)
   npm run dev  # or appropriate command
   ```

### Project Not Found

**Problem:** "Project not found" error

**Solutions:**
1. List all projects to see available IDs and names:
   ```bash
   prx list
   ```

2. Use project ID instead of name (more reliable):
   ```bash
   prx 1 dev  # Instead of prx "My Project" dev
   ```

3. Check project path still exists:
   ```bash
   prx list  # Shows paths
   ```

### Desktop App Issues

**Problem:** `prx web` fails

**Solutions:**
1. Build the Desktop app first:
   ```bash
   npm run build:desktop
   ```

2. Try development mode:
   ```bash
   prx web --dev
   ```

3. Check if Desktop dependencies are installed:
   ```bash
   cd packages/desktop
   npm install
   ```

## Comprehensive Usage Examples

### Basic Workflow

```bash
# 1. Add projects with custom names
prx add ~/projects/api-server --name "API Server"
prx add ~/projects/frontend --name "Frontend App"
prx add ~/projects/mobile-app --name "Mobile App"

# 2. List all projects (table format with ports)
prx list

# 3. View detailed port information
prx list --ports

# 4. Run projects with intelligent selection
prx 1              # Auto-selects dev or start
prx "API Server"   # Same, using name

# 5. Run specific scripts
prx 1 dev
prx 2 build
prx "Frontend App" test --watch

# 6. Run in background
prx 1 dev -M
prx 2 start --background

# 7. Navigate to projects
eval $(prx cd 1)
cd $(prx pwd "Frontend App")
```

### Port Conflict Resolution

```bash
# Scenario: Port 3000 is already in use

# Option 1: Interactive resolution
prx 1 dev
# ⚠️  Port 3000 is already in use by process 12345 (node)
# Kill process 12345 (node) and continue? (y/N)
# y
# ✓ Process killed. Retrying...

# Option 2: Auto-resolve with --force
prx 1 dev --force
# Port 3000 is already in use by process 12345 (node)
# Killing process 12345 on port 3000...
# ✓ Process killed. Retrying...

# Option 3: Background mode with auto-resolve
prx 1 dev -M --force
```

### Shell Integration

Add to your `~/.zshrc` or `~/.bashrc`:

```bash
# Quick navigation function
prxcd() {
  eval $(prx cd "$@")
}

# Quick script execution with background mode
prxbg() {
  prx "$@" -M
}
```

Usage:
```bash
prxcd 1              # Change to project 1
prxbg 2 dev          # Run dev script in background for project 2
```

### Multi-Project Management

```bash
# Add multiple projects
prx add ~/projects/project1 --name "Project 1"
prx add ~/projects/project2 --name "Project 2"
prx add ~/projects/project3 --name "Project 3"

# Scan all projects for tests and ports
prx scan

# List with port information
prx list --ports

# Run multiple projects in background
prx 1 dev -M
prx 2 dev -M
prx 3 start -M

# Check what's running
prx list
```

### Project Renaming

```bash
# Rename a project
prx rn 1 "New Project Name"
prx rename "Old Name" "New Name"

# The directory path remains unchanged
# Only the display name is updated
```

### Advanced Script Execution

```bash
# Run with arguments
prx 1 dev --port 8001
prx 2 test --watch --coverage

# Run in background with arguments
prx 1 dev -M --port 3001

# Auto-resolve port conflicts
prx 1 dev --force --port 3000

# Combine all options
prx 1 dev -M --force --port 3001
```

## Test Detection

The dashboard automatically detects test files from:

- **Jest**: `*.test.js`, `*.test.ts`, `*.spec.js`, `*.spec.ts`, `__tests__/` directories
- **Vitest**: Same patterns as Jest
- **Mocha**: `*.test.js`, `*.spec.js`, `test/` directories

Detection is based on:
1. Framework configuration files (`jest.config.js`, `vitest.config.ts`, `.mocharc.js`)
2. `package.json` dependencies and test scripts
3. File naming patterns and directory structures

## Future Features

- **Jenkins Integration**: Connect to local Jenkins instances to display build status
- **Test Execution**: Run tests directly from the dashboard
- **Project Templates**: Quick project setup from templates
- **Git Integration**: Show git status and branch information
- **Notifications**: Alert on test failures or build status changes

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

