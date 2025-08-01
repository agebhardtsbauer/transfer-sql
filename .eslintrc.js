module.exports = {
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: "module",
  },
  rules: {
    "prefer-const": "error",
    "no-var": "error",
  },
  env: {
    node: true,
    es6: true,
  },
};
