# Application Launcher Feature - Implementation Summary

## Overview
Added `--add-application-alias` flag to `prx ui` command that creates a native application launcher for the Projax UI. This allows users to launch Projax like any other application from their OS's application launcher.

## Usage

```bash
prx ui --add-application-alias
```

## Platform Support

### macOS
Creates a `.app` bundle in `/Applications/Projax.app` with:
- Proper Info.plist with bundle identifiers
- Executable launcher script that finds and launches `prx ui`
- Full Spotlight, Launchpad, and Dock support
- Can be launched from:
  - Spotlight (Cmd+Space → "Projax")
  - Launchpad
  - Applications folder
  - Dock (drag to add)

**Implementation:**
- Creates full `.app` bundle structure
- Launcher script automatically finds `prx` command in common locations
- Falls back to PATH search if direct path doesn't work
- Handles NVM, Homebrew, and other Node installation methods
- Logs output to system logger for debugging

### Linux
Creates a `.desktop` file in `~/.local/share/applications/projax.desktop` with:
- XDG Desktop Entry specification
- Proper categorization (Development, Utility)
- Search keywords for application launchers
- Can be launched from:
  - Application menu
  - Application launcher (GNOME, KDE, etc.)
  - Desktop search

**Implementation:**
- Creates `.desktop` file with proper permissions
- Updates desktop database if `update-desktop-database` is available
- User may need to log out/in for changes to appear

### Windows
Creates a Start Menu shortcut with:
- Proper shortcut link (.lnk file)
- Description and working directory
- Can be launched from:
  - Start Menu search
  - Start Menu programs list
  - Can be pinned to Taskbar

**Implementation:**
- Creates VBScript to generate proper Windows shortcut
- Falls back to batch file if VBScript fails
- Shortcut launches `prx ui` in hidden window mode

## How It Works

1. User runs `prx ui --add-application-alias`
2. Script detects the OS platform
3. Calls appropriate platform-specific function:
   - `createMacOSAppAlias()` for macOS
   - `createLinuxAppAlias()` for Linux
   - `createWindowsAppAlias()` for Windows
4. Creates necessary files with proper structure
5. Sets correct permissions
6. Displays success message with launch instructions

## Code Changes

### Files Modified
- `packages/cli/src/index.ts`:
  - Added `import { execSync } from 'child_process'`
  - Added `handleAddApplicationAlias()` function
  - Added `createMacOSAppAlias()` function
  - Added `createLinuxAppAlias()` function
  - Added `createWindowsAppAlias()` function
  - Added `--add-application-alias` option to web/ui command

### Key Features
- **Automatic prx path detection**: Finds `prx` command using `which`/`where`
- **Fallback path search**: Launcher scripts search common Node installation locations
- **Error handling**: Clear error messages if prx command not found
- **Cross-platform**: Single command works on macOS, Linux, and Windows
- **Non-invasive**: Only creates files, doesn't modify system settings
- **Uninstall**: Users can simply delete the app/shortcut to remove

## Testing

### macOS
```bash
# Create the launcher
prx ui --add-application-alias

# Test Spotlight search
open spotlight://Projax

# Or manually test from Applications folder
open /Applications/Projax.app
```

### Linux
```bash
# Create the launcher
prx ui --add-application-alias

# Test desktop entry
gtk-launch projax.desktop

# Or use application launcher GUI
```

### Windows
```bash
# Create the launcher
prx ui --add-application-alias

# Test from Start Menu
# Open Start Menu and search for "Projax"
```

## Future Enhancements
- Add custom icon for the application
- Add option to specify custom app name
- Add `--remove-application-alias` flag to uninstall
- Add support for custom installation paths
- Add auto-update detection for the launcher
- Create dock/taskbar icon badge for running status
- Add macOS touch bar support
- Add Windows system tray integration

