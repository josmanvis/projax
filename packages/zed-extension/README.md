# Projax Zed Extension

A Zed editor extension that integrates with the Projax project management system. View and manage your projects directly from Zed using slash commands.

## Features

- **List Projects**: View all projects in a formatted table with framework, test, and port information
- **Project Details**: See detailed information about a specific project including tests, configured ports, and git branch
- **Open in Zed**: Get instructions to quickly open a project folder in Zed
- **Run Scripts**: Get instructions to run project scripts using npm or prx CLI

## Quick Start

### 1. Build the Extension

```bash
cd packages/zed-extension
./.claude/build-extension.sh
```

This will compile the extension and prepare it for installation in Zed.

### 2. Install in Zed

1. Open Zed
2. Command Palette: `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Linux/Windows)
3. Type and select: `zed: extensions`
4. Click "Install Dev Extension"
5. Select the `packages/zed-extension` folder
6. Restart Zed to load the extension

### 3. Use the Commands

Once installed, use these slash commands in any Zed buffer:

- `/projax_list` - Show all projects with stats
- `/projax_show <project_name>` - Show detailed project information
- `/projax_open <project_name>` - Get instructions to open the project
- `/projax_run <project_name> <script_name>` - Get instructions to run a script

## Prerequisites

The extension reads from `~/.projax/data.json`, which is created by the Projax CLI:

```bash
# Install Projax CLI if not already installed
npm install -g projax

# Initialize the database (creates ~/.projax/data.json)
prx list

# Refresh the database as needed
prx list
```

## Architecture

### How It Works

1. **Data Source**: The extension reads from `~/.projax/data.json` (local file system)
2. **No External APIs**: Unlike typical extensions, this runs entirely offline
3. **Slash Commands**: Invoked directly in Zed using the `/` prefix
4. **Markdown Output**: Formatted results display nicely in Zed's output panels

### Technology Stack

- **Language**: Rust
- **Build Target**: WebAssembly (wasm32-wasip2)
- **Framework**: Zed Extension API
- **Serialization**: serde + serde_json

### File Structure

```
.
├── README.md              # This file
├── CLAUDE.md              # Development guide
├── TESTING.md             # Test documentation
├── extension.toml         # Extension manifest
├── Cargo.toml             # Rust dependencies
├── src/
│   └── lib.rs            # All extension logic (277 lines)
├── .claude/
│   ├── build-extension.sh # Build script
│   └── CONTINUOUS_WORKFLOW.md
└── target/               # Build artifacts
    └── wasm32-wasip2/
        └── debug/
            └── pokemon.wasm  # Compiled extension
```

## Development

### Build

```bash
# Using the build script (recommended)
./.claude/build-extension.sh

# Or manually
cargo build --target wasm32-wasip2
cp target/wasm32-wasip2/debug/pokemon.wasm extension.wasm
```

### Test

```bash
# Run all tests
cargo test --lib

# Expected output: 6 tests passing
# - test_project_deserialization
# - test_format_project_list
# - test_find_project_case_insensitive
# - test_format_project_details
# - test_format_open_instructions
# - test_format_run_instructions
```

### Debug

After making changes:

1. Run: `./.claude/build-extension.sh`
2. Restart Zed (or reload the extension)
3. Test the slash command

Note: Changes to the extension require a full Zed restart to reload.

## How It's Wired to Work with Claude

This extension is designed to enable continuous integration with Claude Code sessions through the Beads issue tracking system:

### Continuous Workflow

The project uses **Beads** (`bd`) for issue tracking and continuous iteration:

```bash
# See all ready work
bd ready

# Create new issues
bd create --title="Feature: ..." --type=feature --priority=2

# Track progress
bd update <issue-id> --status=in_progress
bd comments add <issue-id> "Progress update..."

# Close completed work
bd close <issue-id> --reason="Completed"

# Sync with git
bd sync
```

### Automation Hooks

The project includes hooks in `~/.claude/hooks.json` that automatically:

- **SessionStart**: Runs `iteration-start` skill to analyze work
- **Stop**: Runs `iteration-end` skill to wrap up and commit

### Continuous Loop

For endless iteration:

```bash
./.claude/continuous-loop.sh
```

This runs indefinitely, checking for ready work, building, testing, and syncing.

### Claude Integration Points

1. **Build System**: Automatic compilation and testing on each iteration
2. **Issue Tracking**: All work tracked in Beads with dependencies and status
3. **Git Integration**: Automatic commits and pushes after each work session
4. **Documentation**: README, CLAUDE.md, and TESTING.md guide Claude on project structure

## Troubleshooting

### Commands don't show in command palette

**Solution**: Ensure `extension.wasm` exists in the root directory.

```bash
./.claude/build-extension.sh
```

Then restart Zed.

### "Failed to read projax database" error

**Solution**: Create the database file by running:

```bash
prx list
```

This creates `~/.projax/data.json`.

### Extension installs but doesn't work

**Possible causes**:
1. `extension.wasm` not present (use build script)
2. `~/.projax/data.json` not found (run `prx list`)
3. Zed not restarted after installation

### Tests fail during build

Ensure Rust is up to date:

```bash
rustup update
cargo clean
./.claude/build-extension.sh
```

## Contributing

To add new features or fix bugs:

1. Create an issue: `bd create --title="..." --type=feature|bug --priority=2`
2. Update the issue status: `bd update <id> --status=in_progress`
3. Make changes to `src/lib.rs`
4. Run tests: `cargo test --lib`
5. Build: `./.claude/build-extension.sh`
6. Test manually in Zed
7. Close issue: `bd close <id>`
8. Push changes: `git push`

## Testing in Zed

### Manual Test Checklist

- [ ] Run `./.claude/build-extension.sh` successfully
- [ ] Install in Zed via "Install Dev Extension"
- [ ] Command palette shows `/projax_*` commands
- [ ] `/projax_list` displays all projects
- [ ] `/projax_show <project>` shows project details
- [ ] `/projax_open <project>` shows open instructions
- [ ] `/projax_run <project> <script>` shows run instructions
- [ ] Error handling works for unknown projects

## License

Part of the Projax project management system.

## See Also

- **CLAUDE.md** - Development guidance for Claude Code
- **TESTING.md** - Detailed test documentation
- **CONTINUOUS_WORKFLOW.md** - Workflow guide for continuous iteration
- **extension.toml** - Extension manifest and command definitions
