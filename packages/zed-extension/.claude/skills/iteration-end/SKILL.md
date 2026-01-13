---
name: iteration-end
description: End a work iteration by tidying markdown, updating docs, capturing screenshots, analyzing files, cleaning up, and filing bugs/requirements to beads for next session. Use at session end, before stopping, or when asked to wrap up.
allowed-tools: Read, Grep, Glob, Bash, TodoWrite, Edit, mcp__chrome-devtools__take_screenshot, mcp__chrome-devtools__navigate_page, mcp__chrome-devtools__list_console_messages
---

# Iteration End - Close Work Session

This skill closes a work iteration by tidying documentation, capturing screenshots, filing discovered issues, and preparing for handoff.

## Workflow

### 1. Capture Screenshots of Changes

For any UI/visual changes made during this session, capture screenshots:

**Using Chrome DevTools MCP:**
1. Navigate to the page with changes:
   - Use `mcp__chrome-devtools__navigate_page` to load the URL
2. Take a screenshot:
   - Use `mcp__chrome-devtools__take_screenshot`
3. Save to screenshots directory with issue-id naming:
   - `.claude/screenshots/<issue-id>-<timestamp>.png`

**Screenshot naming convention:**
- `zed-extension-xxx-before-YYYYMMDD-HHMMSS.png`
- `zed-extension-xxx-after-YYYYMMDD-HHMMSS.png`

### 2. Check Console for Errors

Use Chrome DevTools to check for console errors:
```
mcp__chrome-devtools__list_console_messages
```

File any console errors as bugs in beads.

### 3. Tidy Up Markdown Files (CRITICAL)

**This step is mandatory before ending.**

Scan and clean up all markdown files:

```bash
# Find all markdown files
find . -name "*.md" -not -path "./target/*" -not -path "./.git/*"
```

**For each markdown file, check and fix:**

1. **GEMINI.md / AGENTS.md** - Project documentation
   - Update if new commands/features were added
   - Update if conventions changed
   - Add new sections for new functionality
   - Remove outdated information

2. **README.md** (if exists)
   - Update installation instructions if changed
   - Update usage examples
   - Update feature list

3. **Skill files** (.claude/skills/*/SKILL.md)
   - Update if workflow changed
   - Add new steps if needed
   - Fix any outdated instructions

**Cleanup actions:**
- Remove stale TODOs that were completed
- Fix broken links
- Update version numbers if applicable
- Ensure formatting is consistent

### 4. Search for Remaining TODOs/FIXMEs

```bash
# Search for TODOs in code
grep -r "TODO\|FIXME\|XXX\|HACK" --include="*.rs" --include="*.ts" --include="*.js" --include="*.md" . 2>/dev/null | grep -v target/
```

For each TODO found:
- If completed: Remove the TODO comment
- If still needed: Create a beads issue to track it

### 5. Review Code for Issues

Look for:
- Incomplete implementations (commented code, placeholder logic)
- Missing error handling
- Untested functionality
- Security concerns
- Performance issues

### 6. File New Issues to Beads

For each discovered issue, create a beads entry:

```bash
# Bug with screenshot reference
bd create --title="Bug: Description" --type=bug --priority=<0-4>
bd comments <new-issue-id> add "Screenshot: .claude/screenshots/<filename>.png"

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

### 7. Attach Screenshots to Issues

For visual bugs or UI changes, attach screenshots via comments:

```bash
# Add screenshot reference to issue
bd comments <issue-id> add "Screenshot attached: .claude/screenshots/<issue-id>-<timestamp>.png

Description of what the screenshot shows."
```

This allows the user to:
- View the screenshot
- Leave feedback in subsequent comments
- Reference visual state for the next session

### 8. Update Existing Issues

For completed work:
```bash
bd close <issue-id> --reason="Completed: description"
```

For partial work, add comments with screenshots:
```bash
bd comments <issue-id> add "Progress: what was done, what remains

Screenshot of current state: .claude/screenshots/<issue-id>-progress.png"
```

### 9. Add Dependencies

If new issues depend on others:
```bash
bd dep add <new-issue> <depends-on-issue>
```

### 10. Final Comment Check (IMPORTANT)

**Before committing, re-check comments on worked issues:**

```bash
bd comments <issue-id>
```

Look for any **last-minute feedback** from the user that arrived while working.
If found, address it before finalizing.

### 11. Sync and Commit

```bash
# Check git status
git status

# Stage code changes
git add <files>

# Stage screenshots
git add .claude/screenshots/

# Stage updated markdown
git add *.md .claude/

# Sync beads
bd sync

# Commit code
git commit -m "Description of changes"

# Sync any new beads changes
bd sync

# Push to remote
git push
```

### 12. Write Handoff Comment

For any in-progress issues, add a comment with:
- What was completed
- What remains
- Any blockers discovered
- Context for next session
- **Screenshot references**

```bash
bd comments <issue-id> add "Session end: Completed X. Remaining: Y. Blocked by: Z.

Current state screenshot: .claude/screenshots/<issue-id>-handoff.png"
```

## Output Format

Provide a session summary:

```
## Session End Summary

### Docs Updated
- GEMINI.md: Added new feature X documentation
- AGENTS.md: Updated workflow section

### Work Completed
- [issue-id] Description (closed)
- [issue-id] Description (closed)

### Screenshots Captured
- .claude/screenshots/<filename>.png - Description
- .claude/screenshots/<filename>.png - Description

### Issues Filed
- [new-issue-id] Description (type, priority)
  - Screenshot: .claude/screenshots/xxx.png

### In Progress (for next session)
- [issue-id] Description - Progress: X%, Next steps: Y
  - Handoff screenshot: .claude/screenshots/xxx.png

### Blockers Identified
- [issue-id] blocked by [other-issue-id]

### Git Status
- Committed: X files
- Pushed: Yes/No
```

## Checklist

Before declaring done:

- [ ] **Markdown files tidied** (GEMINI.md, AGENTS.md, READMEs)
- [ ] **Docs updated** for any new features/changes
- [ ] TODOs in code either removed or filed as issues
- [ ] Screenshots captured for visual changes
- [ ] All completed issues closed
- [ ] New issues filed for discovered work
- [ ] Screenshots attached to relevant issues
- [ ] In-progress issues have comments with status
- [ ] Dependencies added where needed
- [ ] **Final comment check** done on worked issues
- [ ] Code committed (including screenshots and docs)
- [ ] Beads synced
- [ ] Changes pushed to remote
- [ ] Handoff notes written with screenshot references

## Notes

- Never skip the push - work is not done until pushed
- **Always tidy markdown** - docs should reflect current state
- **Update docs for changes** - if you added a feature, document it
- Always capture screenshots of UI changes for user feedback
- File issues generously - better to track than forget
- Add context in comments for future sessions
- Screenshots enable async feedback loops with the user
