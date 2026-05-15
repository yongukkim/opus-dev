import type { Config } from "tailwindcss";
import opusPreset from "@opus/config/tailwind";

/**
 * KO: 본문 `font-sans`는 OS 기본 글꼴 대신 `globals.css`의 `--font-opus-ui-sans`(Noto 번들)만 쓰도록 덮어씁니다.
 * JA: 本文の `font-sans` を OS 依存から `globals.css` の `--font-opus-ui-sans`（Noto 同梱）へ固定します。
 * EN: Override `font-sans` so UI sans resolves to bundled Noto via `--font-opus-ui-sans`, not Segoe/SF UI stacks.
 */
export default {
  presets: [opusPreset],
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-opus-ui-sans)", "ui-sans-serif", "sans-serif"],
      },
    },
  },
} satisfies Config;
