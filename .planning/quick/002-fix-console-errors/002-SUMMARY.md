# Quick Task 002: Fix console errors in desktop app

## What was done

Fixed three categories of console errors:

1. **`Cannot find module 'file:///...script-runner.js'`**
   - Root cause: `importCliDistModule` used `import(pathToFileURL(...))` which TypeScript compiled to `require('file://...')` - CJS doesn't support file:// URLs
   - Fix: Replaced with direct `require(modulePath)` since both packages are CJS
   - Also removed unused `pathToFileURL` import

2. **`404 on /api/projects/:id/settings`**
   - Root cause: Project settings routes were in `settingsRouter` (mounted at `/api/settings`), making the actual path `/api/settings/projects/:id/settings`
   - Fix: Moved GET and PUT `/:id/settings` routes to `projectsRouter` where they belong

3. **Removed debug instrumentation**
   - Removed ~90 lines of `// #region agent log` blocks with `fetch('http://127.0.0.1:7242/ingest/...')` calls

4. **`404 on /api/projects/:id/safety`** - resolved by rebuilding the API (route existed in code but server was stale)

## Files modified

| File | Change |
|------|--------|
| `packages/desktop/src/main/main.ts` | Fix importCliDistModule, remove agent logs, remove unused import |
| `packages/api/src/routes/settings.ts` | Remove misplaced project settings routes |
| `packages/api/src/routes/projects.ts` | Add project settings routes (GET + PUT) |

## Commit

`75bba85` - fix: resolve console errors in desktop app
