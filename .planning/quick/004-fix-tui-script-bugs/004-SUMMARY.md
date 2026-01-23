# Quick Task 004: Fix TUI script execution bugs

## What was done

Fixed two bugs in the TUI (prxi):

1. **Scripts don't show in processes tab after running**
   - Root cause: Enter key in the ScriptSelectionModal called `onSelect(scriptName, false)` (foreground mode), which ran `runScript()` then `exit()` — the TUI exited completely, so no process was ever tracked.
   - Fix: Enter now runs scripts in background (`onSelect(scriptName, true)`), which calls `runScriptInBackground()`, adds to `~/.projax/processes.json`, and refreshes the processes tab. Added 'f' key for foreground mode if needed.

2. **Can't run a script by arrow-keying and pressing Enter in project details**
   - Root cause: The details panel only supported scrolling (up/down moved `detailsScrollOffset`). There was no concept of selectable script items or Enter-to-run.
   - Fix: Added `detailSelectedScript` state. When the details panel is focused and has scripts:
     - Up/down arrow keys navigate between scripts (with visual cursor `▶`)
     - Enter runs the selected script in background
     - Selected script is highlighted in cyan

## Files modified

| File | Change |
|------|--------|
| `packages/cli/src/prxi.tsx` | Script modal: Enter=background, f=foreground. Details panel: script navigation + Enter to run |

## Commit

`66a842d` - fix(tui): scripts run in background by default, Enter key runs from details
