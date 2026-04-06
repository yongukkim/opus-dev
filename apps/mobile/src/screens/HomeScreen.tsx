import { Pressable, StyleSheet, Text, View } from "react-native";
import { opusColors } from "../theme/opusTheme";

export function HomeScreen() {
  return (
    <View style={styles.root}>
      <Text style={styles.kicker}>OPUS</Text>
      <Text style={styles.title}>Home</Text>
      <Text style={styles.body}>App shell is ready. Next: Vault ownership + secure viewer.</Text>
      <Pressable style={styles.cta} accessibilityRole="button">
        <Text style={styles.ctaText}>Explore</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: opusColors.charcoal, padding: 20, paddingTop: 64 },
  kicker: { color: opusColors.gold, letterSpacing: 5.5, fontSize: 12, fontWeight: "700" },
  title: { marginTop: 14, color: opusColors.warm, fontSize: 26, fontWeight: "700" },
  body: { marginTop: 10, color: opusColors.warmMuted, fontSize: 14, lineHeight: 20, maxWidth: 360 },
  cta: {
    marginTop: 18,
    borderRadius: 999,
    paddingVertical: 14,
    paddingHorizontal: 18,
    alignSelf: "flex-start",
    backgroundColor: opusColors.gold,
  },
  ctaText: { color: opusColors.charcoal, fontWeight: "800", letterSpacing: 1.2, fontSize: 12 },
});

