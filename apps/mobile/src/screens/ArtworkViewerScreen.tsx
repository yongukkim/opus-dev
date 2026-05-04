/**
 * Secure artwork viewer — fetches a lease then downloads the high-fidelity asset.
 *
 * ISO 27001 A.9.4.2 / A.14.2.1 / A.13.1.3 (CLAUDE.md §2, §1, §6)
 * KO: 소유 검증(lease) → 단일 사용 다운로드 → 암호화 로컬 캐시 → 감상 순서로 보안을 유지한다.
 * JA: 所有検証（lease）→ 単一使用ダウンロード → 暗号化ローカルキャッシュ → 閲覧の順でセキュリティを保つ。
 * EN: Ownership lease → single-use download → encrypted local cache → view; maintains security chain.
 */
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";
import { opusColors } from "../theme/opusTheme";
import { allowScreenCaptureAsync, onScreenshot, preventScreenCaptureAsync } from "../security/screenCapture";
import {
  decryptStoredAssetBytes,
  isExpired,
  loadStoredAssetMeta,
  storeEncryptedAssetV1,
  updateLeaseExpiresAt,
} from "../security/assetStore";
import { getOrCreateDeviceId } from "../security/deviceId";
import { useAuth } from "../auth/AuthContext";
import * as naclUtil from "tweetnacl-util";
import * as FileSystem from "expo-file-system";

type Props = NativeStackScreenProps<RootStackParamList, "ArtworkViewer">;

const API_BASE = process.env["EXPO_PUBLIC_API_URL"] ?? "https://app.opus-store.com";
const { width, height } = Dimensions.get("window");

type AssetState = "idle" | "checking" | "downloading" | "ready" | "expired" | "missing" | "forbidden" | "error";

