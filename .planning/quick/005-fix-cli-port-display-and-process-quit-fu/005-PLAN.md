---
phase: quick
plan: 005
type: execute
wave: 1
depends_on: []
files_modified:
  - packages/cli/src/prxi.tsx
autonomous: true

must_haves:
  truths:
    - "Port numbers detected on running processes are displayed in the processes view"
    - "User can navigate between processes with up/down arrows in the processes tab"
    - "User can quit a selected individual process from the processes tab"
  artifacts:
    - path: "packages/cli/src/prxi.tsx"
      provides: "Fixed processes view with port display and individual quit"
  key_links:
    - from: "renderProcessesView"
      to: "proc.detectedPorts"
      via: "rendering port numbers inline with each process"
    - from: "processes view input handler"
      to: "stopScript"
      via: "quit selected process on 'q' or 'x' key"
---

<objective>
Fix two bugs in the CLI TUI (packages/cli/src/prxi.tsx):
1. Port numbers from running processes are not displayed in the processes view
2. Users cannot navigate or quit individual processes from the processes tab

Purpose: Achieve feature parity with the desktop app for process management.
Output: Updated prxi.tsx with working port display and per-process quit functionality.
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@packages/cli/src/prxi.tsx
@packages/cli/src/script-runner.ts (BackgroundProcess interface has detectedPorts?: number[] and detectedUrls?: string[])
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add port display and per-process quit to the processes view</name>
  <files>packages/cli/src/prxi.tsx</files>
  <action>
Fix two issues in the processes view:

**1. Port Display:**
In `renderProcessesView()` (around line 2443), each process entry currently renders:
```
● PID {pid}: {projectName} ({scriptName}) - {uptimeStr}
```

Update to also display detected ports when available. The `proc.detectedPorts` field is a `number[]` (from `BackgroundProcess` interface in script-runner.ts). Display ports inline after the uptime, e.g.:
```
● PID {pid}: {projectName} ({scriptName}) - {uptimeStr} [ports: 3000, 5173]
```

Use `colors.accentCyan` for port numbers to match the styling used in the project details ports section.

**2. Per-Process Navigation and Quit:**
Add state for `selectedProcessIndex` (useState, default 0) to track which process is selected in the processes view.

In the processes view input handler (around line 1735), add:
- Up/down arrow and k/j keys to navigate between processes (change `selectedProcessIndex`)
- 'q' key (or 'x' on selected) to stop only the SELECTED process (not all processes)
- Remove or modify the existing 'x' handler that stops ALL processes - change 'X' (uppercase) to stop all, and 'x' (lowercase) to stop selected

In `renderProcessesView()`:
- Highlight the selected process with the selection indicator (use same `isSelected ? '>' : ' '` pattern as project list)
- Use `colors.accentCyan` for the selected process text, `colors.textPrimary` for unselected
- Update the footer hint text to show the new keybindings: "up/down: navigate | x: stop selected | X: stop all | 1: back to projects"
- Reset `selectedProcessIndex` to 0 when the number of processes changes (add useEffect)

Ensure `selectedProcessIndex` is bounded: when a process is stopped, clamp the index to the new list length minus 1.
  </action>
  <verify>
Run `cd /Users/jose/Developer/projax && npx tsc --noEmit -p packages/cli/tsconfig.json` to confirm no type errors.
Verify the renderProcessesView function renders port numbers and has selection state.
  </verify>
  <done>
- Processes view shows detected port numbers for each running process
- User can navigate between processes with arrow keys/j/k
- User can stop a selected individual process with 'x'
- User can stop all processes with 'X'
- TypeScript compiles without errors
  </done>
</task>

</tasks>

<verification>
- `npx tsc --noEmit -p packages/cli/tsconfig.json` passes
- The renderProcessesView function includes `proc.detectedPorts` rendering
- Input handling for processes view includes up/down navigation and per-process stop
- selectedProcessIndex state is properly managed (bounded, reset on changes)
</verification>

<success_criteria>
- Port numbers are visually rendered in the processes tab for each process that has detected ports
- Individual process selection and quit works from the processes tab
- No TypeScript compilation errors
</success_criteria>

<output>
After completion, create `.planning/quick/005-fix-cli-port-display-and-process-quit-fu/005-SUMMARY.md`
</output>
