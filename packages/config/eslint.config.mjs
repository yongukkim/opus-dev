import js from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";

/** @opus/config: shared tooling sources only — keep rules lightweight (no TS project required). */
export default [
  { ignores: ["**/node_modules/**"] },
  js.configs.recommended,
  eslintConfigPrettier,
];
