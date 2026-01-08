---
description: "Project standards for package management and AI-generated documentation organization"
alwaysApply: true
---

# PROJAX Project Standards

## Package Manager
- **ALWAYS use `pnpm` instead of `npm`** for all package management operations
- Use `pnpm install`, `pnpm run`, `pnpm add`, etc.
- Never use `npm` commands unless explicitly requested by the user

## AI-Generated Documentation Organization
- **AI-generated markdown files** should be organized in the `docs/` folder structure:
  - Testing documentation → `docs/testing/`
  - Feature documentation → `docs/features/`
  - Release notes → `docs/releases/` (latest) or `archive/releases/` (older versions)
- **DO NOT** place AI-generated markdown files in the project root
- The main `README.md` file should remain at the root (it's not AI-generated)
- When creating new AI-generated documentation, place it in the appropriate `docs/` subdirectory

## Documentation Structure
```
docs/
├── testing/          # Test guides, results, summaries
├── features/         # Feature docs and implementation summaries
└── releases/         # Latest release notes and publish summaries

archive/
├── releases/         # Older version-specific release notes
└── testing/          # Older version-specific test results
```

