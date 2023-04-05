// @ts-check

/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  env: {
    es6: true,
    node: true,
  },
  plugins: ['import'],
  extends: ['plugin:import/errors', 'plugin:import/warnings', 'eslint:recommended'],
  rules: {
    'import/first': 'error',
    'import/order': 'error',
    'import/named': 'off',
    'import/namespace': 'off',
    'import/default': 'off',
    'import/no-named-as-default-member': 'off',
    'import/no-named-as-default': 'error',
    'import/no-cycle': 'error',
    'import/no-unused-modules': 'error',
    'import/no-deprecated': 'error',
    'no-duplicate-imports': 'off',
    'prettier/prettier': 'error',
  },
  overrides: [
    {
      files: ['*.ts'],
      parser: '@typescript-eslint/parser',
      extends: [
        'plugin:@typescript-eslint/eslint-recommended',
        'plugin:prettier/recommended',
        'plugin:@typescript-eslint/recommended',
        'prettier',
        'plugin:import/typescript',
      ],
      plugins: ['@typescript-eslint', 'import'],
      rules: {
        '@typescript-eslint/explicit-module-boundary-types': 'off',
        '@typescript-eslint/no-duplicate-imports': 'error',
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-non-null-assertion': 'off',
        '@typescript-eslint/ban-ts-comment': 'off',
        '@typescript-eslint/no-empty-function': 'off',
        '@typescript-eslint/consistent-type-imports': [
          'error',
          { prefer: 'type-imports', fixStyle: 'separate-type-imports', disallowTypeAnnotations: false },
        ],
      },
      settings: {
        'import/resolver': {
          typescript: {
            alwaysTryTypes: true,
            project: ['tsconfig.json'],
          },
        },
      },
    },
    {
      files: ['*.js'],
      env: {
        commonjs: true,
      },
      parserOptions: {
        ecmaVersion: 10,
        requireConfigFile: false,
      },
      extends: ['plugin:prettier/recommended'],
      plugins: ['import'],
      rules: {},
    },
  ],
};
