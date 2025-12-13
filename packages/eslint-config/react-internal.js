module.exports = {
  extends: ['./base.js'],
  rules: {
    // Rules specific to internal React libraries
    'no-console': 'warn',
    '@typescript-eslint/consistent-type-imports': 'error'
  },
  env: {
    browser: true,
    es6: true
  }
};