#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const packages = [
  { name: 'projax-core', dir: 'packages/core', main: 'dist/index.js', types: 'dist/index.d.ts' },
  { name: 'projax-api', dir: 'packages/api', main: 'dist/index.js', types: 'dist/index.d.ts' },
  { name: 'projax', dir: 'packages/cli', main: 'dist/index.js', bin: 'dist/index.js' },
  { name: 'projax-desktop', dir: 'packages/desktop', main: 'dist/main.js' },
  { name: 'projax-vscode', dir: 'packages/vscode-extension', main: 'dist/extension.js' },
];

let errors = [];
let warnings = [];

function checkFileExists(filePath, packageName, fileType) {
  const fullPath = path.join(process.cwd(), filePath);
  if (!fs.existsSync(fullPath)) {
    errors.push(`❌ ${packageName}: Missing ${fileType} at ${filePath}`);
    return false;
  }
  return true;
}

function validatePackage(pkg) {
  const packageJsonPath = path.join(pkg.dir, 'package.json');
  
  if (!fs.existsSync(packageJsonPath)) {
    errors.push(`❌ ${pkg.name}: package.json not found`);
    return;
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

  // Check main entry point
  if (pkg.main) {
    const mainPath = packageJson.main || pkg.main;
    if (!checkFileExists(path.join(pkg.dir, mainPath), pkg.name, 'main entry')) {
      return; // Skip further checks if main is missing
    }
  }

  // Check types entry point
  if (pkg.types) {
    const typesPath = packageJson.types || pkg.types;
    checkFileExists(path.join(pkg.dir, typesPath), pkg.name, 'types entry');
  }

  // Check bin entry point
  if (pkg.bin) {
    const binPath = packageJson.bin?.prx || packageJson.bin || pkg.bin;
    if (typeof binPath === 'string') {
      checkFileExists(path.join(pkg.dir, binPath), pkg.name, 'bin entry');
    } else if (typeof binPath === 'object') {
      Object.values(binPath).forEach(bin => {
        checkFileExists(path.join(pkg.dir, bin), pkg.name, 'bin entry');
      });
    }
  }

  // Check dist directory exists
  const distPath = path.join(pkg.dir, 'dist');
  if (!fs.existsSync(distPath)) {
    warnings.push(`⚠️  ${pkg.name}: dist directory not found (may be intentional)`);
  }
}

console.log('🔍 Validating build artifacts...\n');

// Validate all packages
packages.forEach(validatePackage);

// Report results
if (warnings.length > 0) {
  console.log('\n⚠️  Warnings:');
  warnings.forEach(w => console.log(`  ${w}`));
}

if (errors.length > 0) {
  console.log('\n❌ Build validation failed:\n');
  errors.forEach(e => console.log(`  ${e}`));
  console.log('\nPlease ensure all packages are built before releasing.');
  process.exit(1);
}

console.log('\n✅ All build artifacts validated successfully!');
process.exit(0);

