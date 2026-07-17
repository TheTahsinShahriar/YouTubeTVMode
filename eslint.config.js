/** @type {import('eslint').Linter.Config[]} */
module.exports = [
  {
    ignores: [
      'references/**',
      'docs/**',
      'node_modules/**',
      'dist/**',
      '_metadata/**'
    ]
  },
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'script',
      globals: {
        chrome: 'readonly',
        console: 'readonly',
        window: 'readonly',
        document: 'readonly',
        self: 'readonly',
        globalThis: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        URL: 'readonly',
        fetch: 'readonly',
        Request: 'readonly',
        MutationObserver: 'readonly',
        KeyboardEvent: 'readonly',
        HTMLImageElement: 'readonly',
        Element: 'readonly',
        EventTarget: 'readonly',
        Document: 'readonly',
        CSSStyleDeclaration: 'readonly',
        Object: 'readonly',
        Array: 'readonly',
        Math: 'readonly',
        JSON: 'readonly',
        Promise: 'readonly',
        Map: 'readonly',
        Set: 'readonly',
        TextEncoder: 'readonly',
        Uint8Array: 'readonly',
        crypto: 'readonly',
        navigator: 'readonly',
        screen: 'readonly',
        location: 'readonly',
        getComputedStyle: 'readonly',
        importScripts: 'readonly',
        YTTVM: 'readonly'
      }
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-undef': 'error',
      'no-var': 'error',
      'prefer-const': 'warn',
      eqeqeq: ['warn', 'smart'],
      'no-console': 'off'
    }
  }
];
