# Testing Checklist for PROJAX

Before any release, test all commands with `npm link`:

## Setup
```bash
cd packages/cli
npm link
cd ~  # Test from home directory, not workspace
```

## Commands to Test

### Core Commands
- [ ] `prx --version` - Should show version number
- [ ] `prx --help` - Should show help menu
- [ ] `prx list` - Should list all projects
- [ ] `prx add --help` - Should show add command help

### Interactive/UI Commands  
- [ ] `prx i` - Launch Terminal UI (prxi) - INTERACTIVE TEST REQUIRED
  - Press 'q' to quit
  - Should show project list and details panels
- [ ] `prx web` - Launch Desktop app - INTERACTIVE TEST REQUIRED
  - Should open Electron window
  - Close window to exit
- [ ] `prx docs` - Launch documentation site - INTERACTIVE TEST REQUIRED
  - Should open browser with docs
  - Ctrl+C to stop server

### API Commands
- [ ] `prx api` - Should show API server status
- [ ] `prx api --start` - Should start API server

### Project Management
- [ ] `prx scripts <project>` - Should list project scripts
- [ ] `prx pwd <project>` - Should output project path
- [ ] `prx scan` - Should scan projects for tests

## Manual Interactive Testing

These MUST be tested manually (cannot be automated):

1. **prx i (Terminal UI)**
   ```bash
   prx i
   # Verify:
   # - UI renders correctly
   # - Can navigate with arrow keys
   # - Press 'q' to quit works
   ```

2. **prx web (Desktop App)**
   ```bash  
   prx web
   # Verify:
   # - Electron window opens
   # - Project list shows
   # - Can click and interact
   ```

3. **prx docs (Documentation)**
   ```bash
   prx docs
   # Verify:
   # - Server starts
   # - Browser opens to localhost
   # - Docusaurus site loads
   ```

## After Testing

If all tests pass:
```bash
npm run release  # Use the automated release script
```

## Known Issues

- `prx i` when run in background/automated tests shows "Raw mode is not supported" - this is expected and normal
- When testing, make sure you're NOT in the workspace directory (cd ~ first)

