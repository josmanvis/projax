# Projax

## What This Is

A unified developer project management dashboard that lets developers see all their projects, ports, scripts, and workspaces in one place. Available as a CLI tool (`prx`), REST API, Electron desktop app, documentation site, and editor extensions (VS Code, Zed).

## Core Value

Unified dashboard — developers can see and manage all their projects, ports, and scripts from a single interface regardless of editor or terminal.

## Requirements

### Validated

- ✓ Project scanning and auto-discovery from filesystem — existing
- ✓ Test framework detection (Jest, Vitest, Mocha) — existing
- ✓ Port scanning and tracking from config files — existing
- ✓ Workspace management (group projects) — existing
- ✓ CLI project CRUD (add/remove/list/scan) — existing
- ✓ Script running (foreground and background) — existing
- ✓ REST API with project/workspace/settings endpoints — existing
- ✓ Desktop Electron app with project list, workspaces, terminal, settings — existing
- ✓ VS Code extension with project webview — existing
- ✓ Zed extension with project display — existing
- ✓ Interactive CLI mode (prxi) with Ink terminal UI — existing
- ✓ Documentation site (Docusaurus) — existing
- ✓ JSON file database at ~/.projax/data.json — existing
- ✓ Monorepo build pipeline (pnpm + Turbo) — existing

### Active

- [ ] Successful npm publish of all public packages (currently 3.3.59 on npm, v3.3.62 in git)
- [ ] All packages build cleanly with no errors
- [ ] All tests pass across core, CLI, and API
- [ ] Version bump to 3.3.63 (patch release)
- [ ] Polish existing UX after release (stability, bug fixes, better error messages)

### Out of Scope

- New editor integrations — focus on polishing what exists first
- New framework detection — current set sufficient for now
- SQLite migration — better-sqlite3 is optional dep, not active
- Mobile app — web/desktop/CLI covers the use case
- Authentication/multi-user — local-only tool by design

## Context

- Published on npm as `projax` (CLI binary: `prx`)
- Monorepo with 8 packages: core, cli, api, desktop, docsite, prxi, vscode-extension, zed-extension
- npm shows 3.3.59 as latest but git tag is v3.3.62 — release gap to resolve
- Users install globally via `npm install -g projax`
- Data stored locally at `~/.projax/` (JSON flat file)
- API runs on dynamic port (38124-38133 range) discovered via `~/.projax/api-port.txt`
- Existing release script at `scripts/release.js` handles version bump + publish
- Desktop app built with electron-builder, VS Code extension published to marketplace

## Constraints

- **Runtime**: Node.js >= 18.0.0
- **Package Manager**: pnpm 10.25.0 (monorepo workspaces)
- **Build**: TypeScript 5.3.3, Turbo for orchestration
- **Registry**: npm (public package)
- **Platforms**: macOS, Windows, Linux (CLI + desktop)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Patch release (3.3.63) | No breaking changes, bug fixes and polish | — Pending |
| Polish before expand | Users need stability more than new features | — Pending |
| JSON flat file DB | Simple, no external dependencies for local tool | ✓ Good |
| pnpm monorepo | Workspace linking, disk efficient, strict deps | ✓ Good |
| Dynamic API port | Avoid conflicts with user's dev servers | ✓ Good |

---
*Last updated: 2026-01-22 after initialization*
