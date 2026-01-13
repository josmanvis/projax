# Agent Instructions

This project uses **bd** (beads) for issue tracking. Run `bd onboard` to get started.

## Quick Reference

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --status in_progress  # Claim work
bd close <id>         # Complete work
bd sync               # Sync with git
bd comments <id>      # View/add comments
```

## Iteration Workflow

### Starting a Session (`/iteration-start`)

1. **Check beads state** - `bd ready`, `bd list`, `bd blocked`
2. **Check comments** - Look for user feedback or redirections
3. **Review screenshots** - Check `.claude/screenshots/` for visual context
4. **Analyze user prompt** - Create beads issues from requested work
5. **Build task list** - Use TodoWrite to track work
6. **Claim work** - `bd update <id> --status=in_progress`

### During Work

**After completing each task, check for intercepting comments:**
```bash
bd comments <issue-id>
```

If user left feedback/redirection, address it before continuing.

### Ending a Session (`/iteration-end`)

1. **Capture screenshots** - Use Chrome DevTools MCP for visual changes
2. **Tidy markdown** - Update GEMINI.md, AGENTS.md, any docs that changed
3. **Search for TODOs** - File as beads issues or remove if done
4. **File new issues** - Track discovered bugs/tasks
5. **Attach screenshots** - Add to issues via comments for user feedback
6. **Final comment check** - Look for last-minute user feedback
7. **Commit and push** - Work is NOT done until pushed

## Screenshot Feedback Loop

Screenshots enable async communication:

1. Agent captures screenshot during work
2. Attaches to issue: `bd comments <id> add "Screenshot: .claude/screenshots/xxx.png"`
3. User reviews and replies with feedback
4. Next session picks up feedback via comments

**Screenshot location:** `.claude/screenshots/`
**Naming:** `<issue-id>-<type>-<timestamp>.png`

## Landing the Plane (Session Completion)

**When ending a work session**, you MUST complete ALL steps below. Work is NOT complete until `git push` succeeds.

**MANDATORY WORKFLOW:**

1. **Tidy markdown** - Update docs for any changes made
2. **File issues for remaining work** - Create issues for anything that needs follow-up
3. **Run quality gates** (if code changed) - Tests, linters, builds
4. **Update issue status** - Close finished work, update in-progress items
5. **PUSH TO REMOTE** - This is MANDATORY:
   ```bash
   git pull --rebase
   bd sync
   git push
   git status  # MUST show "up to date with origin"
   ```
6. **Clean up** - Clear stashes, prune remote branches
7. **Verify** - All changes committed AND pushed
8. **Hand off** - Add comments to in-progress issues with context

**CRITICAL RULES:**
- Work is NOT complete until `git push` succeeds
- NEVER stop before pushing - that leaves work stranded locally
- NEVER say "ready to push when you are" - YOU must push
- If push fails, resolve and retry until it succeeds
- Always update docs when features change

## Available Skills

| Skill | Description |
|-------|-------------|
| `/iteration-start` | Begin work session - analyze beads, create issues from prompt |
| `/iteration-end` | End work session - tidy docs, capture screenshots, commit/push |

## MCP Tools Available

- `chrome-devtools` - Screenshot capture, page navigation, console inspection
