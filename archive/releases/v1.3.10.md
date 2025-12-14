# Release Notes - v1.3.10

Published to npm: `projax@1.3.10`

## 🔒 Security & Link Handling Fix

### Critical Security Improvement

**Issue**: External links in the Electron app weren't opening correctly in external browsers due to Electron's security model and context isolation.

**Solution**: Implemented secure IPC-based external link handling following Electron best practices:

1. ✅ **IPC Communication** - Added secure `open-external-url` IPC channel
2. ✅ **Protocol Validation** - Only `http:` and `https:` URLs are allowed
3. ✅ **Shell Integration** - Uses `shell.openExternal()` for secure external browser opening
4. ✅ **Window Handler** - Added `setWindowOpenHandler` to intercept `target="_blank"` links
5. ✅ **Preload Bridge** - Exposed `openExternal` API safely via contextBridge

### Implementation Details

#### Main Process (main.ts)
- Added `shell` import from Electron
- Implemented `open-external-url` IPC handler with URL validation
- Added `setWindowOpenHandler` to intercept new window requests
- Security: Only http/https protocols allowed, all others blocked and logged

#### Preload Script (preload.ts)
- Exposed `openExternal` function via contextBridge
- Added TypeScript types for the new API

#### Renderer (ProjectUrls.tsx)
- URLs now use `<a>` tags with `target="_blank"` for semantic HTML
- Click handler prevents default and calls `window.electronAPI.openExternal()`
- Maintains backward compatibility with existing "Open" button

### Security Features

- ✅ **Protocol Whitelist**: Only http: and https: allowed
- ✅ **URL Validation**: Malformed URLs caught and logged
- ✅ **Blocked Protocols**: file:, javascript:, data: etc. are blocked
- ✅ **Console Warning**: Non-http/https attempts logged for debugging

### User Impact

**Before**: Clicking on detected URLs (like http://localhost:3000) would:
- Try to navigate within the Electron app
- Fail to open external browser
- Create security concerns

**After**: Clicking on URLs now:
- ✅ Opens in user's default browser
- ✅ Handles `target="_blank"` correctly
- ✅ Validates URLs for security
- ✅ Works cross-platform (macOS, Windows, Linux)

### Breaking Changes

**None** - All changes are backward compatible

### What's Fixed

- ✅ Detected URLs now clickable and open in external browser
- ✅ "Open" button uses configured browser (from settings)
- ✅ URL links use `shell.openExternal()` for default browser
- ✅ Security validation prevents malicious URL schemes

### Testing

Tested with:
- localhost URLs (http://localhost:3000)
- Network URLs (http://192.168.1.1:8080)
- Multiple running dev servers
- Cross-platform compatibility

### Installation

```bash
npm install -g projax@latest
# or
npm update -g projax
```

### Version History

- **v1.3.10** (Current) - Secure external link handling
- **v1.3.9** - Process management fixes, new CLI commands
- **v1.3.8** - Previous stable version

---

**Published by**: jose24  
**Date**: November 19, 2025  
**Version**: 1.3.10  
**Package Size**: 550.2 kB (2.6 MB unpacked)  
**Files**: 98 files

