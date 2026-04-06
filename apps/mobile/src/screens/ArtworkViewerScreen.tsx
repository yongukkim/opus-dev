import { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import type { RootStackParamList } from "../navigation/types";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { opusColors } from "../theme/opusTheme";
import { allowScreenCaptureAsync, onScreenshot, preventScreenCaptureAsync } from "../security/screenCapture";
import {
  decryptStoredAssetBytes,
  isExpired,
  loadStoredAssetMeta,
  storeEncryptedAssetV1,
  updateLeaseExpiresAt,
} from "../security/assetStore";
import * as naclUtil from "tweetnacl-util";

type Props = NativeStackScreenProps<RootStackParamList, "ArtworkViewer">;

export function ArtworkViewerScreen({ route }: Props) {
  const { artworkId } = route.params;
  const [captureBreachCount, setCaptureBreachCount] = useState(0);
  const [assetState, setAssetState] = useState<"idle" | "downloading" | "ready" | "expired" | "missing">("idle");
  const [assetPreviewB64, setAssetPreviewB64] = useState<string | null>(null);

  useEffect(() => {
    void preventScreenCaptureAsync();
    const off = onScreenshot(() => {
      setCaptureBreachCount((n) => n + 1);
      Alert.alert(
        "Capture blocked",
        "Screenshots and screen recordings are not permitted for authenticated editions.",
      );
    });
    return () => {
      off();
      void allowScreenCaptureAsync();
    };
  }, []);

  useEffect(() => {
    void (async () => {
      const meta = await loadStoredAssetMeta(artworkId);
      if (!meta) {
        setAssetState("missing");
        return;
      }
      if (isExpired(meta)) {
        setAssetState("expired");
        return;
      }
      setAssetState("ready");
      const bytes = await decryptStoredAssetBytes(meta);
      setAssetPreviewB64(naclUtil.encodeBase64(bytes));
    })();
  }, [artworkId]);

  async function demoDownloadAndStore() {
    setAssetState("downloading");
    // Demo: store a small “preview” payload; production will fetch encrypted high-fidelity via mobile API.
    const demoBytes = naclUtil.decodeUTF8(`OPUS-DEMO-ASSET:${artworkId}:${Date.now()}`);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    await storeEncryptedAssetV1({ assetId: artworkId, plainBytes: demoBytes, expiresAt });
    const meta = await loadStoredAssetMeta(artworkId);
    if (!meta || isExpired(meta)) {
      setAssetState("expired");
      return;
    }
    const bytes = await decryptStoredAssetBytes(meta);
    setAssetPreviewB64(naclUtil.encodeBase64(bytes));
    setAssetState("ready");
  }

  async function demoRevalidateLease() {
    const nextExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    await updateLeaseExpiresAt(artworkId, nextExpiresAt);
    const meta = await loadStoredAssetMeta(artworkId);
    if (!meta || isExpired(meta)) {
      setAssetState("expired");
      return;
    }
    const bytes = await decryptStoredAssetBytes(meta);
    setAssetPreviewB64(naclUtil.encodeBase64(bytes));
    setAssetState("ready");
  }

  return (
    <View style={styles.root}>
      <Text style={styles.title}>Secure Viewer</Text>
      <Text style={styles.body}>Artwork: {artworkId}</Text>
      <Text style={styles.hint}>
        Next: download encrypted asset + 7-day lease revalidation + strict screenshot/recording blocking.
      </Text>
      <Text style={styles.state}>Asset: {assetState}</Text>
      {assetState === "missing" ? (
        <Text onPress={() => void demoDownloadAndStore()} style={styles.link}>
          Demo download (store encrypted, TTL 7d)
        </Text>
      ) : null}
      {assetState === "expired" ? (
        <>
          <Text style={styles.expired}>Expired — revalidation required.</Text>
          <Text onPress={() => void demoRevalidateLease()} style={styles.link}>
            Demo revalidate (extend 7d)
          </Text>
        </>
      ) : null}
      {assetPreviewB64 ? (
        <Text style={styles.preview} numberOfLines={3}>
          Encrypted-decrypted bytes (base64): {assetPreviewB64}
        </Text>
      ) : null}
      {captureBreachCount > 0 ? (
        <Text style={styles.breach}>Capture attempts detected: {captureBreachCount}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: opusColors.charcoal, padding: 20, paddingTop: 64 },
  title: { color: opusColors.warm, fontSize: 22, fontWeight: "700" },
  body: { marginTop: 10, color: opusColors.gold, fontSize: 14, fontWeight: "600" },
  hint: { marginTop: 12, color: opusColors.warmMuted, fontSize: 13, lineHeight: 18, maxWidth: 420 },
  breach: { marginTop: 16, color: "rgba(255, 190, 120, 0.95)", fontSize: 12 },
  state: { marginTop: 16, color: "rgba(246, 244, 240, 0.55)", fontSize: 12 },
  link: { marginTop: 8, color: opusColors.gold, fontSize: 12, textDecorationLine: "underline" },
  expired: { marginTop: 8, color: "rgba(255, 160, 120, 0.95)", fontSize: 12 },
  preview: { marginTop: 10, color: "rgba(246, 244, 240, 0.45)", fontSize: 11, lineHeight: 15 },
});

