import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { opusColors } from "../theme/opusTheme";
import { getDeviceTrustSignals } from "../security/deviceHardening";

export function ProfileScreen() {
  const [signals, setSignals] = useState<{ platform: string; isEmulatorLikely: boolean; isRootedLikely: boolean } | null>(
    null,
  );

  useEffect(() => {
    void (async () => {
      const s = await getDeviceTrustSignals();
      setSignals(s);
    })();
  }, []);

  return (
    <View style={styles.root}>
      <Text style={styles.title}>Profile</Text>
      <Text style={styles.body}>Account / settings placeholder. Later: auth session, device trust, and security notices.</Text>
      {signals ? (
        <Text style={styles.meta}>
          Device: {signals.platform} · emulatorLikely={String(signals.isEmulatorLikely)} · rootedLikely=
          {String(signals.isRootedLikely)}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: opusColors.charcoal, padding: 20, paddingTop: 64 },
  title: { color: opusColors.warm, fontSize: 22, fontWeight: "700" },
  body: { marginTop: 10, color: opusColors.warmMuted, fontSize: 14, lineHeight: 20, maxWidth: 420 },
  meta: { marginTop: 14, color: "rgba(246, 244, 240, 0.45)", fontSize: 12 },
});

