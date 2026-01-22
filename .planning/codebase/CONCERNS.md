# Codebase Concerns

**Analysis Date:** 2026-01-22

## Tech Debt

### Embedded Telemetry Logging in Production Code

**Issue:** Agent debug/telemetry logging (fetch calls to `http://127.0.0.1:7242`) scattered throughout codebase
- Files: `packages/desktop/src/main/main.ts` (44+ occurrences across codebase)
- Impact:
  - Hardcoded endpoint exposed in production binaries
  - Performance overhead from fetch calls that silently fail
  - Unclear purpose and authorization
  - Creates external dependency on local service
- Fix approach:
  - Remove all hardcoded telemetry calls from source
  - If logging needed, use conditional logging based on environment variable
  - Implement proper logging framework with configuration

### Inconsistent Error Handling Across Modules

**Issue:** Inconsistent error handling patterns between packages
- Files: Multiple files use different error strategies
  - `packages/api/src/database.ts` (lines 39-42) - Silent fallback on JSON parse errors
  - `packages/desktop/src/main/main.ts` - Some errors logged, others swallowed
  - `packages/cli/src/script-runner.ts` (lines 12-37) - Custom safe logging wrapper
- Impact: Difficult to debug issues in production; inconsistent user experience
- Fix approach:
  - Standardize error handling with centralized logger
  - Define error boundaries and recovery strategies
  - Add error telemetry (without external endpoints)

### Hardcoded Version String in Backup Utils

**Issue:** Hardcoded projax version in backup utility
- Files: `packages/core/src/backup-utils.ts` (line 46)
- Value: `'3.4.0'` (hardcoded string)
- Impact: Backup metadata will be incorrect after version updates
- Fix approach:
  - Import version from package.json at runtime
  - Use dynamic version resolution from package root

### TypeScript `any` Type Usage Not Fully Restricted

**Issue:** Widespread use of `any` type without strict checking
- Files: Multiple files across packages
  - `packages/cli/src/script-runner.ts` (line 12 - function parameter `args: any[]`)
  - `packages/desktop/src/renderer/mocks/mockAPI.ts`
  - Test files use `any` for mocking
- Impact: Reduces type safety; harder to catch integration bugs
- Fix approach:
  - Enable `noImplicitAny` in tsconfig.json if not already strict
  - Replace `any` with proper union types or generics
  - Use `unknown` where type is truly unknown, with type guards

### Deprecated @ts-ignore Comments

**Issue:** Multiple eslint-disable comments suggesting bypasses rather than fixes
- Files:
  - `packages/cli/src/core-bridge.ts` (line 12)
  - `packages/desktop/src/main/core.ts` (line 12)
  - `packages/desktop/src/main/main.ts` (lines 1036, 1039, 1062, 1065)
- Impact: Indicates code that should be refactored but has been side-stepped
- Fix approach:
  - Add issues to backlog for proper type corrections
  - Document why each eslint-disable is necessary
  - Set timeline for removal

## Known Bugs

### TODO in VSCode Extension Not Addressed

**Issue:** Incomplete feature in VSCode extension
- Files: `packages/vscode-extension/src/extension.ts` (line 261)
- Description: "In the future, we could send a message to the desktop app to focus this project"
- Impact: Project focus/context switching between VSCode and Desktop incomplete
- Trigger: When opening a project from VSCode
- Workaround: Manually switch to desktop app if needed

### Data.json File Path Hardcoded

**Issue:** Database path hardcoded to `~/.projax/data.json` across multiple packages
- Files:
  - `packages/api/src/database.ts` (line 30)
  - `packages/core/src/backup-utils.ts` (line 22)
  - `packages/zed-extension/src/lib.rs` (line 124)
- Impact: Cannot customize data location; breaks if moved; makes testing difficult
- Workaround: Currently no way to override

## Security Considerations

### File System Access Without Validation

**Issue:** File operations on database without comprehensive path validation
- Files: `packages/core/src/backup-utils.ts` (lines 35-37 mkdirSync, line 59 writeFileSync)
- Risk:
  - Directory traversal if paths are derived from user input
  - Permissions issues if backup directory is not writable
  - Silent failures on permission denied
- Current mitigation: Basic existence checks only
- Recommendations:
  - Add path sanitization and validation
  - Check directory permissions before operations
  - Return explicit errors instead of silent failures

### Home Directory Path Construction

**Issue:** Manual path construction using HOME environment variable
- Files: `packages/zed-extension/src/lib.rs` (lines 120-122), `packages/api/src/database.ts` (line 23)
- Risk:
  - Windows compatibility issue - uses HOME but fallback to USERPROFILE not consistent
  - Path traversal if environment variable is manipulated
