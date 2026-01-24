# GitHub Actions Setup Guide

This document explains how to configure GitHub Actions for the Projax repository.

## ⚡ Quick Start Checklist

Complete these steps to enable all workflows:

- [ ] **Step 1:** Configure Actions Permissions (Settings → Actions → General)
  - Enable "Read and write permissions"
  - Enable "Allow GitHub Actions to create and approve pull requests"

- [ ] **Step 2:** Set up GitHub Pages (Settings → Pages)
  - Source: "Deploy from a branch"
  - Branch: `gh-pages` / (root)

- [ ] **Step 3:** Add NPM_TOKEN secret (Settings → Secrets → Actions)
  - Get token from https://www.npmjs.com/ (Profile → Access Tokens → Automation)
  - Add as repository secret named `NPM_TOKEN`

- [ ] **Step 4:** (Optional) Add CLAUDE_CODE_OAUTH_TOKEN for Claude integration

Once complete, your workflows will:
- ✅ Auto-deploy docs on push to main
- ✅ Auto-publish to npm on version tag push
- ✅ Run CI tests on all PRs and pushes

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

### Common Issues After Setup

#### Docs deployment fails with "Permission denied"
**Symptoms:** `deploy-docs.yml` fails when pushing to gh-pages branch

**Solutions:**
1. Enable write permissions: Settings → Actions → General → Workflow permissions → "Read and write permissions"
2. Ensure GitHub Pages is enabled: Settings → Pages → Source: gh-pages branch
3. Check the GITHUB_TOKEN has access to push to gh-pages

#### npm publish fails with 401 Unauthorized
**Symptoms:** `publish.yml` fails at the "Publish to npm" step

**Solutions:**
1. Verify NPM_TOKEN secret exists: Settings → Secrets → Actions
2. Check token type is "Automation" (not "Read only" or "Publish")
3. Regenerate token if expired: https://www.npmjs.com/ → Profile → Access Tokens
4. Ensure you're a maintainer of the npm package

#### Release creation fails
**Symptoms:** `publish.yml` succeeds but no GitHub release is created

**Solutions:**
1. Check Actions have write permissions for contents
2. Verify the tag was pushed (not just created locally)
3. Check workflow logs for specific error messages

#### GitHub Pages shows 404
**Symptoms:** Workflow succeeds but site shows 404

**Solutions:**
1. Wait 2-5 minutes for GitHub Pages to deploy
2. Check Settings → Pages shows "Your site is live at..."
3. Verify gh-pages branch exists and has content
4. Check docusaurus.config.ts has correct organizationName and projectName

#### VS Code Extension not included in release
**Symptoms:** Release created but no .vsix file attached

**Solutions:**
1. Check the package script exists in vscode-extension package.json
2. Verify release/ directory is created during build
3. Check workflow logs for packaging errors

### Debug Mode

To enable detailed logging in workflows, add this to your repository secrets:

```
Name: ACTIONS_STEP_DEBUG
Value: true
```

This will show all debug output in workflow runs.

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

---

## Quick Reference Card

### Required Repository Settings

| Setting | Location | Value |
|---------|----------|-------|
| Workflow permissions | Settings → Actions → General | Read and write permissions |
| PR creation | Settings → Actions → General | Allow GitHub Actions to create PRs |
| Pages source | Settings → Pages | Deploy from gh-pages branch |
| NPM_TOKEN | Settings → Secrets → Actions | npm automation token |

### Workflow Triggers

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| CI | Push to main/develop, PRs | Run tests, lint, build |
| Deploy Docs | Push to main (docsite changes) | Update GitHub Pages |
| Publish | Push version tag (v*.*.*) | Publish to npm + create release |
| Claude Code | @claude mentions | Interactive Claude assistance |
| Claude Review | PR opened/updated | Automated code review |

### Manual Workflow Triggers

All workflows can be manually triggered from the Actions tab:
1. Go to https://github.com/josmanvis/projax/actions
2. Select workflow from left sidebar
3. Click "Run workflow" button
4. Select branch and click "Run workflow"

### Release Process

```bash
# Standard release process
pnpm run version:patch    # Bump version
git add -A
git commit -m "Release v3.3.X"
git tag v3.3.X
git push origin main
git push origin v3.3.X    # This triggers publish workflow
```

The publish workflow will automatically:
1. Run all tests
2. Build all packages
3. Publish to npm
4. Create GitHub release with VS Code extension attached
