# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- npm package detection in Terminal UI - automatically shows if project is published on npm
- Virtual scrolling for scripts and ports lists in TUI (no more arbitrary 5-item limits)
- Git branch display with color-coded status (green for main/master, blue for feature branches)

### Fixed
- Script and port lists no longer prematurely truncated to 5 items
- Improved prxi.tsx imports and module resolution

## [3.3.58] - 2025-01-11

### Fixed
- Fix projax-core module resolution for npm installs
- Remove workspace:* dependencies that caused issues with npm

## [3.3.56] - 2025-01-10

### Changed
- Code quality improvements
- Test coverage improvements
- Documentation updates

## [3.3.42] - 2024-12-XX

### Added
- Drag and drop support for adding projects in Desktop app
- Workspace management features

### Fixed
- Console error fixes in Desktop app
- TypeScript configuration improvements

## [3.3.40] - 2024-12-XX

### Added
- Workspace feature for organizing projects into groups
- Enhanced project scanning

## [3.3.0] - 2024-11-XX

### Added
- VS Code/Cursor/Windsurf extension with sidebar panel
- Interactive Terminal UI (`prx i`)
- Port conflict detection and auto-remediation
- Background script execution with logging
- Multi-project type support (Node.js, Python, Rust, Go, Makefile)

### Changed
- Migrated from SQLite to JSON database for better portability
- Improved CLI with intelligent script selection

## [2.0.0] - 2024-XX-XX

### Added
- Desktop app (Electron-based)
- REST API server
- Port scanning and indexing

### Changed
- Complete rewrite with TypeScript

## [1.0.0] - 2024-XX-XX

### Added
- Initial release
- Basic project tracking
- Test file detection (Jest, Vitest, Mocha)
- CLI commands for project management
