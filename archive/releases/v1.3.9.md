# Release Notes - v1.3.9

Published to npm: `projax@1.3.9`

## 🎉 What's New

### Major Improvements

#### 1. **Fixed Process Management** 🔧
- **Issue**: Background scripts were not running successfully
- **Fix**: Changed from WriteStream to file descriptors for process stdio
- **Result**: All scripts now execute correctly and persist in background

#### 2. **New CLI Commands** 🚀

##### `prx run <project> <script>`
Explicit script running with options:
```bash
prx run projax dev --background     # Run in background
prx run projax dev --force          # Auto-kill port conflicts
prx run 1 build -b -f               # Combined flags
```

##### `prx ps`
List all running background processes:
```bash
prx ps
# Shows: PID, project, script, uptime, logs, URLs
```

##### `prx stop <pid>`
Stop a specific background process:
```bash
prx stop 12345
```

##### `prx cd <project>` - Now Actually Works!
```bash
eval "$(prx cd projax)"             # Changes directory!
eval "$(prx cd 1)"                  # By ID
```

Add to shell config:
```bash
prxcd() { eval "$(prx cd $@)"; }
```

#### 3. **Enhanced Desktop App (prx ui)** 💎

- **Compact Title Bar**: Matches status bar height
- **Frameless Window**: No native OS chrome
- **Centered "PROJAX" Logo**: Clean branding
- **Link-Style Buttons**: Minimal, modern design
- **Fixed Settings**: All settings functions working
- **Auto Cache Clearing**: Clears Electron cache on every launch
- **Auto File Syncing**: Desktop files sync to CLI bundle on build

#### 4. **Enhanced prxi Terminal UI** 📺

- **Full-Height Columns**: Both panels use entire screen height
- **Script Management**: 
  - Press `r` to show available scripts
  - Press `x` to stop all project scripts
- **Running Indicators**: Green ● shows active processes
- **Better Layout**: Proper flexbox with status bar fixed at bottom

### Bug Fixes

- ✅ Background processes now spawn correctly with file descriptors
- ✅ Process exit events properly clean up tracking
- ✅ Dead processes automatically removed from tracking
- ✅ Electron module imports fixed (require vs dynamic import)
- ✅ Desktop app settings/editor/browser functions working
- ✅ Process logs persist correctly
- ✅ URL detection working for running servers

### Documentation Updates

- ✅ Updated README.md with all new commands
- ✅ Updated packages/cli/README.md
- ✅ Added SHELL_INTEGRATION.md with helper functions
- ✅ Added TEST_RESULTS.md

### Breaking Changes

**None** - All changes are backward compatible

### Migration Guide

No migration needed. Simply update:

```bash
npm install -g projax@latest
```

Or if already installed globally:
```bash
npm update -g projax
```

### Installation

```bash
npm install -g projax
```

After installation:
```bash
prx --help          # See all commands
prx i               # Launch interactive UI
prx ui              # Launch desktop app
```

### Shell Integration (Recommended)

Add to your `~/.zshrc` or `~/.bashrc`:

```bash
# Quick directory navigation
prxcd() {
  eval "$(prx cd $@)"
}

# Run in background
prxbg() {
  prx run "$@" --background
}
```

Then use:
```bash
prxcd projax        # Jump to project
prxbg projax dev    # Start dev server in background
prx ps              # List processes
```

### What's Included

- **97 files** in package
- **2.5 MB** unpacked
- **499 KB** package size
- Includes:
  - CLI executable (`prx` command)
  - Desktop app (Electron bundle)
  - API server
  - Interactive terminal UI (`prxi`)
  - All core modules

### Tested & Verified

- ✅ Process management (7 processes tested)
- ✅ All CLI commands functional
- ✅ Desktop app launches with new UI
- ✅ prxi terminal UI works correctly
- ✅ Script execution in foreground and background
- ✅ Process tracking and cleanup
- ✅ Directory navigation

### Next Steps

Try the new features:

```bash
# Update to latest version
npm update -g projax

# Verify version
prx --version

# Try new commands
prx ps                          # List processes
prx run projax dev -b           # Run in background
eval "$(prx cd projax)"         # Change directory
prx i                           # Interactive UI
```

---

**Published by**: jose24  
**Date**: November 19, 2025  
**Version**: 1.3.9  
**Previous Version**: 1.3.8

