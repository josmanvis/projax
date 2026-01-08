# Quick Test Guide

## Running Tests

### API Package

```bash
cd packages/api

# Run all tests
npm test

# Watch mode (re-run on file changes)
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### CLI Package

```bash
cd packages/cli

# Run all tests
npm test

# Watch mode (re-run on file changes)
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Run All Tests

```bash
# From project root
(cd packages/api && npm test) && (cd packages/cli && npm test)
```

## Installing Test Dependencies

If you haven't installed dependencies yet:

```bash
# API package
cd packages/api
npm install

# CLI package
cd packages/cli
npm install
```

## Test Coverage

After running `npm run test:coverage`, view the HTML report:

```bash
# API coverage
open packages/api/coverage/lcov-report/index.html

# CLI coverage
open packages/cli/coverage/lcov-report/index.html
```

## Running Specific Tests

### Single test file

```bash
npm test -- database.test.ts
```

### Tests matching a pattern

```bash
npm test -- --testNamePattern="should extract port"
```

### With verbose output

```bash
npm test -- --verbose
```

## Test Structure

### API Tests (packages/api/src/__tests__)
- `database.test.ts` - Database operations (85+ tests)
- `scanner.test.ts` - Test file scanning (40+ tests)
- `routes.test.ts` - API endpoints (45+ tests)

### CLI Tests (packages/cli/src/__tests__)
- `port-utils.test.ts` - Port extraction (25+ tests)
- `script-runner.test.ts` - Script detection (50+ tests)
- `port-scanner.test.ts` - Port scanning (10+ tests)

## Expected Results

All tests should pass with:
- ✅ 170+ tests in API package
- ✅ 85+ tests in CLI package
- ✅ Coverage > 75% across the board
- ⚡ Execution time < 10 seconds total

## Troubleshooting

### "Cannot find module" errors
```bash
npm install
```

### Tests timing out
Add to test file:
```typescript
jest.setTimeout(10000);
```

### Port conflicts
Tests use temporary directories and shouldn't conflict with running services.

### Permission errors
Ensure you have write access to `/tmp` directory.

## CI/CD Integration

Tests are ready for continuous integration. Example:

```yaml
- name: Test
  run: |
    cd packages/api && npm install && npm test
    cd packages/cli && npm install && npm test
```

## Documentation

For detailed information:
- **TESTING_GUIDE.md** - Comprehensive testing documentation
- **TEST_SUMMARY.md** - Overview of all tests

## Need Help?

1. Check error messages carefully
2. Review test files for examples
3. Ensure dependencies are installed
4. Check that TypeScript compiles (`npm run build`)

---

**Happy Testing! 🧪**

