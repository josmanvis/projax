# Requirements: Projax

**Defined:** 2026-01-22
**Core Value:** Unified dashboard — developers can see and manage all their projects, ports, and scripts from a single interface

## v1 Requirements

### Build Health

- [ ] **BUILD-01**: All packages compile without TypeScript errors (`turbo run build`)
- [ ] **BUILD-02**: Lint passes across all packages (`turbo run lint`)
- [ ] **BUILD-03**: No broken workspace dependency references

### Test Health

- [ ] **TEST-01**: Core package tests pass (`pnpm test:core`)
- [ ] **TEST-02**: CLI package tests pass (`pnpm test:cli`)
- [ ] **TEST-03**: API package tests pass (`pnpm test:api`)

### Release

- [ ] **REL-01**: Version bumped to 3.3.63 across all packages
- [ ] **REL-02**: CLI package published to npm successfully
- [ ] **REL-03**: Core package published to npm (if public)
- [ ] **REL-04**: API package published to npm (if public)

### Polish

- [ ] **POL-01**: Fix any build warnings or deprecation notices
- [ ] **POL-02**: Ensure README is current for npm listing

## v2 Requirements

### Post-Release Polish

- **POL-03**: Improve error messages across CLI commands
- **POL-04**: Add missing help text to CLI subcommands
- **POL-05**: Desktop app stability improvements
- **POL-06**: VS Code extension UX improvements

## Out of Scope

| Feature | Reason |
|---------|--------|
| New framework detection | Polish existing before expanding |
| New editor extensions | VS Code + Zed sufficient for now |
| SQLite migration | JSON flat file working fine for local tool |
| Authentication/multi-user | Local-only tool by design |
| Mobile app | CLI + desktop covers the use case |
| Major new features | Ship what exists, stabilize first |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| BUILD-01 | Phase 1 | Pending |
| BUILD-02 | Phase 1 | Pending |
| BUILD-03 | Phase 1 | Pending |
| TEST-01 | Phase 1 | Pending |
| TEST-02 | Phase 1 | Pending |
| TEST-03 | Phase 1 | Pending |
| REL-01 | Phase 2 | Pending |
| REL-02 | Phase 2 | Pending |
| REL-03 | Phase 2 | Pending |
| REL-04 | Phase 2 | Pending |
| POL-01 | Phase 1 | Pending |
| POL-02 | Phase 2 | Pending |

**Coverage:**
- v1 requirements: 12 total
- Mapped to phases: 12
- Unmapped: 0

---
*Requirements defined: 2026-01-22*
*Last updated: 2026-01-22 after initial definition*
