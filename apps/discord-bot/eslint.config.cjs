const globals = require('globals');
const js = require('@eslint/js');

module.exports = [
  // Start with ESLint's recommended base rules
  js.configs.recommended,

  {
    // These settings apply to all JavaScript files
    languageOptions: {
      ecmaVersion: 2022, // Use modern JavaScript
      sourceType: 'commonjs', // Bot uses require/module.exports
      globals: {
        ...globals.node, // Add all Node.js global variables
      },
    },
    rules: {
      // Customize your rules here
      semi: ['error', 'always'],
      quotes: ['error', 'single'],
      'no-unused-vars': ['warn', { args: 'none' }], // Warn about unused variables instead of erroring
    },
  },
];
