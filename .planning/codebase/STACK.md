# Technology Stack

**Analysis Date:** 2026-01-22

## Languages

**Primary:**
- TypeScript 5.3.3 - Used across all packages (core, API, CLI, desktop, extensions)
- JavaScript/JSX - React components, build configuration

**Secondary:**
- TSX - React/TypeScript components (desktop renderer, VS Code extension)

## Runtime

**Environment:**
- Node.js >= 18.0.0 (required by workspace)

**Package Manager:**
- pnpm 10.25.0 (monorepo workspace manager)
- Lockfile: pnpm-lock.yaml present

## Frameworks

**Core:**
- React 17.0.2 (CLI terminal UI via Ink)
- React 18.2.0 (desktop app and VS Code extension webviews)
- Express 4.18.2 (REST API server)
- Electron 28.0.0 (desktop application runtime)

**Build/Dev:**
- Vite 5.0.8 (desktop renderer and extension webview bundler)
- TypeScript Compiler (tsc) - primary build tool
- tsx 4.20.6 (TypeScript execution)
- esbuild 0.19+ (extension bundler)
- Turbo 2.6.1 (monorepo task orchestration)

**Testing:**
- Jest 29.7.0 (test framework)
- ts-jest 29.1.1 (TypeScript support in Jest)
- Supertest 6.3.3 (HTTP endpoint testing)

## Key Dependencies

**Critical:**
- `ink` 3.2.0 - Terminal UI rendering (CLI)
- `commander` 11.1.0 - CLI argument parsing
- `cors` 2.8.5 - CORS middleware (API and CLI)
- `chokidar` 3.6.0 - File system watching
- `inquirer` 9.2.12 - Interactive CLI prompts
- `tail` 2.2.6 - File tail utility (CLI and desktop)
- `react-rnd` 10.5.2 - Draggable/resizable components (desktop)
- `axios` 1.6.2 - HTTP client (VS Code extension)
- `electron-builder` 24.9.1 - Electron app packaging

**Infrastructure:**
- `better-sqlite3` 9.2.2 - Optional dependency for future SQLite integration
- Node.js built-in: path, os, fs, net (file I/O and system operations)

## Configuration

**Environment:**
- Data directory: `~/.projax/`
  - `data.json` - Flat file JSON database
  - `api-port.txt` - Dynamic API port allocation

**Build:**
- `tsconfig.json` - Root TypeScript configuration
  - Target: ES2022
  - Module: commonjs
  - Strict mode enabled
- `.eslintrc.js` - ESLint configuration with TypeScript support
- `.editorconfig` - Editor formatting rules
- Workspace-specific configs:
  - `packages/desktop/tsconfig.main.json` - Electron main process
  - `packages/desktop/tsconfig.preload.json` - Electron preload
  - Package-specific `jest.config.js` (inferred)

## Platform Requirements

**Development:**
- Node.js 18+
- pnpm 10.25.0
- Git
- For desktop: Xcode/build tools (macOS)

**Production:**
- macOS, Windows, Linux (via Electron)
- CLI: Node.js 18+ installed on system
- VS Code/Cursor/Windsurf (1.85.0+) for extensions

## Deployment

**CLI Package:**
- Published as npm package `projax`
- Binary: `prx` command
- Installation: `npm install -g projax` or `pnpm link --global packages/cli`

**Desktop Application:**
- Built with electron-builder
- Output: `packages/desktop/out/` directory
- Includes bundled core library and API server

**VS Code Extension:**
- Published to VS Code marketplace
- Built with esbuild + Vite
- Extension id: projax
- Bundled output: `packages/vscode-extension/dist/extension.js`

**Web Documentation:**
- Built with Docusaurus 3.1.0
- Output: `packages/docsite/build/`
- Hosted separately (deployment script: `pnpm run release:docsite`)

---

*Stack analysis: 2026-01-22*
