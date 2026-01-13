---
name: iteration-end
description: End a work iteration by analyzing markdown files, cleaning up, and filing bugs/requirements to beads for next session. Use at session end, before stopping, or when asked to wrap up.
allowed-tools: Read, Grep, Glob, Bash, TodoWrite
---

# Iteration End - Close Work Session

This skill closes a work iteration by documenting state, filing discovered issues, and preparing for handoff.

## Workflow

### 1. Analyze Markdown Files

Scan all markdown files for:
- TODOs and FIXMEs
- Missing documentation
- Incomplete sections
- Requirements that changed

```bash
# Find all markdown files
find . -name "*.md" -not -path "./target/*" -not -path "./.git/*"

# Search for TODOs in code
grep -r "TODO\|FIXME\|XXX\|HACK" --include="*.rs" --include="*.ts" --include="*.js" .
```

### 2. Review Code for Issues

Look for:
- Incomplete implementations (commented code, placeholder logic)
- Missing error handling
- Untested functionality
- Security concerns
- Performance issues

### 3. File New Issues to Beads

For each discovered issue, create a beads entry:

```bash
# Bug
bd create --title="Bug: Description" --type=bug --priority=<0-4>

# Feature/Enhancement
bd create --title="Feature: Description" --type=feature --priority=<0-4>

# Task
bd create --title="Task: Description" --type=task --priority=<0-4>
```

Priority guide:
- 0 (P0): Critical, blocks release
- 1 (P1): High priority, needed soon
- 2 (P2): Medium, default
- 3 (P3): Low, nice to have
- 4 (P4): Backlog, future consideration

### 4. Update Existing Issues

For completed work:
```bash
bd close <issue-id> --reason="Completed: description"
```

For partial work, add comments:
```bash
bd comments <issue-id> add "Progress: what was done, what remains"
```

### 5. Add Dependencies

If new issues depend on others:
```bash
bd dep add <new-issue> <depends-on-issue>
```

### 6. Sync and Commit

```bash
# Check git status
git status

# Stage code changes
git add <files>

# Sync beads
bd sync

# Commit code
git commit -m "Description of changes"

# Sync any new beads changes
bd sync

# Push to remote
git push
```

### 7. Write Handoff Comment

For any in-progress issues, add a comment with:
- What was completed
- What remains
- Any blockers discovered
- Context for next session

```bash
bd comments <issue-id> add "Session end: Completed X. Remaining: Y. Blocked by: Z."
```

## Output Format

Provide a session summary:

```
## Session End Summary

### Work Completed
- [issue-id] Description (closed)
- [issue-id] Description (closed)

### Issues Filed
- [new-issue-id] Description (type, priority)

### In Progress (for next session)
- [issue-id] Description - Progress: X%, Next steps: Y

### Blockers Identified
- [issue-id] blocked by [other-issue-id]

### Git Status
- Committed: X files
- Pushed: Yes/No
```

## Checklist

Before declaring done:

- [ ] All completed issues closed
- [ ] New issues filed for discovered work
- [ ] In-progress issues have comments with status
- [ ] Dependencies added where needed
- [ ] Code committed
- [ ] Beads synced
- [ ] Changes pushed to remote
- [ ] Handoff notes written

## Notes

- Never skip the push - work is not done until pushed
- File issues generously - better to track than forget
- Add context in comments for future sessions
- Update GEMINI.md or AGENTS.md if conventions changed
