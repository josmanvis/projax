---
phase: quick
plan: 005
subsystem: cli-tui
tags: [ink, react, processes, ports, navigation]
completed: 2026-01-23
duration: ~3 min
key-files:
  modified:
    - packages/cli/src/prxi.tsx
decisions:
  - id: proc-nav-keys
    description: "Used same j/k and arrow key pattern as other TUI views for consistency"
  - id: stop-key-split
    description: "Split 'x' (stop selected) vs 'X' (stop all) for safety -- prevents accidental mass stop"
---

# Quick Task 005: Fix CLI Port Display and Process Quit Summary

**One-liner:** Added port display, per-process navigation and individual quit to TUI processes view

## What Was Done

### Task 1: Add port display and per-process quit to the processes view

**Changes to `packages/cli/src/prxi.tsx`:**

1. **Port Display:** Each process entry now shows detected ports inline when available:
   ```
   > ● PID 1234: my-app (dev) - 2m 30s [ports: 3000, 5173]
   ```
   Ports are rendered in `accentCyan` color to match the desktop app styling.

2. **Process Navigation:** Added `selectedProcessIndex` state with up/down arrow and j/k key bindings, matching the navigation pattern used in projects and workspaces views.

3. **Per-Process Quit:** Changed `x` key from stopping ALL processes to stopping only the selected process. Added `X` (uppercase) for stopping all processes -- this prevents accidentally killing everything.

4. **Visual Selection:** Selected process is highlighted with `>` indicator and `accentCyan` color, with bold text for emphasis.

5. **Index Clamping:** Added `useEffect` that resets/clamps `selectedProcessIndex` when the number of running processes changes (e.g., after stopping one).

6. **Updated Footer:** Shows contextual keybinding hints: `up/down: navigate | x: stop selected | X: stop all | 1: back to projects`

## Commits

| # | Hash | Message |
|---|------|---------|
| 1 | 4eb4a3b | feat(quick-005): add port display and per-process quit to processes view |

## Verification

- TypeScript compiles without errors (`npx tsc --noEmit -p packages/cli/tsconfig.json`)
- `renderProcessesView` renders `proc.detectedPorts` when available
- Input handler includes up/down navigation and per-process stop
- `selectedProcessIndex` state is bounded via useEffect on `runningProcesses.length`

## Deviations from Plan

None -- plan executed exactly as written.
