# Workspace Dependencies Notes

## projax-core Dependency

The `projax-core` dependency in `package.json` is a **workspace alias**, not an npm scoped package.

- **Dependency**: `"projax-core": "workspace:*"`
- **Resolved by**: pnpm to `packages/core/`
- **NOT**: An npm scoped package like `@projax/core`

pnpm automatically resolves `workspace:*` dependencies to local packages based on matching package names in the workspace.







