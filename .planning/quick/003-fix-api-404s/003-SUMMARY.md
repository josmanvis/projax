# Quick Task 003: Fix API 404s on /settings and /safety endpoints

## What was done

Fixed two issues causing persistent 404 errors on `/api/projects/:id/settings` and `/api/projects/:id/safety`:

1. **pubsafe ESM import failure in CJS context**
   - Root cause: `await import('pubsafe')` was being compiled by TypeScript (`"module": "CommonJS"`) into `require('pubsafe')`. Since pubsafe is ESM-only (`"type": "module"` with only an `"import"` export condition), CJS `require()` fails with "No exports main defined".
   - Fix: Used `new Function('return import("pubsafe")')()` to preserve the real dynamic `import()` in compiled output, bypassing TypeScript's CJS transformation.

2. **API path resolution for global npm install**
   - Root cause: Desktop app's `startAPIServer()` searched for API at paths relative to `__dirname` (e.g., `../../api/dist/index.js`), but when installed globally the structure is `dist/electron/main.js` and `dist/api/index.js` — none of the existing paths matched.
   - Fix: Added `path.join(__dirname, '..', 'api', 'index.js')` to the search paths, which correctly resolves from `dist/electron/` to `dist/api/index.js` in the global install layout.

3. **pubsafe missing from published package dependencies**
   - Root cause: `pubsafe` was added to `packages/api/package.json` but the published npm package is `packages/cli`. When run from a global/npx install, Node.js couldn't find pubsafe because it wasn't in the CLI's dependency tree.
   - Fix: Added `pubsafe: ^1.0.1` to `packages/cli/package.json` dependencies.

## Root cause of user's errors

Multiple layers:
- The desktop app was using a stale API process from the npx cache (v3.3.63) that lacked the routes entirely (404s).
- After killing the stale process, the local API had pubsafe's ESM import broken by TypeScript's CJS compilation (500s).
- For published installs, pubsafe wasn't in the CLI package's dependency tree ("Cannot find module" 500s).

## Files modified

| File | Change |
|------|--------|
| `packages/api/src/routes/projects.ts` | Fix pubsafe import: use `new Function` to preserve ESM dynamic import |
| `packages/desktop/src/main/main.ts` | Add API path for global npm install layout |
| `packages/cli/package.json` | Add pubsafe dependency to published package |

## Verification

- `GET /api/projects/3/settings` → 200 with settings JSON
- `GET /api/projects/8/safety` → 200 with `{safe: 4, exposed: 2, missing: 15, items: [...], channels: ["git"]}`
- `GET /api/projects/1/safety` → 200 with `{safe: 4, exposed: 2, missing: 15, channels: ["git"]}`

## Commits

- `8445a93` - fix: resolve 404s on /settings and /safety API endpoints
- `846e863` - fix: add pubsafe dependency to published CLI package
