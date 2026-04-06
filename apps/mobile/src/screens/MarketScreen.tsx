import { StyleSheet, Text, View } from "react-native";
import { opusColors } from "../theme/opusTheme";

export function MarketScreen() {
  return (
    <View style={styles.root}>
      <Text style={styles.title}>Market</Text>
      <Text style={styles.body}>Web marketplace stays low-res; app will handle high-fidelity viewing.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: opusColors.charcoal, padding: 20, paddingTop: 64 },
  title: { color: opusColors.warm, fontSize: 22, fontWeight: "700" },
  body: { marginTop: 10, color: opusColors.warmMuted, fontSize: 14, lineHeight: 20, maxWidth: 420 },
});

