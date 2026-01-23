---
phase: quick
plan: 001
type: execute
wave: 1
depends_on: []
files_modified:
  - packages/api/package.json
  - packages/api/src/routes/projects.ts
  - packages/desktop/src/renderer/components/ProjectDetails.tsx
  - packages/desktop/src/renderer/components/ProjectDetails.css
autonomous: true

must_haves:
  truths:
    - "GET /api/projects/:id/safety returns pubsafe scan results for a project"
    - "ProjectDetails shows a Security stat card with exposed file count"
    - "Stat card is green when 0 exposed, orange/red when > 0"
    - "Expandable Security section lists exposed items grouped by category"
  artifacts:
    - path: "packages/api/src/routes/projects.ts"
      provides: "GET /:id/safety endpoint using pubsafe"
      contains: "pubsafe"
    - path: "packages/desktop/src/renderer/components/ProjectDetails.tsx"
      provides: "Security stat card and expandable exposed items section"
      contains: "safety"
    - path: "packages/desktop/src/renderer/components/ProjectDetails.css"
      provides: "Styles for security stat card and exposed items list"
      contains: "security-section"
  key_links:
    - from: "packages/desktop/src/renderer/components/ProjectDetails.tsx"
      to: "/api/projects/:id/safety"
      via: "fetch in loadSafety function"
      pattern: "fetch.*safety"
    - from: "packages/api/src/routes/projects.ts"
      to: "pubsafe"
      via: "dynamic import"
      pattern: "await import.*pubsafe"
---

<objective>
Add pubsafe security scanning to the project details view. Install the pubsafe library in the API package, add a safety endpoint that scans a project directory for exposed sensitive files, and display the results as a stat card and expandable section in ProjectDetails.

Purpose: Give users immediate visibility into whether a project has exposed sensitive files (secrets, IDE configs, AI rules, etc.) that could leak on publish.
Output: Working safety scan endpoint + UI showing exposed file count and details.
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@packages/api/src/routes/projects.ts
@packages/api/package.json
@packages/api/tsconfig.json
@packages/desktop/src/renderer/components/ProjectDetails.tsx
@packages/desktop/src/renderer/components/ProjectDetails.css
</context>

<tasks>

<task type="auto">
  <name>Task 1: Install pubsafe and add safety API endpoint</name>
  <files>packages/api/package.json, packages/api/src/routes/projects.ts</files>
  <action>
1. Install pubsafe in the API package:
   `cd packages/api && pnpm add pubsafe@^1.0.1`

2. Add a new GET endpoint in `packages/api/src/routes/projects.ts` at `/:id(\d+)/safety`.

   The endpoint should:
   - Parse and validate the project ID (same pattern as other endpoints)
   - Look up the project from the database to get its path
   - Return 404 if project not found
   - Use dynamic import to load pubsafe (ESM-only package in CJS context):
     `const { pubsafe } = await import('pubsafe')`
   - Call `pubsafe(project.path)` to scan the project directory
   - From the result, extract `result.projects[0]` (pubsafe returns an array but we scan one directory)
   - Return a JSON response shaped as:
     ```json
     {
       "safe": summary.safe,
       "exposed": summary.exposed,
       "missing": summary.missing,
       "items": exposedItems,
       "channels": activeChannels
     }
     ```
     Where `exposedItems` is the array of exposed entries (each has: pattern, files, category, description).
   - If pubsafe returns no projects (empty result), return `{ safe: 0, exposed: 0, missing: 0, items: [], channels: [] }`
   - Wrap in try/catch, return 500 on error with message

   Place this route AFTER the existing `/:id(\d+)/git-branch` route and BEFORE `export default router`.

   IMPORTANT: The handler function must be `async` since it uses `await import(...)` and `await pubsafe(...)`.
  </action>
  <verify>
   Run `cd /Users/jose/Developer/projax/packages/api && pnpm build` - should compile without errors.
   Verify pubsafe is in package.json dependencies.
  </verify>
  <done>
   GET /api/projects/:id/safety endpoint exists, compiles cleanly, uses dynamic import for pubsafe, returns scan results.
  </done>
</task>

<task type="auto">
  <name>Task 2: Add security stat card and expandable section to ProjectDetails</name>
  <files>packages/desktop/src/renderer/components/ProjectDetails.tsx, packages/desktop/src/renderer/components/ProjectDetails.css</files>
  <action>