- Current mitigation: Dual fallback (HOME or USERPROFILE)
- Recommendations:
  - Use os.homedir() consistently (as done in some files)
  - Validate resolved path is actually home directory
  - Add tests for Windows path handling

### Child Process Spawning Without Input Validation

**Issue:** Scripts spawned from user input without comprehensive validation
- Files: `packages/cli/src/script-runner.ts` (extensive spawning throughout)
- Risk:
  - Command injection if script names contain shell metacharacters
  - Arbitrary code execution if scripts can be tampered with
- Current mitigation: Basic project path validation only
- Recommendations:
  - Validate script names against whitelist from manifest
  - Use shell: false when spawning to prevent shell injection
  - Sandbox script execution environment

## Performance Bottlenecks

### Full Database Read on Every Command

**Issue:** Entire JSON database read and parsed for every slash command/API call
- Files:
  - `packages/zed-extension/src/lib.rs` (lines 70, 82, 94, 107 - repeated read_projax_database calls)
  - `packages/api/src/routes/workspaces.ts` - repeated database reads
- Problem: No caching; O(n) file I/O + JSON parsing for each request
- Current load: Fine for small databases (<1000 projects)
- Scaling issue:
  - 100 requests = 100 file reads
  - At 10k+ projects, each read becomes slow
  - No write batching - each modification rewrites entire file
- Improvement path:
  - Implement in-memory cache with TTL
  - Add database subscription system for change notifications
  - Consider SQLite or similar for write performance

### Test Filtering in Loops

**Issue:** Linear search for related records on every iteration
- Files: `packages/zed-extension/src/lib.rs` (lines 143-144)
  ```rust
  let test_count = db.tests.iter().filter(|t| t.project_id == project.id).count();
  let port_count = db.project_ports.iter().filter(|p| p.project_id == project.id).count();
  ```
- Problem: O(n*m) complexity when listing projects - scans all tests/ports for each project
- Impact: Slow with large test/port collections
- Improvement path:
  - Pre-index data by project_id during load
  - Use HashMap<project_id, Vec<Test>> instead of flat array

### JSON Parse Failures Silent

**Issue:** Database load failures silently revert to empty state
- Files: `packages/api/src/database.ts` (lines 34-43)
- Problem:
  - Corruption causes data loss without user notification
  - Users may not realize database was reset
  - No recovery mechanism
- Improvement path:
  - Create backup before fallback
  - Log error with location and suggestion to restore
  - Show user warning that data may be corrupted

## Fragile Areas

### Electron Main Process Single Instance Lock

**Issue:** Electron app relies on system-level lock that may not persist
- Files: `packages/desktop/src/main/main.ts` (lines 59-89)
- Why fragile:
  - If process crashes, lock might not be immediately released
  - Network paths or certain filesystems may not support locks
  - Test/CI environments may interfere with lock
- Safe modification:
  - Add lock timeout with automatic cleanup
  - Verify window focus actually occurs on second instance
  - Test coverage: Verify single instance behavior with mocked locks
- Test coverage: Likely missing tests for lock failure scenarios

### Data Migration Logic

**Issue:** Manual field-by-field migration in database load
- Files: `packages/api/src/database.ts` (lines 54-89)
- Why fragile:
  - Adding new fields requires manual migration code
  - Easy to miss fields when adding to schema
  - No version tracking - assumes all upgrades possible
- Safe modification:
  - Use versioned migration system
  - Test all migration paths explicitly
  - Add schema version to database file
- Test coverage: Limited to current structure; new fields must add migration test

### Module Path Resolution in Desktop App

**Issue:** Complex fallback chain for module path resolution
- Files: `packages/desktop/src/main/main.ts` (lines 29-48)
- Why fragile:
  - 4 different path candidates suggest uncertainty about build output
  - If build process changes, resolution breaks silently
  - No indication which path was actually found
- Safe modification:
  - Document which path is used in which scenario (dev vs. prod)
  - Log resolved path during startup
  - Add validation that resolved module actually exists and loads
- Test coverage: Should test each scenario (dev, packaged, etc.)

### VSCode Extension Webview Communication

**Issue:** Bidirectional message passing between extension and webview without protocol versioning
- Files: `packages/vscode-extension/src/extension.ts`, `packages/vscode-extension/src/providers/*`
- Why fragile:
  - Adding new message types could break old versions
  - No error handling for unexpected message formats
  - Silent failures if webview sends unrecognized messages
- Safe modification:
  - Implement message versioning/type checking
  - Add validation middleware for messages
  - Log unexpected message formats
- Test coverage: Limited webview integration testing

## Scaling Limits

### JSON File as Database

**Issue:** Single JSON file for all data without transactions
- Current capacity: Works fine for < 5,000 projects
- Limit breaks at:
  - ~10,000 projects (200KB+ JSON, slow parsing)
  - High write frequency (file I/O bottleneck)
  - Multiple processes writing simultaneously (no locking)
