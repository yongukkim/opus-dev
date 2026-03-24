import { defineConfig } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';

const eslintConfig = defineConfig([
  ...nextVitals,
  {
    // OPUS 전용 추가 규칙 (보안 및 스타일)
    rules: {
      // Expo/RN — no Next.js pages router; silence noisy "Pages directory cannot be found" output.
      "@next/next/no-html-link-for-pages": "off",
      "no-unused-vars": "warn",
      "no-console": "warn",
    },
  },
  {
    // 무시할 폴더 설정
    ignores: [".next/**", "node_modules/**", "dist/**"],
  }
]);

export default eslintConfig;