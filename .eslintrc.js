module.exports = {
  env: {
    browser: true,
    es6: true,
    node: true,
  },
  plugins: ['svelte3'],
  extends: ['eslint:recommended'],
  overrides: [
    {
      files: ['**/*.svelte'],
      processor: 'svelte3/svelte3',
    },
  ],
  rules: {
    // Custom rules might go here in future
  },
};
