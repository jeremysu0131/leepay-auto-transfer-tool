module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
    es6: true
  },
  parserOptions: {
    parser: "@typescript-eslint/parser",
    sourceType: "module"
  },
  plugins: ["vue"],
  rules: {
    "no-console": process.env.NODE_ENV === "production" ? "error" : "off",
    "no-debugger": process.env.NODE_ENV === "production" ? "error" : "off",
    "no-trailing-spaces": "off",
    "no-var": "error",
    indent: "off",
    quotes: [2, "double", { avoidEscape: true }],
    semi: "off",
    "@typescript-eslint/semi": ["error"],
    "space-before-function-paren": [
      "error",
      {
        anonymous: "never",
        named: "never",
        asyncArrow: "always"
      }
    ],
    "vue/array-bracket-spacing": "error",
    "vue/arrow-spacing": "error",
    "vue/block-spacing": "error",
    "vue/brace-style": "error",
    "vue/camelcase": "error",
    "vue/comma-dangle": "error",
    "vue/component-name-in-template-casing": "error",
    "vue/eqeqeq": "error",
    "vue/key-spacing": "error",
    "vue/match-component-file-name": "error",
    "vue/object-curly-spacing": "error"
  },
  extends: [
    "eslint:recommended",
    "plugin:vue/recommended",
    "@vue/standard",
    "@vue/typescript",
    "plugin:you-dont-need-momentjs/recommended"
  ]
};