1. In `ProjectDetails.tsx`:

   a. Add state variables:
      ```tsx
      const [safety, setSafety] = useState<any>(null);
      const [loadingSafety, setLoadingSafety] = useState(false);
      const [securityExpanded, setSecurityExpanded] = useState(false);
      ```

   b. Add a `loadSafety` function (same pattern as `loadLatestTestResult`):
      ```tsx
      const loadSafety = async () => {
        try {
          setLoadingSafety(true);
          const apiBaseUrl = await getApiBaseUrl();
          if (!apiBaseUrl) return;
          const response = await fetch(`${apiBaseUrl}/projects/${project.id}/safety`);
          if (response.ok) {
            const data = await response.json();
            setSafety(data);
          }
        } catch (error) {
          console.error('Error loading safety data:', error);
          setSafety(null);
        } finally {
          setLoadingSafety(false);
        }
      };
      ```

   c. Call `loadSafety()` in the existing `useEffect` that runs on `[project]` (alongside `loadScripts()`, `loadPorts()`, etc.). Do NOT add it to the 5-second interval since scans are expensive.

   d. Add a third stat card inside the `.project-stats` div, after the Scripts stat card:
      ```tsx
      <div className={`stat-card ${safety ? (safety.exposed > 0 ? 'stat-card-danger' : 'stat-card-safe') : ''}`}>
        <div className="stat-value">
          {loadingSafety ? '...' : (safety ? safety.exposed : '-')}
        </div>
        <div className="stat-label">Exposed</div>
      </div>
      ```

   e. Add a "Security" section AFTER the Tags section and BEFORE the URLs section (before `{allUrls.length > 0 && ...}`). Structure:
      ```tsx
      {safety && (
        <div className="security-section">
          <div className="section-header">
            <h3>Security</h3>
            <button
              className="btn btn-secondary btn-small"
              onClick={() => setSecurityExpanded(!securityExpanded)}
            >
              {securityExpanded ? 'Collapse' : 'Expand'}
            </button>
          </div>
          <div className="security-summary">
            <span className="security-badge security-safe">{safety.safe} safe</span>
            <span className={`security-badge ${safety.exposed > 0 ? 'security-exposed' : 'security-safe'}`}>
              {safety.exposed} exposed
            </span>
            <span className="security-badge security-missing">{safety.missing} missing</span>
            {safety.channels && safety.channels.length > 0 && (
              <span className="security-channels">
                Channels: {safety.channels.join(', ')}
              </span>
            )}
          </div>
          {securityExpanded && safety.items && safety.items.length > 0 && (
            <div className="security-items">
              {safety.items.map((item: any, index: number) => (
                <div key={index} className="security-item">
                  <div className="security-item-header">
                    <span className={`security-category security-category-${item.category}`}>
                      {item.category}
                    </span>
                    <span className="security-pattern">{item.pattern}</span>
                  </div>
                  <div className="security-item-description">{item.description}</div>
                  <div className="security-item-files">
                    {item.files.map((file: string, fi: number) => (
                      <span key={fi} className="security-file">{file}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          {securityExpanded && (!safety.items || safety.items.length === 0) && (
            <div className="security-clean">No exposed files detected.</div>
          )}
        </div>
      )}
      ```

