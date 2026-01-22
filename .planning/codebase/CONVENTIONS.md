# Coding Conventions

**Analysis Date:** 2026-01-22

## Naming Patterns

**Files:**
- kebab-case for TypeScript files: `database.ts`, `settings.ts`, `port-scanner.ts`, `test-parser.ts`, `port-extractor.ts`
- Test files use `.test.ts` or `.spec.ts` suffix in `__tests__` directories
- Example: `__tests__/database.test.ts`, `__tests__/settings.test.ts`

**Functions:**
- camelCase for regular functions: `getDatabaseManager()`, `getSetting()`, `detectProjectType()`, `parseNodeScripts()`
- PascalCase for classes: `DatabaseManager`, `JSONDatabase`, `ScriptRunner`
- Private functions prefixed with underscore or marked as private methods within classes
- Utility functions often prefixed with get/set/detect/parse to indicate operation: `getProjectScripts()`, `detectProjectType()`, `parseNodeScripts()`

**Variables:**
- camelCase for variables: `apiBaseUrl`, `defaultPort`, `testConfig`, `processDataDir`
- SCREAMING_SNAKE_CASE for constants: `PORT_START`, `PORT_END`, `DEFAULT_SETTINGS`
- Unused parameters prefixed with underscore (ESLint rule configured): `const result = values.map((_item) => {})`

**Types:**
- PascalCase for interfaces: `Project`, `Test`, `JenkinsJob`, `ProjectPort`, `TestResult`, `EditorSettings`, `BrowserSettings`
- Type unions and exported type aliases: `EditorType`, `BrowserType`, `ProjectType`, `ScanResponse`
- Generic type parameters: `<T>` for request methods handling multiple return types

**Database/Schema:**
- snake_case for database column names: `project_id`, `file_path`, `last_scanned`, `last_run`, `created_at`, `script_name`, `config_source`, `last_detected`, `raw_output`, `git_branch`
- Matches SQLite convention and API response structures

## Code Style

**Formatting:**
- No explicit Prettier configuration found - relies on ESLint for style enforcement
- 2-space indentation (TypeScript/JavaScript standard)
- Semicolons required at end of statements (ESLint enforced)
- No trailing commas explicitly configured

**Linting:**
- ESLint with TypeScript plugin configuration: `/Users/jose/Developer/projax/.eslintrc.js`
- Parser: `@typescript-eslint/parser` with ES2020 ecmaVersion
- Extended configs: `eslint:recommended` and `plugin:@typescript-eslint/recommended`
- Key rules:
  - `@typescript-eslint/no-explicit-any`: warn (discourage any types)
  - `@typescript-eslint/no-unused-vars`: warn, ignore parameters starting with `_`
  - `@typescript-eslint/explicit-function-return-type`: off (not enforced)
  - `@typescript-eslint/no-non-null-assertion`: warn (discourage `!` operator)
