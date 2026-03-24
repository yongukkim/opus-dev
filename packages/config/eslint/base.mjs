import js from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import globals from "globals";
import tseslint from "typescript-eslint";

/**
 * OPUS shared ESLint flat config — TypeScript + safe defaults (no React plugin).
 * apps/web: import `eslint-config-next/core-web-vitals` (native flat config, ESLint 10+).
 * React rules: packages/ui, apps/mobile.
 */
export const opusEslintBase = tseslint.config(
  {
    ignores: [
      "**/eslint.config.mjs",
      "**/dist/**",
      "**/.next/**",
      "**/node_modules/**",
      "**/build/**",
      "**/.expo/**",
      "**/next.config.*",
      "**/postcss.config.*",
      "**/tailwind.config.*",
      "**/metro.config.js",
      "**/babel.config.js",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  eslintConfigPrettier,
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
      parserOptions: {
        projectService: true,
      },
    },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-misused-promises": "error",
      "no-console": ["warn", { allow: ["warn", "error"] }],
    },
  },
);

export default opusEslintBase;
