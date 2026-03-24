/**
 * OPUS Classic Luxury palette (CLAUDE.md).
 * — 배경 near-black: #0E0E0E
 * — 악센트: 조금 더 밝은 황동 #DEB892 (`opus-surface-metallic` 면은 globals 다층 그라데이션)
 * — Gray Slate / Warm White / Seal
 * @type {import('tailwindcss').Config}
 */
const preset = {
  theme: {
    extend: {
      colors: {
        opus: {
          charcoal: "#0E0E0E",
          gold: "#DEB892",
          "gold-light": "#EDE4D4",
          "gold-dim": "#c6a06e",
          slate: "#252525",
          warm: "#F6F4F0",
          seal: "#C43535",
        },
      },
      fontFamily: {
        /** Loaded via Next.js `next/font` in apps/web — variables `--font-cinzel`, `--font-noto`, `--font-mono-jb` */
        display: [
          "var(--font-cinzel)",
          "Georgia",
          "Cambria",
          "Times New Roman",
          "serif",
        ],
        sans: [
          "var(--font-noto)",
          "ui-sans-serif",
          "system-ui",
          "Segoe UI",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
        mono: ["var(--font-mono-jb)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      boxShadow: {
        "opus-card": "0 12px 40px rgba(0, 0, 0, 0.38)",
        "opus-gold-bevel":
          "inset 0 2px 0 rgba(255, 255, 255, 0.5), inset 0 -10px 24px rgba(72, 48, 28, 0.22), 0 4px 22px rgba(0, 0, 0, 0.38)",
      },
      backgroundImage: {
        "opus-gold-metal":
          "linear-gradient(142deg, #f7f0e6 0%, #ead8c4 18%, #dcc7a8 40%, #c9a972 62%, #b89158 82%, #d4b88a 100%)",
        "opus-gold-brush":
          "repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(255, 255, 255, 0.035) 2px, rgba(255, 255, 255, 0.035) 3px)",
      },
    },
  },
  plugins: [],
};

export default preset;
