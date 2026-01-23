# Phase 1: Build Health - Context

**Gathered:** 2026-01-22
**Status:** Ready for planning

<domain>
## Phase Boundary

All packages in the monorepo compile with `turbo run build` and pass lint with `turbo run lint` — zero errors, zero warnings. The zed-extension package is removed entirely as part of this phase.

</domain>

<decisions>
## Implementation Decisions

### Package scope
- 7 packages must build: core, cli, api, desktop, docsite, prxi, vscode-extension
- zed-extension is deleted entirely (remove `packages/zed-extension/` directory and all workspace references)
- VS Code extension only needs to build — marketplace publish is NOT part of this release
- npm publish (core, cli, api) is Phase 3 — this phase just gets builds passing

### Claude's Discretion
- How to fix TypeScript errors (proper type fixes vs type assertions where reasonable)
- Lint error resolution approach (fix code vs disable specific rules where appropriate)
- Dependency version resolution strategy
- Build order optimization

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches. The goal is a clean build, not a refactor.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-build-health*
*Context gathered: 2026-01-22*
