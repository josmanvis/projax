# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Zed editor extension that displays and manages Projax projects. Written in Rust, compiled to WebAssembly (wasm32-wasip2). The extension reads project data from the local `~/.projax/data.json` file and provides slash commands to list, show details, and manage Projax projects.

## Build Commands

```bash
# Build the extension
cargo build --target wasm32-wasip2

# Run tests
cargo test

# Format code
cargo fmt

# Check for errors without building
cargo check --target wasm32-wasip2
```

## Installing for Development

1. Open Zed command palette (Cmd-Shift-P)
2. Select `zed: extensions`
3. Click "Install Dev Extension"
4. Select this project's root directory

The extension must be rebuilt after changes: `cargo build --target wasm32-wasip2`

## Architecture

Single-file extension (`src/lib.rs`) implementing the `zed::Extension` trait:

- **ProjaxExtension** - Main extension struct registered with `zed::register_extension!`
- **Project**, **Test**, **ProjectPort** - Serde structs for deserializing from `~/.projax/data.json`
- **ProjaxDatabase** - Container struct for all project data
- **read_projax_database()** - Reads and parses the JSON database file
- **format_project_list()** - Formats all projects as a markdown table
- **format_project_details()** - Formats detailed project info (tests, ports, git info)
- **format_open_instructions()** - Provides instructions to open a project in Zed
- **format_run_instructions()** - Provides instructions to run a project script
- **find_project()** - Case-insensitive project lookup
- **run_slash_command** - Handler for all slash commands, matches on command name

### Slash Commands (defined in extension.toml)

- `/projax_list` - Lists all Projax projects with framework, test count, and ports
- `/projax_show <project_name>` - Shows detailed project information (tests, ports, git branch, tags)
- `/projax_open <project_name>` - Provides instructions to open a project in Zed
- `/projax_run <project_name> <script_name>` - Provides instructions to run a project script

### Data Flow

1. User invokes slash command in Zed
2. Extension reads `~/.projax/data.json` using standard file I/O
3. JSON deserialized to `ProjaxDatabase` struct via serde_json
4. Data filtered/formatted based on command
5. Formatted markdown returned as `SlashCommandOutput`

## Key Files

- `src/lib.rs` - All extension logic and tests
- `extension.toml` - Zed extension manifest (slash command definitions)
- `Cargo.toml` - Rust dependencies (zed_extension_api, serde, serde_json)

## Testing

Unit tests are in `src/lib.rs` under `#[cfg(test)]` (6 tests total):
- `test_project_deserialization` - Tests Project struct deserialization from JSON
- `test_format_project_list` - Tests markdown table formatting for project list
- `test_find_project_case_insensitive` - Tests case-insensitive project lookup
- `test_format_project_details` - Tests detailed project information formatting
- `test_format_open_instructions` - Tests open project instructions
- `test_format_run_instructions` - Tests run script instructions

Run tests with: `cargo test --lib`

## Prerequisites

- `~/.projax/data.json` must exist (created by Projax CLI on first run)
- Extension requires file system access to read the database

## Issue Tracking

This project uses **beads** (`bd`) for issue tracking. See `bd ready` for available work.
