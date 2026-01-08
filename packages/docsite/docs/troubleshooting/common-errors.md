# Troubleshooting: Common Errors

Common errors and their solutions.

## Error: "Project not found"

**Cause:** Project ID or name doesn't exist.

### Solution 1: List All Projects

```bash
prx list
```

Verify the project exists and note the correct ID or name.

### Solution 2: Use Project ID

Project IDs are more reliable than names:

```bash
prx 1 dev  # Use ID
# Instead of
prx "My Project" dev  # Name might have changed
```

### Solution 3: Check Project Path

```bash
# Verify path still exists
prx list  # Shows paths
ls -la $(prx pwd 1)  # Check if directory exists
```

## Error: "Path does not exist"

**Cause:** Project directory was moved or deleted.

### Solution 1: Update Project Path

Remove and re-add the project:

```bash
prx remove 1
prx add /new/path/to/project --name "My Project"
```

### Solution 2: Restore from Backup

If you have a database backup:

```bash
# Restore backup
cp ~/.projax/data.json.backup ~/.projax/data.json
```

## Error: "Database locked"

**Cause:** Multiple processes accessing database simultaneously.

### Solution 1: Close Other Instances

Close other projax instances (CLI, Desktop, TUI).

### Solution 2: Wait and Retry

Database uses file locking. Wait a moment and retry.

### Solution 3: Check for Stale Locks

```bash
# Check for lock files (if any)
ls -la ~/.projax/
```

## Error: "Port range exhausted"

**Cause:** All ports 38124-38133 are in use.

### Solution 1: Free Up Ports

```bash
# Find processes on ports
for port in {3001..3010}; do
  lsof -i :$port
done

# Kill processes if safe
```

### Solution 2: Restart System

As a last resort, restart to free all ports.

## Error: "Permission denied"

**Cause:** Insufficient permissions for file operations.

### Solution 1: Check Permissions

```bash
# Check .projax directory
ls -la ~/.projax/

# Fix if needed
chmod 755 ~/.projax
chmod 644 ~/.projax/data.json
```

### Solution 2: Run with Appropriate User

Ensure you're running as the correct user (not root unless necessary).

## Error: "Command not found: prx"

**Cause:** projax not installed or not in PATH.

### Solution 1: Reinstall

```bash
npm install -g projax
```

### Solution 2: Check PATH

```bash
# Check if npm global bin is in PATH
echo $PATH | grep npm

# Add if missing (add to ~/.zshrc or ~/.bashrc)
export PATH="$PATH:$(npm config get prefix)/bin"
```

## Error: "Module not found"

**Cause:** Dependencies not installed in project.

### Solution: Install Dependencies

```bash
cd $(prx pwd 1)
npm install  # or appropriate command
```

## General Troubleshooting Steps

1. **Check Error Message**: Read the full error for clues
2. **Verify Installation**: `prx --help` should work
3. **Check Database**: `ls -la ~/.projax/data.json`
4. **Check Logs**: View log files for details
5. **Restart**: Sometimes a simple restart helps

## Getting Help

If issues persist:

1. Check [Troubleshooting Guides](/docs/troubleshooting/port-conflicts) for specific issues
2. Review [Examples](/docs/examples/basic-workflow) for usage patterns
3. Check GitHub issues for known problems
4. Create a new issue with:
   - Error message
   - Steps to reproduce
   - System information
   - Log files (if applicable)

## Related Documentation

- [Port Conflicts](/docs/troubleshooting/port-conflicts) - Port issues
- [Database Issues](/docs/troubleshooting/database-issues) - Database problems
- [API Server Issues](/docs/troubleshooting/api-server-issues) - API problems

