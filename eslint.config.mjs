import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import importPlugin from 'eslint-plugin-import';

export default tseslint.config(eslint.configs.recommended, tseslint.configs.recommended, {
  plugins: {
    import: importPlugin,
  },
  rules: {
    'no-console': 'error',
    'import/order': [
      'warn',
      {
        groups: [
          ['builtin', 'external'], // Node.js and external dependencies
          'internal', // Internal modules
          ['parent', 'sibling'], // Parent and sibling files
          'index', // Index files
        ],
        'newlines-between': 'always', // Enforce blank lines between groups
        alphabetize: {
          order: 'asc',
          caseInsensitive: true,
        }, // Sort imports alphabetically
      },
    ],
  },
});
