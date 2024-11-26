// eslint.config.mjs

import jsRecommended from "@eslint/js";
import tsRecommended from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import globals from "globals";

export default [
  {
    files: ["**/*.{js,mjs,cjs,ts}"],

    languageOptions: {
      parser: tsParser,
      globals: globals.browser,
    },

    plugins: {
      "simple-import-sort": simpleImportSort,
      "@typescript-eslint": tsRecommended,
    },

    rules: {
      "simple-import-sort/imports": "error",
      "simple-import-sort/exports": "error",
      ...jsRecommended.configs.recommended.rules,
      ...tsRecommended.configs.recommended.rules,
    },
  },
];
