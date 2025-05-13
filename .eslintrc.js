module.exports = {
  root: true,
  env: {
    node: true,
    es2022: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended', // Integrates Prettier with ESLint
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    // TypeScript-specific rules
    '@typescript-eslint/no-explicit-any': 'warn', // Warn on 'any' usage
    '@typescript-eslint/explicit-function-return-type': 'warn', // Enforce return types
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }], // Warn on unused variables, ignore those starting with '_'

    // General JavaScript rules
    'no-console': 'warn', // Warn on console usage
    'no-unused-vars': 'off', // Disable base rule (handled by TypeScript rule)
    'no-var': 'error', // Disallow 'var' declarations
    'prefer-const': 'error', // Enforce 'const' where possible
    eqeqeq: ['error', 'always'], // Enforce strict equality
  },
};
