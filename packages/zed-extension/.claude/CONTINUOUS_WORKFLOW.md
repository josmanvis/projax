# Continuous Iteration Workflow

This document explains the automated continuous workflow setup for the Zed Extension project using Claude Code hooks and Beads issue tracking.

## Overview

The workflow is designed to:
- Automatically start iteration context when sessions begin
- Track all work in Beads for persistence across sessions
- Automatically wrap up sessions with the iteration-end skill
- Enable endless loop of work with continuous progress tracking

## Components

### 1. Hooks Configuration (`~/.claude/hooks.json`)

Two main hooks are configured:

#### SessionStart Hook
- **Trigger**: When Claude Code session starts
- **Action**: Runs `iteration-start` skill
- **Purpose**: Analyzes available work, sets up todo lists, determines work priorities

#### Stop Hook
- **Trigger**: When user requests stop (e.g., stops typing, timeout, or explicit quit)
- **Action**: Runs `iteration-end` skill
- **Purpose**: Wraps up work, commits changes, captures context, files incomplete work in Beads

### 2. Continuous Loop Script

**Location**: `.claude/continuous-loop.sh`

This bash script provides an alternative to the hook-based approach for long-running sessions:

```bash
# Start the continuous loop
./.claude/continuous-loop.sh
```

**What it does each iteration**:
1. Checks for ready work via `bd ready`
2. Picks first ready issue
3. Updates issue status to `in_progress`
4. Builds the extension
5. Runs tests
6. Syncs Beads with git
7. Waits 30 seconds, then starts next iteration

## Beads Commands Reference

### Finding Work
```bash
bd ready              # Issues with no blockers, ready to work
bd list --status=open # All open issues
bd blocked            # Issues blocked by dependencies
bd stats              # Project statistics
```

### Working on Issues
```bash
bd show <id>                    # View issue details
bd update <id> --status=in_progress  # Claim work
bd update <id> --description="..." # Update description
bd close <id>                   # Mark complete
bd dep add <id> <dependency>    # Add dependency
```

### Managing Issues
```bash
bd create --title="..." --type=task --priority=2  # Create new issue
bd sync                         # Sync with git
```

## Workflow Patterns

### Pattern 1: Auto-Starting Sessions

When you start Claude Code:
1. SessionStart hook triggers automatically
2. `iteration-start` skill analyzes the project
3. Sets up todo list
4. Shows available work from `bd ready`

### Pattern 2: Session Wrap-Up

When you stop the session:
1. Stop hook triggers
2. `iteration-end` skill runs
3. Checks `git status` for uncommitted changes
4. Commits changes with proper messaging
5. Syncs Beads with remote
6. Captures session context for next iteration

### Pattern 3: Continuous Loop

Run the script for endless work:
```bash
cd /Users/jose/Developer/projax/packages/zed-extension
./.claude/continuous-loop.sh
```

This runs indefinitely, working through ready issues.

## Creating Work for Continuous Loop

To feed work into the loop, create Beads issues:

```bash
# Create a new feature task
bd create --title="Implement feature X" --type=feature --priority=2

# Create a bug fix
bd create --title="Fix issue with Y" --type=bug --priority=1

# Create a test task
bd create --title="Add tests for Z" --type=test --priority=3

# Create dependent work
bd create --title="Task A" --type=task --priority=2
bd create --title="Task B (depends on A)" --type=task --priority=2
bd dep add <id-of-B> <id-of-A>  # B depends on A
```

## Status Tracking

Each iteration tracks:
- Ready issues (no blockers)
- In-progress work
- Completed items
- Dependencies and blockers

Use `bd stats` to see project health:
```
Open Issues: 15
In Progress: 2
Completed: 42
Blocked: 3
```

## Best Practices

### For Multi-Session Projects
1. Always create Beads issues for work to be done
2. Mark blockers with dependencies via `bd dep add`
3. Run `bd sync` at end of each session to persist state
4. Use `bd ready` to find the best next task
5. Include context and requirements in issue descriptions

### For Continuous Loops
1. Keep iteration time reasonable (30-60 seconds works well)
2. Make issues smaller and more focused
3. Use priorities: P0 (critical) through P4 (backlog)
4. Group related work with tags or by dependency chains
5. Regularly review `bd stats` for project health

### For Context Preservation
1. The `iteration-end` skill captures work snapshots
2. The `iteration-start` skill analyzes previous context
3. This enables sessions to pick up exactly where others left off
4. See `.claude/iteration-context.md` after each session for captured state

## Troubleshooting

### Hooks Not Running
Check if hooks are properly loaded:
```bash
ls -la ~/.claude/hooks.json
```

Verify the skill names exist:
```bash
# Should show available skills in Claude Code
```

### Continuous Loop Hanging
If the script hangs:
1. Check Beads sync: `bd sync --status`
2. Verify git status: `git status`
3. Review build logs: `cargo build --target wasm32-wasip2 2>&1`
4. Stop with Ctrl+C and review `git log` for uncommitted changes

### Issues Not Appearing in Ready
Check if they have blockers:
```bash
bd show <id>              # View details
bd blocked                # See all blocked issues
bd dep add <id> <blocker> # Add dependency
```

## Integration with Claude Code

### Automatic Context Recovery
After a stop/start cycle:
1. SessionStart hook runs
2. `iteration-start` reads `.claude/iteration-context.md`
3. Previous work state is restored
4. You're ready to continue immediately

### Efficient Tool Use
The workflow optimizes:
- Uses Beads for persistence (replaces manual context capture)
- Hooks minimize setup/teardown overhead
- TodoWrite tracks current session work
- Continuous loop batches multiple iterations

## Example Session Flow

```
$ cd zed-extension
$ claude-code .

[SessionStart hook triggers]
[iteration-start skill runs]
📋 Found 5 ready issues
🎯 Suggesting top priorities:
  1. Fix build warnings (P0)
  2. Add documentation (P1)
  3. Refactor tests (P2)

[User picks a task]
$ /working on fixing build warnings

[User stops]
[Stop hook triggers]
[iteration-end skill runs]
📊 Session Summary:
  ✓ 2 issues closed
  ✓ Build passing
  ✓ All tests pass
  ✓ Changes committed
  ✓ Beads synced

Session saved. Next iteration will continue from here.
```

## See Also

- `bd --help` - Beads command reference
- `iteration-start` - Skills documentation
- `iteration-end` - Skills documentation
- `CLAUDE.md` - Project-specific Claude guidance
