# Testing Patterns

**Analysis Date:** 2026-01-22

## Test Framework

**Runner:**
- Jest 29.7.0 (configured in all testable packages)
- Configuration: individual `jest.config.js` per package

**Assertion Library:**
- Jest's built-in expect API (no additional assertion libraries)

**Run Commands:**
```bash
pnpm run test              # Run all tests across monorepo via turbo
pnpm run test:core         # Run core package tests only
pnpm run test:api          # Run API package tests only
pnpm run test:cli          # Run CLI package tests only

pnpm run test:watch        # Watch mode for all tests
pnpm run test:watch:core   # Watch mode for core package

pnpm run test:coverage     # Generate coverage reports
pnpm run test:coverage:core
pnpm run test:coverage:api
pnpm run test:coverage:cli
```

## Test File Organization

**Location:**
- Co-located with source code in `__tests__` directories at same level as source files
- Pattern: `src/__tests__/[feature].test.ts`

**Naming:**
- Test files use `.test.ts` suffix (not `.spec.ts`)
- Match source file name: `database.ts` → `__tests__/database.test.ts`, `settings.ts` → `__tests__/settings.test.ts`

**Structure:**
```
packages/core/src/
├── database.ts
├── settings.ts
├── workspace-utils.ts
└── __tests__/
    ├── database.test.ts
    ├── settings.test.ts
    ├── scanner.test.ts
    └── detector.test.ts

packages/api/src/
├── index.ts
├── database.ts
├── types.ts
└── __tests__/
    ├── database.test.ts
    ├── routes.test.ts
    └── scanner.test.ts
```

## Test Structure

**Suite Organization:**
- Outer describe block names module/function being tested
- Nested describe blocks for logical feature groupings
- One assertion per test when possible (test single responsibility)

```typescript
describe('database', () => {
  const dataDir = path.join(os.homedir(), '.projax');
  const portFile = path.join(dataDir, 'api-port.txt');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('DatabaseManager constructor', () => {
    it('should initialize database manager', () => {
      mockedFs.existsSync.mockReturnValue(false);
      const db = getDatabaseManager();
      expect(db).toBeDefined();
      expect(typeof db.getAllProjects).toBe('function');
    });
  });

  describe('Project operations', () => {
    beforeEach(() => {
      mockedFs.existsSync.mockReturnValue(false);
    });

    describe('addProject', () => {
      it('should add a project successfully', () => {
        const mockProject: Project = { /* ... */ };
        mockedExecSync.mockReturnValue(JSON.stringify(mockProject));

        const db = getDatabaseManager();
        const result = db.addProject('Test Project', '/test/path');

        expect(result).toEqual(mockProject);
      });
    });
  });
});
```

**Patterns:**
- `beforeEach()` for test setup and mock initialization
- `afterEach()` for cleanup (file system, singleton resets)
- `describe()` blocks nested 2-3 levels deep for organization
- `it()` describes specific test case behavior starting with "should"

## Mocking

**Framework:** Jest's built-in mocking system

**Patterns:**

1. **Module mocking with jest.mock():**
```typescript
jest.mock('fs');
jest.mock('child_process');
const mockedFs = fs as jest.Mocked<typeof fs>;
const mockedExecSync = execSync as jest.MockedFunction<typeof execSync>;
```

2. **Return value configuration:**
```typescript
mockedExecSync.mockReturnValue(JSON.stringify(mockProject));
mockedExecSync.mockImplementation(() => {
  throw new Error('API request failed');
});
```

3. **Partial mocking with spread operator:**
```typescript
jest.mock('os', () => ({
  ...jest.requireActual('os'),
  homedir: jest.fn(() => testConfig.dataDir || os.tmpdir()),
}));
```

4. **Mock reset in beforeEach:**
```typescript
beforeEach(() => {
  jest.clearAllMocks();  // Clear all mock call history
  mockedFs.existsSync.mockReturnValue(false);  // Reset return values
});
```

**What to Mock:**
- External modules: fs, child_process, os (for controlled testing)
- Network calls: execSync curl calls, HTTP requests
- Time-dependent operations: Date.now() for timestamps (not currently mocked but should be)
- Database singletons for isolation

**What NOT to Mock:**
- Pure utility functions (helpers, transformers)
- Type definitions and interfaces
- Test utilities and fixtures
- Internal module dependencies that should be tested together

