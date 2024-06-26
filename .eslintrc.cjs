module.exports = {
  env: {
    browser: true,
    es2021: true
  },
  extends: ["prettier"],
  plugins: ["prettier"],
  overrides: [
    {
      env: {
        node: true
      },
      files: [
        '.eslintrc.{js,cjs,mjs}'
      ],
      parserOptions: {
        sourceType: 'script'
      }
    }
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  rules: {
    "prettier/prettier": ["error"],
    "array-callback-return": ["error"]
  }
}
