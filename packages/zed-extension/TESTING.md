# Testing Guide

## Automated Tests

Run unit tests with:
```bash
cargo test --lib
```

### Test Coverage (6 tests)

| Test | Description |
|------|-------------|
| `test_project_deserialization` | Project JSON deserialization |
| `test_format_project_list` | Markdown table formatting for all projects |
| `test_find_project_case_insensitive` | Case-insensitive project lookup |
| `test_format_project_details` | Detailed project information formatting |
| `test_format_open_instructions` | Open project in Zed instructions |
| `test_format_run_instructions` | Run project script instructions |

**All tests passing**: ✓ 6/6

## Manual Testing Checklist

### Prerequisites
1. Ensure `~/.projax/data.json` exists (created by Projax CLI with `prx list`)
2. Build the extension: `./.claude/build-extension.sh` (this also copies extension.wasm)
3. Install in Zed:
   - Command Palette (Cmd+Shift+P) > `zed: extensions`
   - Click "Install Dev Extension"
   - Select this project folder
4. After changes: Rebuild with `./.claude/build-extension.sh` then restart Zed to reload

### /projax_list Command

| Test Case | Input | Expected Result |
|-----------|-------|-----------------|
| No args | `/projax_list` | Shows markdown table with all projects |
| With projects | `/projax_list` | Columns: Name, Framework, Tests, Ports, Path |
| Empty database | `/projax_list` | "No projects found" message |
| Large database | `/projax_list` | All projects listed in table format |

### /projax_show Command

| Test Case | Input | Expected Result |
|-----------|-------|-----------------|
| Valid project | `/projax_show projax` | Shows detailed project info |
| Case insensitive | `/projax_show PROJAX` | Same result as lowercase |
| Unknown project | `/projax_show fake` | Error: Project 'fake' not found |
| No args | `/projax_show` | Error: Usage message |
| With tests | `/projax_show api` | Lists all tests for that project |
| With ports | `/projax_show cli` | Lists all configured ports |

### /projax_open Command

| Test Case | Input | Expected Result |
|-----------|-------|-----------------|
| Valid project | `/projax_open projax` | Shows bash commands to open in Zed |
| Path display | `/projax_open projax` | Displays project path clearly |
| Instructions | `/projax_open projax` | Shows `cd path && zed .` command |

### /projax_run Command

| Test Case | Input | Expected Result |
|-----------|-------|-----------------|
| Valid project and script | `/projax_run projax dev` | Shows npm/yarn run commands |
| Alternative script | `/projax_run projax build` | Displays correct script name |
| Unknown project | `/projax_run fake dev` | Error: Project not found |
| Missing script | `/projax_run` | Error: Usage message |

### Edge Cases

| Test Case | Input | Expected Result |
|-----------|-------|-----------------|
| Project with spaces in name | `/projax_show "my project"` | Handles spaces correctly |
| Special characters in name | `/projax_show proj-ax` | Matches hyphenated names |
| Very long project path | `/projax_show projax` | Path truncated in list view, full in details |

## Build Verification

```bash
# Recommended: Use the build script (builds and copies WASM automatically)
./.claude/build-extension.sh

# Or build manually:
cargo check --target wasm32-wasip2           # Check for errors
cargo build --target wasm32-wasip2           # Full build
cp target/wasm32-wasip2/debug/pokemon.wasm extension.wasm  # CRITICAL: Must copy WASM!

# Run all tests
cargo test --lib

# Format code
cargo fmt
```

**IMPORTANT**: The `extension.wasm` file MUST exist in the root directory for Zed to load the extension. Always copy the built WASM binary after compilation.

## Testing Prerequisites

### Required File
The extension reads from: `~/.projax/data.json`

This file is created automatically when you first run any Projax CLI command:
```bash
prx list  # Creates ~/.projax/data.json
```

### Expected JSON Structure
```json
{
  "projects": [
    {
      "id": 1,
      "name": "projax",
      "path": "/Users/jose/Developer/projax",
      "description": "optional",
      "framework": "npm",
      "git_branch": "main",
      "tags": ["cli"],
      "created_at": 1234567890
    }
  ],
  "tests": [
    {
      "id": 1,
      "project_id": 1,
      "file_path": "packages/api/test.ts",
      "framework": "jest"
    }
  ],
  "project_ports": [
    {
      "id": 1,
      "project_id": 1,
      "port": 3000,
      "script_name": "dev"
    }
  ]
}
```

## Continuous Integration

The extension supports continuous workflow:

```bash
# Start endless iteration loop
./.claude/continuous-loop.sh

# Or use automatic hooks
# - SessionStart hook runs: iteration-start skill
# - Stop hook runs: iteration-end skill
```

## Known Limitations

1. **File system access**: Requires read access to `~/.projax/data.json`
2. **No real-time updates**: Database read is point-in-time (run Projax CLI to refresh)
3. **WASM-only runtime**: Extension code only runs in Zed's WASM sandbox
4. **No script execution**: /projax_run shows instructions only, doesn't execute