2. In `ProjectDetails.css`, add styles at the end of the file:

   ```css
   /* Security stat card variants */
   .stat-card-danger .stat-value {
     color: #f85149;
   }

   .stat-card-safe .stat-value {
     color: var(--accent-green);
   }

   /* Security Section */
   .security-section {
     background: var(--bg-secondary);
     padding: 1.25rem;
     border-radius: 4px;
     border: 1px solid var(--border-color);
     margin-bottom: 1.5rem;
   }

   .security-summary {
     display: flex;
     flex-wrap: wrap;
     gap: 0.5rem;
     align-items: center;
   }

   .security-badge {
     display: inline-flex;
     align-items: center;
     padding: 0.25rem 0.625rem;
     border-radius: 3px;
     font-size: 11px;
     font-weight: 600;
     font-family: 'SF Mono', 'Monaco', monospace;
     letter-spacing: 0.3px;
   }

   .security-safe {
     background: rgba(63, 185, 80, 0.1);
     border: 1px solid var(--accent-green);
     color: var(--accent-green);
   }

   .security-exposed {
     background: rgba(248, 81, 73, 0.1);
     border: 1px solid #f85149;
     color: #f85149;
   }

   .security-missing {
     background: rgba(139, 148, 158, 0.1);
     border: 1px solid var(--text-tertiary);
     color: var(--text-tertiary);
   }

   .security-channels {
     font-size: 11px;
     color: var(--text-secondary);
     font-family: 'SF Mono', 'Monaco', monospace;
     margin-left: 0.5rem;
   }

   .security-items {
     display: flex;
     flex-direction: column;
     gap: 0.5rem;
     margin-top: 1rem;
   }

   .security-item {
     padding: 0.75rem;
     background: var(--bg-tertiary);
     border: 1px solid var(--border-color);
     border-radius: 4px;
     border-left: 3px solid #f85149;
   }

   .security-item-header {
     display: flex;
     align-items: center;
     gap: 0.75rem;
     margin-bottom: 0.375rem;
   }

   .security-category {
     padding: 0.125rem 0.5rem;
     border-radius: 3px;
     font-size: 10px;
     font-weight: 600;
     text-transform: uppercase;
     letter-spacing: 0.5px;
     font-family: 'SF Mono', 'Monaco', monospace;
   }

   .security-category-secrets {
     background: rgba(248, 81, 73, 0.15);
     color: #f85149;
   }

   .security-category-ide {
     background: rgba(125, 118, 252, 0.15);
     color: var(--accent-purple);
   }

   .security-category-ai {
     background: rgba(57, 197, 207, 0.15);
     color: var(--accent-cyan);
   }

   .security-category-system {
     background: rgba(139, 148, 158, 0.15);
     color: var(--text-secondary);
   }

   .security-category-deps {
     background: rgba(210, 153, 34, 0.15);
     color: #d29922;
   }

   .security-pattern {
     font-family: 'SF Mono', 'Monaco', monospace;
     font-size: 12px;
     color: var(--text-primary);
     font-weight: 500;
   }

   .security-item-description {
     font-size: 11px;
     color: var(--text-secondary);
     margin-bottom: 0.5rem;
     line-height: 1.4;
   }

   .security-item-files {
     display: flex;
     flex-wrap: wrap;
     gap: 0.375rem;
   }

   .security-file {
     font-family: 'SF Mono', 'Monaco', monospace;
     font-size: 10px;
     color: var(--text-tertiary);
     background: var(--bg-hover);
     padding: 0.125rem 0.5rem;
     border-radius: 2px;
     border: 1px solid var(--border-color);
   }

   .security-clean {
     margin-top: 1rem;
     padding: 1.5rem;
     text-align: center;
     color: var(--accent-green);
     font-size: 12px;
     font-weight: 500;
   }
   ```
  </action>
  <verify>
   Run `cd /Users/jose/Developer/projax/packages/desktop && npx tsc --noEmit` - should compile without type errors.
   Visually: The stat cards row should show 3 items (Ports, Scripts, Exposed). The Security section should appear below Tags when safety data loads.
  </verify>
  <done>
   - Third stat card shows exposed count with color coding (green=0, red=>0)
   - Security section shows summary badges (safe/exposed/missing counts)
   - Expand button reveals per-item details with category, pattern, matched files
   - Collapse button hides the details list
  </done>
</task>

</tasks>

<verification>
1. `cd /Users/jose/Developer/projax/packages/api && pnpm build` compiles cleanly
2. `cd /Users/jose/Developer/projax/packages/desktop && npx tsc --noEmit` compiles cleanly
3. With the app running, visiting a project details page shows the Exposed stat card
4. The Security section appears with correct data after the API responds
</verification>

<success_criteria>
- pubsafe installed in packages/api/package.json
- GET /api/projects/:id/safety endpoint works and returns pubsafe results
- Stat card shows exposed count with green (0) or red (>0) coloring
- Expandable Security section shows category-grouped exposed items
- No TypeScript compilation errors in either package
</success_criteria>

<output>
After completion, create `.planning/quick/001-add-pubsafe-stats-to-project-details/001-SUMMARY.md`
</output>
