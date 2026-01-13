---
name: iteration-start
description: Start a work iteration by analyzing beads issues, user prompts, and finding tasks to work on. Use at session start or when asked to begin work. Checks comments, screenshots, creates issues from prompts, updates status, and picks ready tasks.
allowed-tools: Read, Grep, Glob, Bash, TodoWrite, mcp__chrome-devtools__take_screenshot, mcp__chrome-devtools__navigate_page
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

### 2. Check Issue Comments and Attachments

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
- **Screenshot references** - paths to `.claude/screenshots/` images
- **User feedback on screenshots** - comments about visual changes
- **Redirections or early feedback** - user may have changed direction

### 3. Review Screenshot Attachments

Check for any screenshots attached to issues:

```bash
ls -la .claude/screenshots/
```

Screenshots are named: `<issue-id>-<timestamp>.png`

If issues reference screenshots, use the Read tool to view them and understand visual context.

### 4. Analyze User Prompt and Create Issues

**CRITICAL STEP**: Parse the current user prompt and create beads issues for trackable work.

For each distinct task in the user's prompt:

```bash
# Create issue for each task
bd create --title="Task: Description from prompt" --type=task --priority=2

# Or for bugs mentioned
bd create --title="Bug: Description" --type=bug --priority=1

# Or for features
bd create --title="Feature: Description" --type=feature --priority=2
```

**Guidelines for prompt analysis:**
- Break complex requests into separate issues
- Identify implicit requirements (e.g., "add X" implies "test X")
- Set appropriate priorities based on user urgency words
- Link related issues with dependencies if needed

### 5. Build Task List

Use TodoWrite to create an actionable task list combining:
- Ready beads issues (no blockers)
- Newly created issues from user prompt
- Any urgent comments that need response

### 6. Claim Work

For each task you plan to work on:

```bash
bd update <issue-id> --status=in_progress
```

### 7. Start Working

Begin with the highest priority ready task. Priorities:
- P0: Critical/blocking
- P1: High priority
- P2: Medium (default)
- P3: Low priority
- P4: Backlog

## Mid-Task Comment Check (IMPORTANT)

**After completing each task, BEFORE moving to the next:**

```bash
bd comments <issue-id>
```

Check if the user left **intercepting comments** with:
- Redirections ("actually, do X instead")
- Suggestions ("try this approach")
- Early feedback ("that's not quite right")
- Scope changes ("also include Y")

**If intercepting comment found:**
1. Stop current direction
2. Acknowledge the feedback
3. Make requested changes
4. Update the issue with what changed

**If no intercepting comment:**
- Continue to next task

## Output Format

After analysis, provide a summary:

```
## Session Start Summary

### Current State
- Open issues: X
- In progress: Y
- Blocked: Z
- Ready to work: W

### Issues Created from Prompt
- [new-issue-id] Description (priority)
- [new-issue-id] Description (priority)

### Selected Tasks
1. [issue-id] Task description (priority)
2. [issue-id] Task description (priority)

### Comments Needing Response
- [issue-id] Comment summary

### Screenshots to Review
- [issue-id] Screenshot: .claude/screenshots/xxx.png

### Starting with
[Description of first task]
```

## Notes

- Always check comments - the user may be communicating through them
- **Create issues from user prompts** - everything should be tracked
- Check screenshots - visual feedback is critical for UI bugs
- Update issue status before starting work
- **Re-check comments after each task** - catch redirections early
- If no ready issues exist, check if blocked issues can be unblocked
- Consider dependencies when selecting work order
