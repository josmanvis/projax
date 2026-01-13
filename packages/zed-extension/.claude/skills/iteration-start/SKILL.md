---
name: iteration-start
description: Start a work iteration by analyzing beads issues, user prompts, and finding tasks to work on. Use at session start or when asked to begin work. Checks comments, updates status, and picks ready tasks.
allowed-tools: Read, Grep, Glob, Bash, TodoWrite
---

# Iteration Start - Begin Work Session

This skill initializes a work iteration by analyzing the current state of the project and identifying work to be done.

## Workflow

### 1. Analyze Beads Issues

Run the following to understand current work state:

```bash
# Check what's ready to work on
bd ready

# See all open issues
bd list --status=open

# Check in-progress work
bd list --status=in_progress

# Check blocked issues
bd blocked

# Get overall stats
bd stats
```

### 2. Check Issue Comments

For each relevant issue, check for comments that may contain user communication:

```bash
bd show <issue-id>
bd comments <issue-id>
```

Look for:
- Questions from the user
- Clarifications needed
- Updates to requirements
- Blockers or context

### 3. Analyze User Prompt

Parse the current user prompt for:
- Specific tasks requested
- Priority indicators
- References to existing issues
- New requirements to track

### 4. Build Task List

Use TodoWrite to create an actionable task list combining:
- Ready beads issues (no blockers)
- Tasks from user prompt
- Any urgent comments that need response

### 5. Claim Work

For each task you plan to work on:

```bash
bd update <issue-id> --status=in_progress
```

### 6. Start Working

Begin with the highest priority ready task. Priorities:
- P0: Critical/blocking
- P1: High priority
- P2: Medium (default)
- P3: Low priority
- P4: Backlog

## Output Format

After analysis, provide a summary:

```
## Session Start Summary

### Current State
- Open issues: X
- In progress: Y
- Blocked: Z
- Ready to work: W

### Selected Tasks
1. [issue-id] Task description (priority)
2. [issue-id] Task description (priority)

### Comments Needing Response
- [issue-id] Comment summary

### Starting with
[Description of first task]
```

## Notes

- Always check comments - the user may be communicating through them
- Update issue status before starting work
- If no ready issues exist, check if blocked issues can be unblocked
- Consider dependencies when selecting work order
