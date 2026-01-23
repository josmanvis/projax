# Quick Task 003: Fix API 404s on /settings and /safety endpoints

## What was done

Fixed two issues causing persistent 404 errors on `/api/projects/:id/settings` and `/api/projects/:id/safety`:

1. **pubsafe ESM import failure in CJS context**
   - Root cause: `await import('pubsafe')` was being compiled by TypeScript (`"module": "CommonJS"`) into `require('pubsafe')`. Since pubsafe is ESM-only (`"type": "module"` with only an `"import"` export condition), CJS `require()` fails with "No exports main defined".
   - Fix: Used `new Function('return import("pubsafe")')()` to preserve the real dynamic `import()` in compiled output, bypassing TypeScript's CJS transformation.

2. **API path resolution for global npm install**
   - Root cause: Desktop app's `startAPIServer()` searched for API at paths relative to `__dirname` (e.g., `../../api/dist/index.js`), but when installed globally the structure is `dist/electron/main.js` and `dist/api/index.js` — none of the existing paths matched.
   - Fix: Added `path.join(__dirname, '..', 'api', 'index.js')` to the search paths, which correctly resolves from `dist/electron/` to `dist/api/index.js` in the global install layout.

## Root cause of user's 404s

The user's desktop app was running from the **globally installed npm package** (v3.3.63, owned by root) at `/Users/jose/.nvm/versions/node/v25.2.1/lib/node_modules/projax/`. The API process spawned from that install didn't have the settings/safety routes (added in v3.3.64-65). After the process was killed, the local rebuild with these fixes allows dev mode to work correctly.

## Files modified

| File | Change |
|------|--------|
| `packages/api/src/routes/projects.ts` | Fix pubsafe import: use `new Function` to preserve ESM dynamic import |
| `packages/desktop/src/main/main.ts` | Add API path for global npm install layout |

## Verification

- `GET /api/projects/3/settings` → 200 with settings JSON
- `GET /api/projects/3/safety` → 200 with pubsafe scan results
- `GET /api/projects/1/safety` → 200 with `{safe: 4, exposed: 0, missing: 17, channels: ["git", "npm"]}`