**Example from database.test.ts - Complex mocking:**
```typescript
jest.mock('fs');
jest.mock('child_process');
jest.mock('os', () => ({
  ...jest.requireActual('os'),
  homedir: jest.fn(() => testConfig.dataDir || os.tmpdir()),
}));

// Import AFTER mocking to get mocked versions
import { JSONDatabase, getDatabase, resetDatabase } from '../database';

describe('JSONDatabase', () => {
  beforeEach(() => {
    const uniqueId = `${Date.now()}-${process.hrtime.bigint()}-${Math.random().toString(36).substring(7)}`;
    testConfig.dataDir = path.join(os.tmpdir(), `projax-test-${uniqueId}`);
    if (fs.existsSync(testConfig.dataDir)) {
      fs.rmSync(testConfig.dataDir, { recursive: true, force: true });
    }
    fs.mkdirSync(testConfig.dataDir, { recursive: true });
  });

  afterEach(() => {
    resetDatabase();
    if (fs.existsSync(testConfig.dataDir)) {
      fs.rmSync(testConfig.dataDir, { recursive: true, force: true });
    }
  });
});
```

## Fixtures and Factories

**Test Data:**
- No dedicated fixture factory pattern currently in use
- Mock data inline within test cases
- Data structures match interface definitions exactly

```typescript
const mockProject: Project = {
  id: 1,
  name: 'Test Project',
  path: '/test/path',
  description: null,
  framework: null,
  last_scanned: null,
  created_at: Date.now(),
};

const mockTests: Test[] = [
  {
    id: 1,
    project_id: 1,
    file_path: '/test/file.test.ts',
    framework: 'jest',
    status: null,
    last_run: null,
    created_at: Date.now(),
  },
];
```

**Location:**
- Inline within test files (no separate fixtures directory)
- Mock data defined at test case level or describe block level

**Alternative approach for shared data:**
- Could extract to separate fixture files if needed: `__tests__/fixtures/` directory (currently not used)
- Example pattern: `export const PROJECT_FIXTURE = { ... }` in `fixtures.ts`

## Coverage

**Requirements:**
- `projax-core` jest.config.js:
  - branches: 45%, functions: 65%, lines: 60%, statements: 55%
- `projax-api` jest.config.js:
  - branches: 25%, functions: 40%, lines: 40%, statements: 40%
- `projax-cli` jest.config.js:
  - branches: 40%, functions: 40%, lines: 40%, statements: 40%
- Coverage thresholds enforced at build time; tests fail if thresholds not met

**View Coverage:**
```bash
pnpm run test:coverage           # Generate coverage for all packages
pnpm run test:coverage:core      # Core package coverage
pnpm run test:coverage:api       # API package coverage

# Coverage reports generated to:
packages/[core|api|cli]/coverage/
# View: packages/core/coverage/index.html in browser for HTML report
# View: coverage/ directory for text/lcov reports
```

**Coverage Configuration:**
```javascript
// jest.config.js example from core package
collectCoverageFrom: [
  'src/**/*.ts',
  '!src/**/*.d.ts',
  '!src/**/__tests__/**',
],
coverageDirectory: 'coverage',
coverageReporters: ['text', 'lcov', 'html'],
```

**Excluded from coverage:**
- TypeScript declaration files (`*.d.ts`)
- Test files themselves (`__tests__/**`)
- CLI package excludes: `src/index.ts` (main entry, integration tested), `src/prxi.tsx` (React component)
- API package excludes: Main entry points and integration tests

## Test Types

**Unit Tests:**
- Scope: Individual functions, classes, modules
- Approach: Mock external dependencies; test business logic in isolation
- Examples: `database.test.ts` (DatabaseManager methods), `settings.test.ts` (setting getters/setters)
- Pattern: Small datasets, synchronous assertions, quick execution

```typescript
describe('addProject', () => {
  it('should add a project successfully', () => {
    const mockProject: Project = { /* ... */ };
    mockedExecSync.mockReturnValue(JSON.stringify(mockProject));

    const db = getDatabaseManager();
    const result = db.addProject('Test Project', '/test/path');

    expect(result).toEqual(mockProject);
    expect(mockedExecSync).toHaveBeenCalledWith(
      expect.stringContaining('curl -s -f -X POST'),
      expect.any(Object)
    );
  });
});
```

**Integration Tests:**
- Scope: API routes, database operations with real file system interactions
- Approach: Spin up Express app, make HTTP requests via supertest, verify response and side effects
- Examples: `routes.test.ts` (full API endpoint flows)
- Pattern: Create temporary test directories, real file I/O, clean up after

