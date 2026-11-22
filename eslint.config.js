// @ts-check
const eslint = require('@eslint/js');
const { defineConfig, globalIgnores } = require('eslint/config');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');

const httpClientRestriction = {
  name: '@angular/common/http',
  importNames: ['HttpClient', 'httpResource'],
  message:
    'Send requests through ApiClient (core/api-client.ts) so every request is tracked by HttpActivity.',
};

module.exports = defineConfig([
  globalIgnores(['src/app/core/api/schema.ts']),
  {
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      tseslint.configs.recommended,
      tseslint.configs.stylistic,
      angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      '@angular-eslint/directive-selector': [
        'error',
        {
          type: 'attribute',
          prefix: 'app',
          style: 'camelCase',
        },
      ],
      '@angular-eslint/component-selector': [
        'error',
        {
          type: 'element',
          prefix: 'app',
          style: 'kebab-case',
        },
      ],
      '@angular-eslint/prefer-on-push-component-change-detection': 'error',
    },
  },
  {
    files: ['src/app/**/*.ts'],
    ignores: ['src/app/core/api-client.ts', '**/*.spec.ts'],
    rules: {
      'no-restricted-imports': ['error', { paths: [httpClientRestriction] }],
    },
  },
  {
    files: ['src/app/features/**/*.ts'],
    ignores: ['**/*.spec.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [httpClientRestriction],
          patterns: [
            {
              group: ['@features/*', '../../*'],
              message:
                'A feature must not import another feature; reach core/, shared/ and layout/ through their @ aliases.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['**/*.html'],
    extends: [angular.configs.templateRecommended, angular.configs.templateAccessibility],
    rules: {},
  },
]);
