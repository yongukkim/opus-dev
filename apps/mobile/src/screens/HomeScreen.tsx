/**
 * Home screen — Chronicle preview + OPUS branding.
 * ISO 27001 A.18.1.4 (CLAUDE.md §7) — public Chronicle data only; no PII exposed.
 */
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { opusColors } from "../theme/opusTheme";
import { useAuth } from "../auth/AuthContext";

const API_BASE = process.env["EXPO_PUBLIC_API_URL"] ?? "https://app.opus-store.com";

type ChronicleRow = {
  id: string;
  opusEditionRef: string;
  eventType: string;
  recordedAt: string;
  artworkTitle?: string;
  maskedOwner?: string;
};

export function HomeScreen() {
  const { auth } = useAuth();
  const [chronicle, setChronicle] = useState<ChronicleRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    void fetch(`${API_BASE}/api/chronicle/recent`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.entries) setChronicle(data.entries as ChronicleRow[]);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.logo}>OPUS</Text>
        <Text style={styles.tagline}>복제 불가능한 디지털 아트{"\n"}인증 · 소유 · 감상</Text>
      </View>

      {auth.status === "authenticated" ? (
        <View style={styles.welcomeBanner}>
          <Text style={styles.welcomeText}>안녕하세요, {auth.user.name ?? auth.user.email}</Text>
        </View>
      ) : null}

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>THE CHRONICLE</Text>
        <Text style={styles.sectionSub}>최근 인증 기록</Text>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 24 }} color={opusColors.gold} />
      ) : chronicle.length === 0 ? (
        <Text style={styles.emptyText}>기록이 없습니다.</Text>
      ) : (
        <FlatList
          data={chronicle}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <View style={styles.rowDot} />
              <View style={styles.rowContent}>
                <Text style={styles.rowTitle} numberOfLines={1}>
                  {item.artworkTitle ?? item.opusEditionRef}
                </Text>
                <Text style={styles.rowMeta}>
                  {item.eventType} · {new Date(item.recordedAt).toLocaleDateString("ko-KR")}
                </Text>
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: opusColors.charcoal },
  header: {
    alignItems: "center",
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: opusColors.border,
  },
  logo: { fontSize: 36, letterSpacing: 8, color: opusColors.gold, fontFamily: "Georgia" },
  tagline: { marginTop: 8, fontSize: 11, color: opusColors.warmMuted, textAlign: "center", lineHeight: 17, letterSpacing: 0.3 },
  welcomeBanner: {
    marginHorizontal: 20,
    marginTop: 14,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "rgba(222,184,146,0.08)",
    borderWidth: 1,
    borderColor: "rgba(222,184,146,0.2)",
  },
  welcomeText: { fontSize: 13, color: opusColors.gold },
  sectionHeader: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8 },
  sectionTitle: { fontSize: 11, fontWeight: "800", letterSpacing: 2, color: opusColors.gold },
  sectionSub: { marginTop: 2, fontSize: 12, color: opusColors.warmMuted },
  list: { paddingHorizontal: 20, paddingBottom: 24 },
  row: { flexDirection: "row", alignItems: "flex-start", gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: opusColors.border },
  rowDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: opusColors.gold, marginTop: 5 },
  rowContent: { flex: 1 },
  rowTitle: { fontSize: 13, fontWeight: "600", color: opusColors.warm },
  rowMeta: { marginTop: 3, fontSize: 11, color: opusColors.warmMuted },
  emptyText: { marginTop: 24, textAlign: "center", color: opusColors.warmMuted, fontSize: 13 },
});
