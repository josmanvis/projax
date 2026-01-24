# GitHub Actions Setup Guide

This document explains how to configure GitHub Actions for the Projax repository.

## Required Secrets

You need to configure these secrets in your GitHub repository settings:

### 1. NPM_TOKEN (Required for publishing)

**Purpose:** Allows automated publishing to npm when a new version tag is pushed.

**How to create:**
1. Go to https://www.npmjs.com/
2. Log in to your npm account
3. Click your profile icon → "Access Tokens"
4. Click "Generate New Token" → "Classic Token"
5. Select "Automation" type
6. Copy the token

**How to add to GitHub:**
1. Go to your repository: https://github.com/josmanvis/projax
2. Click "Settings" → "Secrets and variables" → "Actions"
3. Click "New repository secret"
4. Name: `NPM_TOKEN`
5. Value: Paste the token from npm
6. Click "Add secret"

### 2. CLAUDE_CODE_OAUTH_TOKEN (Optional - for Claude Code integration)

**Purpose:** Enables Claude Code to respond to @claude mentions in issues and PRs, and perform automatic code reviews.

**How to create:**
1. Follow the instructions at: https://github.com/anthropics/claude-code-action
2. Generate an OAuth token for Claude Code

**How to add to GitHub:**
1. Go to Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Name: `CLAUDE_CODE_OAUTH_TOKEN`
4. Value: Paste your Claude Code OAuth token
5. Click "Add secret"

## Required Repository Settings

### 1. GitHub Pages

**Purpose:** Hosts the documentation website at https://josmanvis.github.io/projax/

**How to configure:**
1. Go to Settings → Pages
2. Under "Source", select "Deploy from a branch"
3. Under "Branch", select `gh-pages` and `/ (root)`
4. Click "Save"

**Custom Domain (Optional):**
If you want to use projax.dev:
1. In the Pages settings, add `projax.dev` under "Custom domain"
2. Update your DNS records to point to GitHub Pages:
   - Add a CNAME record: `projax.dev` → `josmanvis.github.io`
3. Check "Enforce HTTPS"

### 2. Actions Permissions

**Purpose:** Allows workflows to create releases, deploy to Pages, etc.

**How to configure:**
1. Go to Settings → Actions → General
2. Under "Workflow permissions", select:
   - ✅ "Read and write permissions"
   - ✅ "Allow GitHub Actions to create and approve pull requests"
3. Click "Save"

### 3. Branch Protection (Recommended)

**Purpose:** Ensures CI passes before merging to main.

**How to configure:**
1. Go to Settings → Branches
2. Click "Add rule" for `main` branch
3. Enable:
   - ✅ Require a pull request before merging
   - ✅ Require status checks to pass before merging
   - Select: `Test`, `Validate`, `Build` (from CI workflow)
4. Click "Create"

## Available Workflows

### 1. CI (`ci.yml`)
- **Triggers:** Push to main/develop, Pull requests
- **Purpose:** Runs tests, type checking, linting, and builds
- **Jobs:**
  - Test (Node 18, 20, 22)
  - Validate (typecheck, lint)
  - Build (verify all packages build successfully)
- **Secrets:** None required
- **Outputs:** Code coverage reports to Codecov

### 2. Deploy Documentation (`deploy-docs.yml`)
- **Triggers:** Push to main (when docsite changes), Manual dispatch
- **Purpose:** Automatically deploys documentation to GitHub Pages
- **Jobs:**
  - Build and deploy docsite to gh-pages branch
- **Secrets:** None required (uses GITHUB_TOKEN automatically)
- **Prerequisites:**
  - GitHub Pages must be configured (see above)
  - Workflow must have write permissions

### 3. Publish to npm (`publish.yml`)
- **Triggers:** Push of version tags (v*.*.*), Manual dispatch
- **Purpose:** Automatically publishes new versions to npm
- **Jobs:**
  - Run tests
  - Build packages
  - Publish to npm
  - Create GitHub Release
- **Secrets:**
  - ✅ `NPM_TOKEN` (required)
- **Prerequisites:** Must push a version tag (e.g., `git push origin v3.3.69`)

### 4. Claude Code (`claude.yml`)
- **Triggers:** @claude mentions in issues/PRs/comments
- **Purpose:** Allows Claude to respond to questions and perform tasks
- **Jobs:**
  - Run Claude Code on mentioned issues/PRs
- **Secrets:**
  - ✅ `CLAUDE_CODE_OAUTH_TOKEN` (required)

### 5. Claude Code Review (`claude-code-review.yml`)
- **Triggers:** Pull request opened/updated
- **Purpose:** Automatic code review by Claude on every PR
- **Jobs:**
  - Analyze PR and provide code review feedback
- **Secrets:**
  - ✅ `CLAUDE_CODE_OAUTH_TOKEN` (required)

## Testing the Setup

### 1. Test CI Workflow
```bash
# Push any change to main
git push origin main
# Check: https://github.com/josmanvis/projax/actions
```

### 2. Test Documentation Deployment
```bash
# Make a change to docsite and push
git push origin main
# Check: https://josmanvis.github.io/projax/
```

### 3. Test npm Publishing
```bash
# Create and push a version tag
git tag v3.3.69
git push origin v3.3.69
# Check: https://www.npmjs.com/package/projax
```

### 4. Test Claude Integration
```bash
# Create an issue with @claude in the body
# Or comment on a PR with @claude
# Check: https://github.com/josmanvis/projax/issues
```

## Troubleshooting

### Docs deployment fails with permission error
- Check that Actions have "Read and write permissions" in Settings → Actions
- Verify GitHub Pages is configured for the gh-pages branch

### npm publish fails with authentication error
- Verify NPM_TOKEN secret is set correctly
- Check that the token has "Automation" permissions
- Ensure the token hasn't expired

### Claude workflows don't run
- Verify CLAUDE_CODE_OAUTH_TOKEN is set
- Check that the workflow has the required permissions (id-token: write)

### CI fails on dependency installation
- Check that pnpm version in workflows matches package.json
- Verify package-lock or pnpm-lock is committed

## Manual Workflow Dispatch

All workflows support manual triggering:

1. Go to Actions tab
2. Select the workflow you want to run
3. Click "Run workflow"
4. Select the branch
5. Click "Run workflow" button

## Monitoring

- **Actions Dashboard:** https://github.com/josmanvis/projax/actions
- **npm Package:** https://www.npmjs.com/package/projax
- **Documentation:** https://josmanvis.github.io/projax/
- **Releases:** https://github.com/josmanvis/projax/releases
