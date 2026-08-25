import json

with open('packages/cli/package.json', 'r') as f:
    pkg = json.load(f)

del pkg['dependencies']['projax-octopus']
pkg['devDependencies']['projax-octopus'] = 'workspace:*'

pkg['scripts']['copy:octopus'] = 'mkdir -p dist/octopus && cp -r ../octopus/dist/* dist/octopus/ && cp ../octopus/package.json dist/octopus/'
pkg['scripts']['build:all'] = pkg['scripts']['build:all'].replace('pnpm run copy:core', 'pnpm run copy:core && pnpm run copy:octopus')

with open('packages/cli/package.json', 'w') as f:
    json.dump(pkg, f, indent=2)