export function ArtworkViewerScreen({ route, navigation }: Props) {
  const { artworkId, title } = route.params;
  const { getAccessToken } = useAuth();

  const [captureBreachCount, setCaptureBreachCount] = useState(0);
  const [assetState, setAssetState] = useState<AssetState>("idle");
  const [assetUri, setAssetUri] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Screen capture prevention
  useEffect(() => {
    void preventScreenCaptureAsync();
    const off = onScreenshot(() => {
      setCaptureBreachCount((n) => n + 1);
      Alert.alert(
        "캡처 차단",
        "인증 에디션은 스크린샷 및 화면 녹화가 허용되지 않습니다.",
      );
    });
    return () => {
      off();
      void allowScreenCaptureAsync();
    };
  }, []);

  // Check local cache on mount
  useEffect(() => {
    void (async () => {
      setAssetState("checking");
      const meta = await loadStoredAssetMeta(artworkId);
      if (!meta) {
        setAssetState("missing");
        return;
      }
      if (isExpired(meta)) {
        setAssetState("expired");
        return;
      }
      // Load cached asset
      const bytes = await decryptStoredAssetBytes(meta);
      await renderAsset(bytes, meta.mimeType ?? "image/jpeg");
    })();
  }, [artworkId]);

  async function renderAsset(bytes: Uint8Array, mime: string) {
    // Write to temp file for Image component
    const ext = mime.includes("video") ? "mp4" : mime.includes("webp") ? "webp" : "jpg";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cacheDir = (FileSystem as any).cacheDirectory ?? "";
    const tempPath = `${cacheDir}opus_asset_${artworkId}.${ext}`;
    const b64 = naclUtil.encodeBase64(bytes);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await FileSystem.writeAsStringAsync(tempPath, b64, { encoding: "base64" as any });
    setAssetUri(tempPath);
    setMimeType(mime);
    setAssetState("ready");
  }

  const downloadAsset = useCallback(async () => {
    setAssetState("downloading");
    setErrorMsg(null);

    try {
      const token = await getAccessToken();
      if (!token) {
        setAssetState("error");
        setErrorMsg("로그인이 필요합니다.");
        return;
      }

      const deviceId = await getOrCreateDeviceId();

      // 1. Request lease
      const leaseRes = await fetch(`${API_BASE}/api/mobile/artwork/${encodeURIComponent(artworkId)}/lease`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "x-opus-device-id": deviceId,
          "Content-Type": "application/json",
        },
      });

      if (!leaseRes.ok) {
        const err = (await leaseRes.json().catch(() => ({}))) as { error?: string };
        if (leaseRes.status === 403 || err.error === "forbidden") {
          setAssetState("forbidden");
          setErrorMsg("이 에디션의 소유자가 아닙니다.");
        } else if (leaseRes.status === 401) {
          setAssetState("error");
          setErrorMsg("디바이스 인증이 필요합니다. 디바이스를 등록해 주세요.");
        } else {
          setAssetState("error");
          setErrorMsg(err.error ?? "다운로드 권한을 확인할 수 없습니다.");
        }
        return;
      }

      const lease = (await leaseRes.json()) as { token: string; downloadUrl: string; expiresAt: string };

      // 2. Download asset using lease token
      const dlRes = await fetch(`${API_BASE}${lease.downloadUrl}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "x-opus-device-id": deviceId,
          "x-opus-lease-token": lease.token,
        },
      });

      if (!dlRes.ok) {
        setAssetState("error");
        setErrorMsg("다운로드에 실패했습니다.");
        return;
      }

      const mime = dlRes.headers.get("content-type") ?? "image/jpeg";
      const arrayBuffer = await dlRes.arrayBuffer();
      const plainBytes = new Uint8Array(arrayBuffer);

      // 3. Store encrypted
      await storeEncryptedAssetV1({
        assetId: artworkId,
        plainBytes,
        expiresAt: lease.expiresAt,
        mimeType: mime,
      });

      // 4. Render
      await renderAsset(plainBytes, mime);
    } catch (e) {
      setAssetState("error");
      setErrorMsg("오류가 발생했습니다. 다시 시도해 주세요.");
    }
  }, [artworkId, getAccessToken]);

  async function revalidateLease() {
    // Re-download to extend lease
    await downloadAsset();
  }

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="뒤로"
        >
          <Text style={styles.back}>← 뒤로</Text>
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {title ?? artworkId}
        </Text>
        {captureBreachCount > 0 ? (
          <Text style={styles.breachBadge}>⚠ {captureBreachCount}</Text>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        scrollEnabled={assetState !== "ready"}
      >
        {/* Artwork display */}
        <View style={styles.artContainer}>
          {assetState === "ready" && assetUri ? (
            <Image
              source={{ uri: assetUri }}
              style={styles.artImage}
              resizeMode="contain"
              accessibilityLabel={title ?? "artwork"}
            />
          ) : (
            <View style={styles.artPlaceholder}>
              {assetState === "downloading" || assetState === "checking" ? (
                <>
                  <ActivityIndicator color={opusColors.gold} size="large" />
                  <Text style={styles.statusText}>
                    {assetState === "checking" ? "캐시 확인 중…" : "고해상도 다운로드 중…"}
                  </Text>
                </>
              ) : assetState === "expired" ? (
                <>
                  <Text style={styles.iconText}>⏱</Text>
                  <Text style={styles.statusText}>감상 기간이 만료됐습니다.</Text>
                  <Text style={styles.hintText}>재인증 후 다시 감상할 수 있습니다.</Text>
                  <Pressable style={styles.actionBtn} onPress={() => void revalidateLease()}>
                    <Text style={styles.actionBtnText}>재인증 및 다시 보기</Text>
                  </Pressable>
                </>
              ) : assetState === "forbidden" ? (
                <>
                  <Text style={styles.iconText}>🔒</Text>
                  <Text style={styles.statusText}>소유자만 감상할 수 있습니다.</Text>
                </>
              ) : assetState === "missing" ? (
                <>
                  <Text style={styles.iconText}>🖼</Text>
                  <Text style={styles.statusText}>고해상도 에디션을 다운로드합니다.</Text>
                  <Text style={styles.hintText}>소유권이 확인된 후 기기에 안전하게 저장됩니다.</Text>
                  <Pressable style={styles.actionBtn} onPress={() => void downloadAsset()}>
                    <Text style={styles.actionBtnText}>감상 시작</Text>
                  </Pressable>
                </>
              ) : assetState === "error" ? (
                <>
                  <Text style={styles.iconText}>⚠</Text>
                  <Text style={styles.statusText}>{errorMsg ?? "오류가 발생했습니다."}</Text>
                  <Pressable style={styles.actionBtn} onPress={() => void downloadAsset()}>
                    <Text style={styles.actionBtnText}>다시 시도</Text>
                  </Pressable>
                </>
              ) : null}
            </View>
          )}
        </View>

        {/* Security notice */}
        <View style={styles.securityNotice}>
          <Text style={styles.securityText}>
            이 에디션은 본인 기기에서만 감상 가능합니다.{"\n"}
            화면 캡처 및 공유는 차단됩니다.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: opusColors.charcoal },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: opusColors.border,
  },
  back: { fontSize: 14, color: opusColors.gold, minWidth: 40 },
  headerTitle: { flex: 1, fontSize: 15, fontWeight: "600", color: opusColors.warm, textAlign: "center", marginHorizontal: 8 },
  breachBadge: { fontSize: 11, color: "#ffaa44", minWidth: 40, textAlign: "right" },
  scroll: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  artContainer: {
    width,
    aspectRatio: 1,
    backgroundColor: "#111",
    alignItems: "center",
    justifyContent: "center",
  },
  artImage: { width: "100%", height: "100%" },
  artPlaceholder: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 12,
  },
  iconText: { fontSize: 48 },
  statusText: { fontSize: 15, color: opusColors.warm, textAlign: "center", fontWeight: "600" },
  hintText: { fontSize: 13, color: opusColors.warmMuted, textAlign: "center", lineHeight: 18 },
  actionBtn: {
    marginTop: 8,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: opusColors.gold,
    alignItems: "center",
  },
  actionBtnText: { fontSize: 14, fontWeight: "700", color: opusColors.charcoal },
  securityNotice: {
    margin: 20,
    padding: 14,
    borderRadius: 8,
    backgroundColor: "rgba(222,184,146,0.06)",
    borderWidth: 1,
    borderColor: "rgba(222,184,146,0.15)",
  },
  securityText: { fontSize: 11, color: opusColors.warmMuted, textAlign: "center", lineHeight: 17 },
});
