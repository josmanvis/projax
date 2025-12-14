# Testing Guide

This document describes the testing setup and practices for the Projax project.

## Test Coverage

We have comprehensive unit tests for the following packages:

### API Package (`packages/api`)

- **Database Module** (`database.test.ts`)
  - Database initialization and persistence
  - Project CRUD operations
  - Test management
  - Jenkins job tracking
  - Port management
  - Settings storage
  - Data migration

- **Scanner Service** (`scanner.test.ts`)
  - Test framework detection (Jest, Vitest, Mocha, Playwright, Cypress, pytest, unittest)
  - Test file discovery
  - Directory traversal and filtering
  - Multi-project scanning
  - Error handling

- **API Routes** (`routes.test.ts`)
  - Project endpoints (GET, POST, PUT, DELETE)
  - Test endpoints
  - Port endpoints
  - Settings endpoints
  - Tag management
  - Scanning operations
  - Error responses

### CLI Package (`packages/cli`)

- **Port Utils** (`port-utils.test.ts`)
  - Port extraction from error messages
  - Multiple error format support
  - Edge case handling

- **Script Runner** (`script-runner.test.ts`)
  - Project type detection (Node, Python, Rust, Go, Makefile)
  - Script parsing (package.json, pyproject.toml, Cargo.toml, Makefile)
  - Process tracking (load, save, remove)
  - Project-specific process management

- **Port Scanner** (`port-scanner.test.ts`)
  - Port staleness detection
  - 24-hour rescan logic
  - Mixed timestamp handling

## Running Tests

### Run All Tests

```bash
# From the root directory
cd packages/api && npm test
cd packages/cli && npm test
```

### Run Tests in Watch Mode

```bash
# API tests
cd packages/api && npm run test:watch

# CLI tests
cd packages/cli && npm run test:watch
```

### Generate Coverage Reports

```bash
# API coverage
cd packages/api && npm run test:coverage

# CLI coverage
cd packages/cli && npm run test:coverage
```

Coverage reports will be generated in the `coverage/` directory within each package.

## Test Structure

### Test Organization

Tests are organized in `__tests__` directories within the `src` folder of each package:

```
packages/
  api/
    src/
      __tests__/
        database.test.ts
        routes.test.ts
        scanner.test.ts
  cli/
    src/
      __tests__/
        port-utils.test.ts
        script-runner.test.ts
        port-scanner.test.ts
```

### Test Naming Convention

- Test files: `*.test.ts`
- Test suites: `describe('ModuleName', () => { ... })`
- Test cases: `it('should do something', () => { ... })`

### Test Patterns

#### Unit Tests

Focus on testing individual functions and modules in isolation:

```typescript
describe('extractPortFromError', () => {
  it('should extract port from EADDRINUSE error', () => {
    const error = 'EADDRINUSE: address already in use :::3000';
    const port = extractPortFromError(error);
    expect(port).toBe(3000);
  });
});
```

#### Integration Tests

Test API endpoints with supertest:

```typescript
describe('POST /api/projects', () => {
  it('should create a new project', async () => {
    const response = await request(app)
      .post('/api/projects')
      .send({ name: 'My Project', path: testProjectDir });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({ name: 'My Project' });
  });
});
```

## Test Setup and Teardown

### Temporary Directories

Tests use temporary directories to avoid affecting the actual user data:

```typescript
beforeEach(() => {
  testDir = path.join(os.tmpdir(), `projax-test-${Date.now()}`);
  fs.mkdirSync(testDir, { recursive: true });
  jest.spyOn(os, 'homedir').mockReturnValue(testDir);
});

afterEach(() => {
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
  }
  jest.restoreAllMocks();
});
```

### Mocking

We use Jest's mocking capabilities to isolate units under test:

- **os.homedir()**: Redirected to temporary test directories
- **File system**: Real fs operations on temporary directories
- **Module dependencies**: Mocked when necessary (e.g., core-bridge in CLI tests)

## Continuous Integration

### Local Pre-commit Testing

Run tests before committing:

```bash
npm test  # Run all tests
```

### CI/CD Integration

Tests should be integrated into your CI/CD pipeline:

```yaml
# Example GitHub Actions workflow
- name: Test API
  run: |
    cd packages/api
    npm install
    npm test

- name: Test CLI
  run: |
    cd packages/cli
    npm install
    npm test
```

## Writing New Tests

### Guidelines

1. **Test one thing at a time**: Each test should verify a single behavior
2. **Use descriptive names**: Test names should clearly describe what they test
3. **Arrange-Act-Assert**: Structure tests in three parts:
   - Arrange: Set up test data and conditions
   - Act: Execute the code under test
   - Assert: Verify the results

4. **Clean up**: Always clean up resources (files, mocks) in `afterEach`
5. **Avoid test interdependence**: Tests should be independent and runnable in any order

### Example Test Template

```typescript
describe('MyModule', () => {
  let testData: any;

  beforeEach(() => {
    // Arrange: Set up test data
    testData = createTestData();
  });

  afterEach(() => {
    // Clean up
    cleanupTestData();
  });

  describe('myFunction', () => {
    it('should handle valid input', () => {
      // Arrange
      const input = 'valid';

      // Act
      const result = myFunction(input);

      // Assert
      expect(result).toBe('expected');
    });

    it('should handle invalid input', () => {
      const input = 'invalid';

      expect(() => {
        myFunction(input);
      }).toThrow('Expected error message');
    });

    it('should handle edge cases', () => {
      expect(myFunction('')).toBe('default');
      expect(myFunction(null)).toBeNull();
    });
  });
});
```

## Test Coverage Goals

We aim for the following coverage targets:

- **Statements**: > 80%
- **Branches**: > 75%
- **Functions**: > 80%
- **Lines**: > 80%

### Excluded from Coverage

The following are intentionally excluded from coverage:

- Type definition files (`*.d.ts`)
- Build output (`dist/`)
- Test files themselves
- Main CLI entry point (integration-focused)
- React components requiring different test setup

## Debugging Tests

### Running a Single Test File

```bash
npm test -- database.test.ts
```

### Running Tests Matching a Pattern

```bash
npm test -- --testNamePattern="should extract port"
```

### Verbose Output

```bash
npm test -- --verbose
```

### Debugging with Node Inspector

```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

Then open `chrome://inspect` in Chrome and select the Node process.

## Common Issues and Solutions

### Issue: "Cannot find module"

**Solution**: Ensure all dependencies are installed:
```bash
npm install
```

### Issue: "ENOENT: no such file or directory"

**Solution**: Check that temporary directories are being created and cleaned up properly in `beforeEach` and `afterEach`.

### Issue: "Port already in use" (for integration tests)

**Solution**: Use dynamic port allocation or ensure ports are released after tests.

### Issue: Tests timing out

**Solution**: Increase Jest timeout:
```typescript
jest.setTimeout(10000); // 10 seconds
```

## Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)

## Contributing

When adding new features:

1. Write tests for the new functionality
2. Ensure all existing tests pass
3. Update this guide if introducing new testing patterns
4. Aim for test coverage > 80%

## Questions?

If you have questions about testing, please:

1. Check this guide
2. Review existing test files for examples
3. Open an issue on GitHub

