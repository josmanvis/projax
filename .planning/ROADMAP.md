# Roadmap: Projax v3.3.63 Patch Release

## Overview

Ship a clean patch release of Projax to npm. The path is: fix all build/lint issues, ensure tests pass, then version bump and publish. This is a stabilization release -- no new features, just getting the existing codebase to a publishable state.

## Phases

- [ ] **Phase 1: Build Health** - All packages compile and lint cleanly
- [ ] **Phase 2: Test Health** - All test suites pass
- [ ] **Phase 3: Release** - Version bump, publish to npm, README current

## Phase Details

### Phase 1: Build Health
**Goal**: Developer can run `turbo run build` and `turbo run lint` with zero errors across the entire monorepo
**Depends on**: Nothing (first phase)
**Requirements**: BUILD-01, BUILD-02, BUILD-03, POL-01
**Success Criteria** (what must be TRUE):
  1. `turbo run build` completes with exit code 0 and no TypeScript errors in any package
  2. `turbo run lint` completes with exit code 0 across all packages
  3. All workspace dependency references in package.json files resolve correctly (no missing or mismatched versions)
  4. No deprecation warnings or build warnings appear during compilation
**Plans**: TBD

Plans:
- [ ] 01-01: Fix TypeScript compilation errors and workspace references
- [ ] 01-02: Fix lint errors and build warnings

### Phase 2: Test Health
**Goal**: Developer can run test suites for core, CLI, and API packages with all tests passing
**Depends on**: Phase 1
**Requirements**: TEST-01, TEST-02, TEST-03
**Success Criteria** (what must be TRUE):
  1. `pnpm test:core` passes with zero failures
  2. `pnpm test:cli` passes with zero failures
  3. `pnpm test:api` passes with zero failures
**Plans**: TBD

Plans:
- [ ] 02-01: Fix failing tests across core, CLI, and API packages

### Phase 3: Release
**Goal**: Projax v3.3.63 is published to npm and installable by users
**Depends on**: Phase 2
**Requirements**: REL-01, REL-02, REL-03, REL-04, POL-02
**Success Criteria** (what must be TRUE):
  1. All package.json files show version 3.3.63
  2. `npm install -g projax` installs the new version successfully
  3. Published packages on npm show correct version, description, and README
  4. `prx --version` outputs 3.3.63 after global install
**Plans**: TBD

Plans:
- [ ] 03-01: Version bump, README update, and npm publish

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Build Health | 0/2 | Not started | - |
| 2. Test Health | 0/1 | Not started | - |
| 3. Release | 0/1 | Not started | - |
