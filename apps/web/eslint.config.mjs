import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

/**
 * Next.js 16+ native flat config (`eslint-config-next/core-web-vitals`).
 * ESLint 9.x matches current Next/plugin peer ranges; upgrade to 10 when upstream declares support.
 * @see https://nextjs.org/docs/app/api-reference/config/eslint
 */
const eslintConfig = [...nextCoreWebVitals];

export default eslintConfig;