- Scaling path:
  1. Add in-memory cache with filesystem fallback (short term)
  2. Migrate to SQLite for transactional writes (medium term)
  3. Consider PostgreSQL for multi-user scenarios (long term)

### CLI TUI Rendering Performance

**Issue:** React component rendering for large project lists
- Files: `packages/cli/src/prxi.tsx` (2500+ lines)
- Current capacity: Renders well with < 500 projects
- Limit breaks at:
  - > 1000 projects causes noticeable UI lag
  - Terminal redraws entire screen on each change
  - No virtual scrolling
- Scaling path:
  - Implement virtual scrolling for project list
  - Add pagination instead of showing all projects
  - Optimize re-render logic (memo, useMemo)

### API Route Without Result Pagination

**Issue:** API endpoints return all matching results without pagination
- Files: `packages/api/src/routes/workspaces.ts` (lines 1-440)
- Current capacity: Works fine for < 1000 items
- Limit breaks at:
  - > 5000 items causes response timeouts
  - Client memory exhaustion rendering large lists
  - Network bandwidth wasted
- Scaling path:
  - Add limit/offset pagination to all list endpoints
  - Document pagination requirement in API docs
  - Set reasonable defaults (limit: 100, max: 1000)

## Dependencies at Risk

### Legacy @typescript-eslint Version

**Issue:** ESLint dependencies pinned to older majors
- Files: `package.json` (lines 61-62)
- Current: `@typescript-eslint/eslint-plugin: ^6.0.0` (released 2023)
- Risk:
  - Missing security fixes from newer versions
  - Incompatible with newer TypeScript (5.3.3 is current)
  - New language features not fully supported
- Migration plan:
  - Test upgrade to @typescript-eslint/eslint-plugin@7.x
  - Update parser to matching version
  - Run full test suite after upgrade

### Zed Extension API Stability

**Issue:** Zed extension API is relatively new and evolving
- Files: All code in `packages/zed-extension/`
- Risk:
  - API changes could break extension
  - Limited backward compatibility guarantees
  - Breaking changes between Zed versions
- Migration plan:
  - Monitor Zed changelog for breaking changes
  - Version lock Zed API when possible
  - Maintain compatibility matrix in docs

## Missing Critical Features

### No Distributed Lock for Concurrent Access

**Issue:** Multiple processes can read/write database simultaneously
- Blocks: Multi-user scenarios; distributed teams
- Problem:
  - Race conditions possible when multiple clients write
  - Last write wins (data loss)
  - No coordination between processes
- Workaround: Currently none - assume single primary writer
- Implementation path:
  - Add file-based locking (short term, unreliable)
  - Migrate to server-based database (long term)

### No Database Integrity Verification

**Issue:** No checksums or validation of data integrity
- Blocks: Recovery from corruption; audit trails
- Problem:
  - Corrupted JSON silently reverts to empty state
  - No way to detect partial writes or crashes during save
  - No audit trail of changes
- Workaround: Manual backup/restore
- Implementation path:
  - Add JSON schema validation on load
  - Add CRC32 checksums to backup format
  - Implement transaction log for changes

## Test Coverage Gaps

### Integration Testing for Extensions

**Issue:** VSCode and Zed extensions have limited integration tests
- What's not tested:
  - Extension lifecycle (activate → commands → deactivate)
  - Webview message passing with actual commands
  - Error handling when desktop app is offline
- Files: `packages/vscode-extension/src/` (551+ lines, minimal test coverage)
- Risk: Breaking changes not caught until user upgrade
- Priority: High (affects user experience)

### Database Corruption Scenarios

**Issue:** No tests for malformed/corrupted JSON recovery
- What's not tested:
  - Partial JSON (incomplete write)
  - Invalid UTF-8 in file
  - Permission denied on read
  - File deleted between reads
- Files: `packages/api/src/database.ts` - `migrateData()` function
- Risk: Real corruption scenarios have unknown behavior
- Priority: High (affects data safety)

### Child Process Cleanup

**Issue:** Script spawning doesn't test process cleanup thoroughly
- What's not tested:
  - Process killed while script running
  - Signal handling (SIGTERM vs SIGKILL)
  - Resource cleanup (file handles, memory)
- Files: `packages/cli/src/script-runner.ts` (1118 lines)
- Risk: Orphaned processes; resource leaks
- Priority: Medium (background processes)

### Path Traversal Security

**Issue:** No tests for malicious input in file operations
- What's not tested:
  - Project paths with `..` sequences
  - Symlinks pointing outside project
  - Case sensitivity on case-insensitive filesystems
- Files: `packages/core/src/` backup/database operations
- Risk: Unauthorized file access via crafted project paths
- Priority: Medium (depends on trust model)

---

*Concerns audit: 2026-01-22*
