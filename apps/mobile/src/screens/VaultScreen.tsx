import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { RootStackParamList } from "../navigation/types";
import { opusColors } from "../theme/opusTheme";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function VaultScreen() {
  const nav = useNavigation<Nav>();
  return (
    <View style={styles.root}>
      <Text style={styles.title}>Vault</Text>
      <Text style={styles.body}>
        Placeholder owned editions list. Tapping opens the secure viewer (next steps: download + TTL + capture block).
      </Text>
      <Pressable
        accessibilityRole="button"
        style={styles.card}
        onPress={() => nav.navigate("ArtworkViewer", { artworkId: "demo-edition-001" })}
      >
        <Text style={styles.cardTitle}>Premiere — Edition 1/50</Text>
        <Text style={styles.cardMeta}>Owner verified (demo)</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: opusColors.charcoal, padding: 20, paddingTop: 64 },
  title: { color: opusColors.warm, fontSize: 22, fontWeight: "700" },
  body: { marginTop: 10, color: opusColors.warmMuted, fontSize: 14, lineHeight: 20, maxWidth: 420 },
  card: {
    marginTop: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(246, 244, 240, 0.10)",
    backgroundColor: "rgba(37, 37, 37, 0.35)",
    padding: 16,
  },
  cardTitle: { color: opusColors.warm, fontSize: 16, fontWeight: "700" },
  cardMeta: { marginTop: 6, color: "rgba(246, 244, 240, 0.55)", fontSize: 12 },
});

