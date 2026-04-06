import { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { opusColors } from "../theme/opusTheme";
import { getDeviceTrustSignals } from "../security/deviceHardening";
import { getOrCreateDeviceId } from "../security/deviceId";
import { wipeAndReloadApp, wipeLocalSecureData } from "../security/wipe";

export function ProfileScreen() {
  const [signals, setSignals] = useState<{ platform: string; isEmulatorLikely: boolean; isRootedLikely: boolean } | null>(
    null,
  );
  const [deviceId, setDeviceId] = useState<string>("");
  const [serverStatus, setServerStatus] = useState<string>("");

  const apiBase = useMemo(() => process.env["EXPO_PUBLIC_API_URL"] ?? "http://localhost:3000", []);
  const demoUserId = "collector-demo-001";

  useEffect(() => {
    void (async () => {
      const s = await getDeviceTrustSignals();
      setSignals(s);
      const id = await getOrCreateDeviceId();
      setDeviceId(id);
    })();
  }, []);

  async function registerDevice() {
    if (!deviceId) return;
    const res = await fetch(`${apiBase}/api/mobile/device/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-opus-user-id": demoUserId,
        "x-opus-role": "collector",
      },
      body: JSON.stringify({ deviceId, platform: (signals?.platform ?? "ios") === "android" ? "android" : "ios", pushToken: "demo-push-token" }),
    });
    const json = await res.json().catch(() => ({}));
    setServerStatus(`${res.status} ${json.status ?? json.error ?? ""}`.trim());
    if (res.status === 409) {
      Alert.alert(
        "기존 디바이스 데이터 삭제",
        "이 계정은 1대의 디바이스만 사용할 수 있습니다. OK를 누르면 기존 디바이스의 감상 데이터가 삭제됩니다.",
        [
          { text: "취소", style: "cancel" },
          { text: "OK", style: "destructive", onPress: () => void takeoverDevice() },
        ],
      );
    }
  }

  async function takeoverDevice() {
    const res = await fetch(`${apiBase}/api/mobile/device/takeover`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-opus-user-id": demoUserId,
        "x-opus-role": "collector",
      },
      body: JSON.stringify({ deviceId }),
    });
    const json = await res.json().catch(() => ({}));
    setServerStatus(`${res.status} ${json.status ?? json.error ?? ""}`.trim());
  }

  async function pollStatus() {
    const res = await fetch(`${apiBase}/api/mobile/device/status`, {
      method: "GET",
      headers: {
        "x-opus-user-id": demoUserId,
        "x-opus-role": "collector",
        "x-opus-device-id": deviceId,
      },
    });
    const json = await res.json().catch(() => ({}));
    setServerStatus(`${res.status} active=${String(json.active)} revoked=${String(json.revoked)} epoch=${String(json.epoch)}`);
    if (json.revoked) {
      Alert.alert("세션 종료", "다른 디바이스에서 로그인하여 이 디바이스의 데이터가 삭제됩니다.", [
        {
          text: "OK",
          style: "destructive",
          onPress: () => void wipeAndReloadApp(),
        },
      ]);
    }
  }

  return (
    <View style={styles.root}>
      <Text style={styles.title}>Profile</Text>
      <Text style={styles.body}>Account / settings placeholder. Later: auth session, device trust, and security notices.</Text>
      <Text style={styles.meta}>DeviceId: {deviceId || "…"}</Text>
      {signals ? (
        <Text style={styles.meta}>
          Device: {signals.platform} · emulatorLikely={String(signals.isEmulatorLikely)} · rootedLikely=
          {String(signals.isRootedLikely)}
        </Text>
      ) : null}
      <View style={styles.actions}>
        <Pressable accessibilityRole="button" style={styles.btn} onPress={() => void registerDevice()}>
          <Text style={styles.btnText}>서버에 디바이스 등록</Text>
        </Pressable>
        <Pressable accessibilityRole="button" style={styles.btnGhost} onPress={() => void pollStatus()}>
          <Text style={styles.btnGhostText}>상태 확인(폴링)</Text>
        </Pressable>
        <Pressable accessibilityRole="button" style={styles.btnGhost} onPress={() => void wipeLocalSecureData()}>
          <Text style={styles.btnGhostText}>로컬 데이터 삭제(wipe)</Text>
        </Pressable>
      </View>
      {serverStatus ? <Text style={styles.status}>Server: {serverStatus}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: opusColors.charcoal, padding: 20, paddingTop: 64 },
  title: { color: opusColors.warm, fontSize: 22, fontWeight: "700" },
  body: { marginTop: 10, color: opusColors.warmMuted, fontSize: 14, lineHeight: 20, maxWidth: 420 },
  meta: { marginTop: 14, color: "rgba(246, 244, 240, 0.45)", fontSize: 12 },
  actions: { marginTop: 18, gap: 10, maxWidth: 320 },
  btn: { backgroundColor: opusColors.gold, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 999 },
  btnText: { color: opusColors.charcoal, fontWeight: "800", fontSize: 12, letterSpacing: 0.8, textAlign: "center" },
  btnGhost: { borderWidth: 1, borderColor: "rgba(246, 244, 240, 0.16)", paddingVertical: 12, paddingHorizontal: 14, borderRadius: 999 },
  btnGhostText: { color: "rgba(246, 244, 240, 0.78)", fontWeight: "700", fontSize: 12, letterSpacing: 0.5, textAlign: "center" },
  status: { marginTop: 16, color: "rgba(246, 244, 240, 0.6)", fontSize: 12, lineHeight: 16 },
});

