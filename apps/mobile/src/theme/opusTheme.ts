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