- Ignored patterns: dist/, node_modules/, coverage/, build/, out/, *.config.js, *.d.ts, packages/docsite/**

**TypeScript Configuration:**
- Target: ES2022
- Module system: commonjs
- Strict mode: enabled
- Declaration files generated (`declaration: true`)
- Output directory: `./dist`
- `esModuleInterop` and `forceConsistentCasingInFileNames` enabled

## Import Organization

**Order:**
1. Built-in Node.js modules (path, fs, os, child_process, net)
2. External npm packages (express, jest, etc.)
3. Relative imports from local project (./database, ./types, ../core-bridge)

**Example from codebase:**
```typescript
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import { execSync } from 'child_process';
import { getDatabaseManager } from './database';
import { detectPortInUse, getProcessOnPort } from './port-utils';
```

**Path Aliases:**
- No path aliases configured in tsconfig.json (uses standard relative paths)
- Monorepo workspace dependencies use `workspace:*` specification in package.json

## Error Handling

**Patterns:**
- Try/catch blocks for API calls and file system operations: `try { ... } catch (error) { ... }`
- Error messages prefixed with context: `'API request failed: ...'`, `'Resource not found'`
- Graceful error handling for EPIPE errors in logging functions (see `safeLog` and `safeError` in script-runner.ts)
- HTTP endpoints return JSON error format: `{ error: 'message', path: req.path }`
- Null coalescing for missing values: returns `null` or `undefined` rather than throwing for missing optional resources

**Example from database.ts:**
```typescript
try {
  const result = execSync(curlCmd, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
  if (!result || result.trim() === '') {
    return undefined as T;
  }
  return JSON.parse(result) as T;
} catch (error) {
  if (error instanceof Error && error.message.includes('404')) {
    throw new Error('Resource not found');
  }
  throw new Error(`API request failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
}
```

## Logging

**Framework:** console methods (console.log, console.error)

**Patterns:**
- Utility functions wrap logging to handle stream errors gracefully (`safeLog`, `safeError`)
- Simple string prefixes for clarity: `'✓ API server running...'`, `'Shutting down API server...'`
- Error logging follows error message patterns
- No structured logging library (winston, pino, etc.) currently in use

**Example from index.ts:**
```typescript
console.log(`✓ API server running on http://localhost:${port}`);
console.log(`  Health check: http://localhost:${port}/health`);
console.error('Failed to start API server:', error);
```

## Comments

**When to Comment:**
- Public functions and exported types use JSDoc comments to describe purpose and parameters
- Complex logic blocks are commented to explain "why" not "what"
- TODO/FIXME comments are used but not systematically tracked (ESLint allows @typescript-eslint/no-explicit-any: warn style)

**JSDoc/TSDoc:**
- Used for exported functions and type definitions
- Document public API contracts: parameters, return types, exceptions

**Example from settings.ts:**
```typescript
/**
 * Get a setting value by key
 */
export function getSetting(key: string): string | null {
  return getDatabaseManager().getSetting(key);
}

/**
 * Get editor settings
 */
export function getEditorSettings(): EditorSettings { ... }
```

## Function Design

**Size:** Functions range from 5-50 lines typically; larger functions (80+ lines) handle complex operations like request handling or script parsing

**Parameters:**
- Prefer explicit parameters over large objects (except for type-safe data structures)
- Optional parameters use `= null` or `= undefined` defaults
- Complex parameters grouped using interfaces: `updates: Partial<Omit<Project, 'id' | 'created_at'>>`

**Example from database.ts:**
```typescript
addTestResult(
  projectId: number,
  scriptName: string,
  passed: number,
  failed: number,
  skipped: number = 0,
  total: number = passed + failed + skipped,
  duration: number | null = null,
  coverage: number | null = null,
  framework: string | null = null,
  rawOutput: string | null = null
): TestResult
```

**Return Values:**
- Explicit return types always specified for public functions
- Return `null` for "not found" scenarios (not throwing for expected missing data)
- Throw errors only for unexpected failures
- Generic request methods use `<T>` for type-safe returns: `private request<T>(endpoint: string, options?: {}): T`

## Module Design

**Exports:**
- Named exports for functions and interfaces
- Default exports rarely used (only for routing modules like `/routes/index.ts`)
- Singleton pattern used for database: `getDatabaseManager()` returns single instance
- Type definitions exported alongside implementations: `export interface Project { ... }` in same file

**Barrel Files:**
- Not heavily used; most imports are direct file imports
- `/routes/index.ts` barrel exports route handlers for Express

**Example pattern from core/src:**
```typescript
// database.ts exports both types and functions
export interface Project { ... }
export interface Test { ... }
export function getDatabaseManager(): DatabaseManager { ... }

// settings.ts imports from database
import { getDatabaseManager } from './database';
export function getSetting(key: string): string | null { ... }
```

## Monorepo Conventions

**Package Structure:**
- Root `package.json` defines monorepo with pnpm workspaces
- Each package (`/packages/*`) has its own package.json with scripts
- Shared scripts at root: `pnpm run build`, `pnpm run test`, `pnpm run lint`
- Filtered package commands: `pnpm --filter projax-core run build`

**Dependencies:**
- Internal workspace dependencies use `workspace:*` specification
- Example: `"projax-core": "workspace:*"` in projax-api package.json

---

*Convention analysis: 2026-01-22*
