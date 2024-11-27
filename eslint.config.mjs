import eslint from '@eslint/js';
import importPlugin from 'eslint-plugin-import';
import unusedImports from 'eslint-plugin-unused-imports';
import tseslint from 'typescript-eslint';

// lol
export default tseslint.config(eslint.configs.recommended, tseslint.configs.recommended, {
  plugins: {
    import: importPlugin,
    'unused-imports': unusedImports,
  },
  rules: {
    'no-console': 'error',
    'unused-imports/no-unused-imports': 'warn',
    'import/order': [
      'warn',
      {
        groups: [['builtin', 'external'], 'internal', ['parent', 'sibling'], 'index'],
        'newlines-between': 'always',
        alphabetize: {
          order: 'asc',
          caseInsensitive: true,
        },
      },
    ],
  },
});
