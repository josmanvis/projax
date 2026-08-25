import re
with open('.github/workflows/publish.yml', 'r') as f:
    content = f.read()
content = content.replace('cd packages/cli\n          pnpm publish --access public --no-git-checks', 'cd packages/octopus\n          pnpm publish --access public --no-git-checks || true\n          cd ../cli\n          pnpm publish --access public --no-git-checks')
with open('.github/workflows/publish.yml', 'w') as f:
    f.write(content)