```typescript
describe('GET /api/projects', () => {
  let app: Express;
  let testProjectDir: string;

  beforeEach(() => {
    const uniqueId = `${Date.now()}-${process.hrtime.bigint()}-${Math.random().toString(36).substring(7)}`;
    testConfig.dataDir = path.join(os.tmpdir(), `projax-api-test-${uniqueId}`);
    testProjectDir = path.join(testConfig.dataDir, 'test-project');

    fs.mkdirSync(testProjectDir, { recursive: true });
    app = express();
    app.use(express.json());
    app.use('/api', apiRouter);
    new JSONDatabase();
  });

  it('should return all projects', async () => {
    const db = new JSONDatabase();
    db.addProject('Project 1', testProjectDir);

    const response = await request(app).get('/api/projects');
    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
  });
});
```

**E2E Tests:**
- Framework: Not currently implemented
- Would test: Full user workflows from CLI to API to database
- Future implementation pattern: Could use playwright or cypress for UI testing if desktop app testing needed

## Common Patterns

**Async Testing:**
- Use `async/await` with jest test functions
- Request tests use supertest: `await request(app).get('/api/projects')`
- Promise-based mocks with `mockResolvedValue()` if needed (not commonly used, most use synchronous mocks)

```typescript
it('should return projects', async () => {
  const response = await request(app).get('/api/projects');
  expect(response.status).toBe(200);
  expect(response.body).toEqual([]);
});
```

**Error Testing:**
- Test error cases explicitly
- Verify error messages and types

```typescript
describe('addProject', () => {
  it('should handle API errors', () => {
    mockedExecSync.mockImplementation(() => {
      throw new Error('API request failed');
    });

    const db = getDatabaseManager();
    expect(() => db.addProject('Test', '/path')).toThrow();
  });
});

it('should return null for 404 errors', () => {
  mockedExecSync.mockImplementation(() => {
    const error = new Error('curl failed with 404 status');
    throw error;
  });

  const db = getDatabaseManager();
  expect(() => db.getProject(999)).toThrow();
});
```

**Edge Cases and Boundaries:**
- Empty data (empty arrays, null values, empty strings)
- Null/undefined handling
- Database singleton state management across tests

```typescript
it('should return empty array when no projects exist', () => {
  mockedExecSync.mockReturnValue(JSON.stringify([]));
  const db = getDatabaseManager();
  const result = db.getAllProjects();
  expect(result).toEqual([]);
});

it('should return null if project path not found', () => {
  mockedExecSync.mockReturnValue(JSON.stringify([]));
  const db = getDatabaseManager();
  const result = db.getProjectByPath('/nonexistent');
  expect(result).toBeNull();
});
```

**Singleton Management:**
- Database manager is singleton; tests reset it between runs
- Pattern: `resetDatabase()` called in afterEach blocks

```typescript
afterEach(() => {
  resetDatabase();  // Reset singleton instance
  // ... cleanup filesystem
});

describe('getDatabaseManager singleton', () => {
  it('should return the same instance on multiple calls', () => {
    mockedFs.existsSync.mockReturnValue(false);
    const db1 = getDatabaseManager();
    const db2 = getDatabaseManager();
    expect(db1).toBe(db2);
  });
});
```

## Jest Configuration Details

**Per-Package Settings:**

`packages/core/jest.config.js`:
```javascript
module.exports = {
  preset: 'ts-jest',           // Use ts-jest for TypeScript compilation
  testEnvironment: 'node',     // Node.js environment (not jsdom)
  roots: ['<rootDir>/src'],    // Search for tests in src/
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  verbose: true,               // Detailed test output
  testTimeout: 10000,          // 10 second timeout per test
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.d.ts', '!src/**/__tests__/**'],
};
```

`packages/api/jest.config.js`:
```javascript
module.exports = {
  // ... same as core with lower coverage thresholds
  maxWorkers: 1,  // Run tests serially to avoid conflicts (important for file system operations)
};
```

`packages/cli/jest.config.js`:
```javascript
module.exports = {
  // ... excludes index.ts (integration tested) and prxi.tsx (React component)
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    '!src/index.ts',
    '!src/prxi.tsx',
  ],
};
```

**Test Discovery:**
- ts-jest preset handles TypeScript to JavaScript compilation automatically
- Test files must end with `.test.ts` or `.spec.ts` (dot pattern matches)
- Tests in `__tests__/` directories with `.ts` extension found automatically

---

*Testing analysis: 2026-01-22*
