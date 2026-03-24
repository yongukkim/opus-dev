import type { Config } from "tailwindcss";
import opusPreset from "@opus/config/tailwind";

export default {
  presets: [opusPreset],
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx}",
  ],
} satisfies Config;
