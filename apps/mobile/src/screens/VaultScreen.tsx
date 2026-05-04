/**
 * Vault (내 소장품) 화면 — owned editions grid with thumbnails.
 *
 * ISO 27001 A.9.4.2 / A.9.2.1 (CLAUDE.md §2, §4)
 * KO: 인증된 수집가의 소장 에디션 목록을 API에서 가져와 그리드로 표시한다.
 * JA: 認証済みコレクターの所蔵エディション一覧を API から取得しグリッド表示する。
 * EN: Fetch and display the authenticated collector's owned editions in a grid.
 */
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";
import { opusColors } from "../theme/opusTheme";
import { useAuth } from "../auth/AuthContext";

type Nav = NativeStackNavigationProp<RootStackParamList>;

type EditionItem = {
  editionId: string;
  editionNumber: number;
  editionTotal: number;
  editionMode: string;
  artworkId: string;
  title: string;
  description: string | null;
  artistName: string | null;
  mimeType: string | null;
  thumbUrl: string | null;
  artworkSlug: string;
  mintedAt: string | null;
};

const API_BASE = process.env["EXPO_PUBLIC_API_URL"] ?? "https://app.opus-store.com";
const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - 48) / 2;

export function VaultScreen() {
  const nav = useNavigation<Nav>();
  const { auth, getAccessToken } = useAuth();
  const [editions, setEditions] = useState<EditionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEditions = useCallback(async () => {
    const token = await getAccessToken();
    if (!token) return;
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/mobile/collection`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        setError("소장품을 불러오지 못했습니다.");
        return;
      }
      const data = (await res.json()) as { ok: boolean; editions: EditionItem[] };
      setEditions(data.editions ?? []);
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    }
  }, [getAccessToken]);

  useEffect(() => {
    setLoading(true);
    void fetchEditions().finally(() => setLoading(false));
  }, [fetchEditions]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void fetchEditions().finally(() => setRefreshing(false));
  }, [fetchEditions]);

  if (auth.status === "unauthenticated") {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>로그인 후 소장품을 확인하세요.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>내 소장품</Text>
        {auth.status === "authenticated" ? (
          <Text style={styles.headerSub}>{auth.user.email}</Text>
        ) : null}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={opusColors.gold} size="large" />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={() => void fetchEditions()} style={styles.retryBtn}>
            <Text style={styles.retryText}>다시 시도</Text>
          </Pressable>
        </View>
      ) : editions.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>소장한 에디션이 없습니다.</Text>
          <Text style={styles.emptyHint}>
            {API_BASE.replace("https://", "")}에서{"\n"}작품을 구매하면 여기에 표시됩니다.
          </Text>
        </View>
      ) : (
        <FlatList
          data={editions}
          keyExtractor={(item) => item.editionId}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={opusColors.gold}
            />
          }
          renderItem={({ item }) => (
            <Pressable
              style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
              accessibilityRole="button"
              accessibilityLabel={`${item.title} 에디션 ${item.editionNumber}/${item.editionTotal}`}
              onPress={() =>
                nav.navigate("ArtworkViewer", {
                  artworkId: item.artworkSlug,
                  editionId: item.editionId,
                  title: item.title,
                })
              }
            >
              <View style={styles.imageContainer}>
                {item.thumbUrl ? (
                  <Image
                    source={{ uri: `${API_BASE}${item.thumbUrl}` }}
                    style={styles.thumb}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.thumbPlaceholder}>
                    <Text style={styles.thumbPlaceholderIcon}>🖼</Text>
                  </View>
                )}
                <View style={styles.editionBadge}>
                  <Text style={styles.editionBadgeText}>
                    {item.editionMode === "unique"
                      ? "1/1"
                      : `${item.editionNumber}/${item.editionTotal}`}
                  </Text>
                </View>
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.cardTitle} numberOfLines={2}>
                  {item.title}
                </Text>
                {item.artistName ? (
                  <Text style={styles.cardArtist} numberOfLines={1}>
                    {item.artistName}
                  </Text>
                ) : null}
              </View>
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: opusColors.charcoal },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: opusColors.border,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: opusColors.warm,
    letterSpacing: 0.5,
  },
  headerSub: {
    marginTop: 4,
    fontSize: 12,
    color: opusColors.warmMuted,
  },
  list: { padding: 16, gap: 16 },
  row: { gap: 16, justifyContent: "space-between" },
  card: {
    width: CARD_WIDTH,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#181818",
    borderWidth: 1,
    borderColor: opusColors.border,
  },
  cardPressed: { opacity: 0.8 },
  imageContainer: { position: "relative", width: "100%", aspectRatio: 0.8 },
  thumb: { width: "100%", height: "100%" },
  thumbPlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#252525",
    alignItems: "center",
    justifyContent: "center",
  },
  thumbPlaceholderIcon: { fontSize: 32, opacity: 0.4 },
  editionBadge: {
    position: "absolute",
    bottom: 8,
    right: 8,
    backgroundColor: "rgba(14,14,14,0.85)",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: "rgba(222,184,146,0.3)",
  },
  editionBadgeText: { fontSize: 9, fontWeight: "700", color: opusColors.gold, letterSpacing: 0.5 },
  cardBody: { padding: 10 },
  cardTitle: { fontSize: 13, fontWeight: "600", color: opusColors.warm, lineHeight: 18 },
  cardArtist: { marginTop: 4, fontSize: 11, color: opusColors.warmMuted },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  emptyText: { fontSize: 15, color: opusColors.warm, textAlign: "center" },
  emptyHint: { marginTop: 10, fontSize: 12, color: opusColors.warmMuted, textAlign: "center", lineHeight: 18 },
  errorText: { fontSize: 14, color: "#ff9a9a", textAlign: "center" },
  retryBtn: { marginTop: 16, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8, backgroundColor: "rgba(222,184,146,0.15)", borderWidth: 1, borderColor: "rgba(222,184,146,0.3)" },
  retryText: { color: opusColors.gold, fontSize: 13, fontWeight: "600" },
});
