module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    project: [
      './tsconfig.json',
      './packages/*/tsconfig.json',
      './packages/*/tsconfig.eslint.json',
    ],
  },
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  env: {
    node: true,
    es2020: true,
  },
  rules: {
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-non-null-assertion': 'warn',
  },
  ignorePatterns: [
    'dist/',
    'node_modules/',
    'coverage/',
    '*.config.js',
    '*.config.ts',
    '**/*.d.ts',
    'packages/desktop/src/main/**',
    'packages/docsite/**',
    'build/',
    'out/',
  ],
};

