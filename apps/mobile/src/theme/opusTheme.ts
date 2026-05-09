/** OPUS font families — loaded via expo-font in App.tsx */
export const opusFonts = {
  display: "Cinzel_700Bold",
  displayMedium: "Cinzel_600SemiBold",
  displayRegular: "Cinzel_400Regular",
  mono: "JetBrainsMono_400Regular",
  monoMedium: "JetBrainsMono_500Medium",
} as const;

/** OPUS brass gradient stops — mirrors globals.css brass tokens */
export const brassPalette = {
  highlight: "#f2e9dc",
  mid: "#e4d2b8",
  body: "#d6bc96",
  shadow: "#c4a06e",
  accent: "#deb892",
  deep: "#c9a97e",
} as const;

/** OPUS Classic Luxury — near-black charcoal, champagne brass, warm white. */
export const opusColors = {
  charcoal: "#0E0E0E",
  slate: "#252525",
  gold: "#DEB892",
  goldDim: "#c6a06e",
  warm: "#F6F4F0",
  warmMuted: "rgba(246, 244, 240, 0.62)",
  border: "rgba(246, 244, 240, 0.10)",
} as const;

// NOTE: `@react-navigation/native` theme typing differs across versions; keep a minimal compatible shape.
export const opusNavTheme = {
  dark: true,
  fonts: {
    regular: { fontFamily: "System", fontWeight: "400" },
    medium: { fontFamily: "System", fontWeight: "500" },
    bold: { fontFamily: "System", fontWeight: "700" },
    heavy: { fontFamily: "System", fontWeight: "800" },
  },
  colors: {
    primary: opusColors.gold,
    background: opusColors.charcoal,
    card: opusColors.charcoal,
    text: opusColors.warm,
    border: opusColors.border,
    notification: opusColors.gold,
  },
} as const;

