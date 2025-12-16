# Build System Documentation

## Overview

The Projax project uses **Turbo** for fast, parallel builds and **pnpm** for efficient package management. This document describes the build system architecture and usage.

## Build Tools

### Turbo

Turbo is a high-performance build system that enables:
- **Parallel execution** of independent tasks
- **Intelligent caching** to skip unnecessary rebuilds
- **Task dependency management** to ensure correct build order

### pnpm

pnpm is used as the package manager for:
- Faster installs with content-addressable storage
- Strict dependency resolution
- Workspace support for monorepo structure

## Build Configuration

### Turbo Configuration (`turbo.json`)

The Turbo pipeline is configured with the following tasks:

- **build**: Builds packages with dependency ordering (`^build` means wait for dependencies)
- **test**: Runs tests after build completes
- **test:coverage**: Generates coverage reports
- **typecheck**: Type checks TypeScript without building
- **lint**: Lints code without building

### Package Scripts

#### Root Level (`package.json`)

```bash
pnpm run build          # Build all packages in parallel
pnpm run test           # Run all tests in parallel
pnpm run test:coverage  # Generate coverage for all packages
pnpm run typecheck      # Type check all packages
pnpm run lint           # Lint all packages
pnpm run lint:fix       # Fix linting issues
```

#### Individual Packages

Each package has its own build scripts:
- `build`: Compile TypeScript to JavaScript
- `typecheck`: Type check without building
- `lint`: Lint source files
- `test`: Run tests
- `test:coverage`: Generate coverage reports

## Build Process

### Development Build

```bash
# Build all packages
pnpm run build

# Build specific package
pnpm run build:core
pnpm run build:api
pnpm run build:cli
```

### Production Build

The release script (`scripts/release.js`) orchestrates a complete build:

1. Type checking
2. Linting
3. Running tests
4. Coverage verification
5. Building all packages
6. Build artifact validation

### Build Artifact Validation

The `scripts/validate-build.js` script verifies that:
- Required dist files exist for each package
- Main entry points are present
- Type definition files are generated
- Bin executables are available

## Performance

### Build Times

With Turbo parallelization:
- **Sequential builds**: ~60-90 seconds
- **Parallel builds**: ~20-30 seconds (60-70% improvement)

### Caching

Turbo caches build outputs based on:
- Source file content
- Dependencies
- Environment variables

Cache hits skip rebuilds entirely, making incremental builds very fast.

## CI/CD Integration

The GitHub Actions workflow (`.github/workflows/ci.yml`) uses Turbo for:
- Parallel test execution
- Cached dependency installation
- Efficient build validation

## Troubleshooting

### Clear Turbo Cache

```bash
# Clear all Turbo cache
pnpm run build --force

# Or manually
rm -rf .turbo
```

### Rebuild Everything

```bash
pnpm run clean
pnpm install
pnpm run build
```

### Build Specific Package

```bash
# Using Turbo filter
turbo run build --filter=projax-core

# Using pnpm filter
pnpm run build --filter projax-core
```

## Best Practices

1. **Always use pnpm** - Never use npm or yarn
2. **Run builds from root** - Let Turbo handle parallelization
3. **Check build artifacts** - Use `validate-build.js` before releases
4. **Leverage caching** - Turbo cache speeds up incremental builds
5. **Run typecheck before build** - Catch type errors early

## Package Dependencies

Build order is automatically handled by Turbo based on workspace dependencies:

```
projax-core (no dependencies)
  └─ projax-api
  └─ projax (CLI)
      └─ projax-desktop
```

Turbo ensures dependencies are built before dependents.

## Related Documentation

- [Testing Guide](./testing/guide.md) - Testing setup and practices
- [Release Process](../scripts/release.js) - Release script documentation

