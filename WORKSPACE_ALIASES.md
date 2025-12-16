# Workspace Aliases Documentation

## Overview

This monorepo uses **workspace aliases** for internal package dependencies, not npm scoped packages. The packages `projax-core`, `projax-api`, etc. are **local workspace packages**, not published npm packages.

## How It Works

### Package Dependencies

In `package.json` files, workspace dependencies are declared using `workspace:*`:

```json
{
  "dependencies": {
    "projax-core": "workspace:*"
  }
}
```

**pnpm** automatically resolves `workspace:*` to the local package in `packages/core/` based on the package name matching.

### TypeScript Path Mappings

TypeScript configuration files use path mappings to point to source files for development:

```json
{
  "compilerOptions": {
    "paths": {
      "projax-core": ["../../core/src/index"]
    }
  }
}
```

**Important**: These path mappings are for TypeScript compilation only. At runtime, Node.js resolves `projax-core` via the workspace dependency, not the path mapping.

### Runtime Resolution

At runtime, Node.js (via pnpm) resolves `projax-core` using the workspace dependency:
1. pnpm creates symlinks in `node_modules/` pointing to `packages/core/`
2. When code requires `'projax-core'`, Node.js follows the symlink
3. The resolved module is the built `packages/core/dist/index.js`

## Package Names

| Package Name | Location | Purpose |
|-------------|----------|---------|
| `projax-core` | `packages/core/` | Shared database, types, and utilities |
| `projax-api` | `packages/api/` | REST API server |
| `projax-desktop` | `packages/desktop/` | Electron desktop app |
| `projax` (CLI) | `packages/cli/` | Command-line interface |

## Build Process

1. **TypeScript Compilation**: Uses path mappings to resolve imports from source files
2. **Dependency Resolution**: pnpm resolves `workspace:*` dependencies to local packages
3. **Runtime**: Node.js resolves modules via pnpm's symlinks to built packages

## Important Notes

- ❌ **NOT** npm scoped packages (e.g., `@projax/core`)
- ✅ **Local workspace packages** resolved by pnpm
- ✅ TypeScript path mappings point to **source files** for development
- ✅ Runtime resolution uses **workspace dependencies** via pnpm symlinks
- ✅ Build process copies built packages to `dist/` directories as needed

## Troubleshooting

If you see errors about `projax-core` not being found:

1. **Ensure pnpm is used**: `pnpm install` creates workspace symlinks
2. **Check package.json**: Dependencies should use `workspace:*`
3. **Verify build**: Run `pnpm run build:core` to build the core package
4. **Check symlinks**: `ls -la node_modules/ | grep projax-core` should show a symlink







