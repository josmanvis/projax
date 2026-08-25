import re
with open('scripts/release.js', 'r') as f:
    content = f.read()
content = content.replace("exec('cd packages/cli && pnpm publish --access public', 'Publish to npm');", "exec('cd packages/octopus && pnpm publish --access public || true', 'Publish octopus to npm');\n    exec('cd packages/cli && pnpm publish --access public', 'Publish cli to npm');")
with open('scripts/release.js', 'w') as f:
    f.write(content)
