import "react-native-gesture-handler";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import { Feather, Ionicons } from "@expo/vector-icons";
import { createHttpClient } from "@opus/api";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { AppTabs } from "./src/navigation/AppTabs";
import type { RootStackParamList } from "./src/navigation/types";
import { ArtworkViewerScreen } from "./src/screens/ArtworkViewerScreen";
import { opusNavTheme } from "./src/theme/opusTheme";

const Stack = createNativeStackNavigator<RootStackParamList>();

function RootNavigation() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <NavigationContainer theme={opusNavTheme}>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Tabs" component={AppTabs} />
          <Stack.Screen name="ArtworkViewer" component={ArtworkViewerScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

/** OPUS Classic Luxury — near-black charcoal, champagne brass (tokens), warm white; seal for official stamp. */
const C = {
  charcoal: "#0E0E0E",
  gold: "#DEB892",
  goldDim: "#c6a06e",
  slate: "#252525",
  warm: "#F6F4F0",
  warmMuted: "rgba(246, 244, 240, 0.62)",
  seal: "#C43535",
} as const;

type RankTab = "today" | "weekly" | "monthly";

function OpusHome() {
  const insets = useSafeAreaInsets();
  const [rankTab, setRankTab] = useState<RankTab>("today");

  const client = useMemo(
    () =>
      createHttpClient({
        baseURL: process.env["EXPO_PUBLIC_API_URL"] ?? "https://api.example.com",
        getAccessToken: () => undefined,
      }),
    [],
  );
  void client;

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safeTop} edges={["top"]}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
        >
          <View style={styles.headerRow}>
            <Pressable accessibilityRole="button" hitSlop={12} style={styles.iconHit}>
              <Feather name="menu" size={22} color={C.gold} />
            </Pressable>
            <View style={styles.headerCenter}>
              <Text style={styles.logoSerif}>OPUS</Text>
              <Text style={styles.taglineEn}>NON-FUNGIBLE DIGITAL ART, AUTHENTICATED</Text>
              <Text style={styles.taglineJa}>デジタル名作のアーカイブ</Text>
            </View>
            <Pressable accessibilityRole="button" hitSlop={12} style={styles.iconHit}>
              <Ionicons name="notifications-outline" size={22} color={C.gold} />
            </Pressable>
          </View>
          <Text style={styles.vaultHint}>OPUS VAULT</Text>

          <View style={styles.best5Header}>
            <Text style={styles.best5Title}>BEST 5</Text>
            <View style={styles.rankTabs}>
              {(
                [
                  { key: "today" as const, label: "Today" },
                  { key: "weekly" as const, label: "Weekly" },
                  { key: "monthly" as const, label: "Monthly" },
                ] as const
              ).map(({ key, label }) => (
                <Pressable
                  key={key}
                  accessibilityRole="button"
                  accessibilityState={{ selected: rankTab === key }}
                  onPress={() => setRankTab(key)}
                  style={[styles.rankTab, rankTab === key && styles.rankTabActive]}
                >
                  <Text style={[styles.rankTabText, rankTab === key && styles.rankTabTextActive]}>
                    {label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.thumbRow}
          >
            {[1, 2, 3, 4, 5].map((i) => (
              <View key={i} style={styles.thumb}>
                <Text style={styles.thumbRank}>#{i}</Text>
              </View>
            ))}
          </ScrollView>

          <View style={styles.sectionLabelRow}>
            <Text style={styles.sectionSerif}>Premiere</Text>
          </View>
          <Text style={styles.metaLine}>OPUS 42: THE PREMIERE</Text>
          <Text style={styles.metaSub}>(Artist: Kami-Eshi KAI)</Text>
          <Text style={styles.logTeaser}>The Log · edition chain · not an investment product</Text>

          <View style={styles.card}>
            <View style={styles.artPlaceholder}>
              <View style={styles.artInnerGlow} />
              <Text style={styles.artPlaceholderLabel}>Premiere artwork</Text>
              <View style={styles.bidOverlay}>
                <Text style={styles.bidLabel}>Current bid</Text>
                <Text style={styles.bidAmount}>¥ 2,450,000</Text>
                <Text style={styles.countdown}>Ends in 02h 14m 55s</Text>
              </View>
            </View>
            <View style={styles.authenticatedPill}>
              <Ionicons name="ribbon-outline" size={14} color={C.seal} />
              <Text style={styles.authenticatedText}>AUTHENTICATED</Text>
            </View>
          </View>

          <View style={styles.miniGrid}>
            <View style={styles.miniCard}>
              <Text style={styles.miniValue}>12.4k</Text>
              <Text style={styles.miniLabel}>Views</Text>
            </View>
            <View style={styles.miniCard}>
              <Text style={styles.miniValue}>847</Text>
              <Text style={styles.miniLabel}>Watchlist</Text>
            </View>
          </View>

          <View style={styles.navLinks}>
            <Text style={styles.navLink}>PREMIERES</Text>
            <Text style={styles.navSep}>|</Text>
            <Text style={styles.navLink}>THE CHRONICLE</Text>
            <Text style={styles.navSep}>|</Text>
            <Text style={styles.navLink}>MY VAULT</Text>
          </View>

          <Pressable
            style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
            accessibilityRole="button"
          >
            <Text style={styles.ctaText}>ACCESS PREMIERE / PLACE BID</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>

      <View style={[styles.bottomNav, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <Pressable style={styles.tabCol} accessibilityRole="button" accessibilityLabel="Home">
          <Ionicons name="home" size={22} color={C.gold} />
          <Text style={styles.tabLabel}>Home</Text>
        </Pressable>
        <Pressable style={styles.tabCol} accessibilityRole="button" accessibilityLabel="Market">
          <Ionicons name="grid-outline" size={22} color={C.warmMuted} />
          <Text style={styles.tabLabelMuted}>Market</Text>
        </Pressable>
        <Pressable style={styles.tabCol} accessibilityRole="button" accessibilityLabel="Vault">
          <View>
            <Ionicons name="albums-outline" size={22} color={C.warmMuted} />
            <View style={styles.badge}>
              <Text style={styles.badgeText}>9</Text>
            </View>
          </View>
          <Text style={styles.tabLabelMuted}>Vault</Text>
        </Pressable>
        <Pressable style={styles.tabCol} accessibilityRole="button" accessibilityLabel="Profile">
          <Ionicons name="person-outline" size={22} color={C.warmMuted} />
          <Text style={styles.tabLabelMuted}>Profile</Text>
        </Pressable>
      </View>
    </View>
  );
}

// Temporary: keep legacy home prototype reachable for later refactor.
void OpusHome;

export default function App() {
  return <RootNavigation />;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.charcoal,
  },
  safeTop: {
    flex: 1,
    backgroundColor: C.charcoal,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginTop: 4,
  },
  iconHit: {
    padding: 4,
    marginTop: 8,
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 8,
  },
  logoSerif: {
    fontFamily: "Georgia",
    fontSize: 36,
    fontWeight: "400",
    color: C.gold,
    letterSpacing: 6,
  },
  taglineEn: {
    marginTop: 6,
    fontSize: 9,
    letterSpacing: 1.2,
    color: C.warmMuted,
    textAlign: "center",
  },
  taglineJa: {
    marginTop: 4,
    fontSize: 10,
    color: C.warmMuted,
    textAlign: "center",
  },
  vaultHint: {
    alignSelf: "flex-end",
    marginTop: -4,
    marginRight: 2,
    fontSize: 8,
    letterSpacing: 1,
    color: "rgba(197, 160, 40, 0.55)",
  },
  best5Header: {
    marginTop: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  best5Title: {
    fontFamily: "Georgia",
    fontSize: 18,
    color: C.gold,
    letterSpacing: 2,
  },
  rankTabs: {
    flexDirection: "row",
    gap: 6,
  },
  rankTab: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(245, 245, 245, 0.12)",
    backgroundColor: "transparent",
  },
  rankTabActive: {
    borderColor: "rgba(197, 160, 40, 0.45)",
    backgroundColor: "rgba(197, 160, 40, 0.08)",
  },
  rankTabText: {
    fontSize: 10,
    fontWeight: "600",
    color: C.warmMuted,
    letterSpacing: 0.3,
  },
  rankTabTextActive: {
    color: C.gold,
  },
  thumbRow: {
    gap: 10,
    paddingVertical: 12,
    paddingRight: 20,
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: C.slate,
    borderWidth: 1,
    borderColor: "rgba(197, 160, 40, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  thumbRank: {
    fontSize: 11,
    fontWeight: "700",
    color: C.warmMuted,
  },
  sectionLabelRow: {
    marginTop: 8,
    marginBottom: 6,
  },
  sectionSerif: {
    fontFamily: "Georgia",
    fontSize: 22,
    color: C.gold,
  },
  metaLine: {
    fontSize: 13,
    fontWeight: "600",
    color: C.warm,
    letterSpacing: 0.3,
  },
  metaSub: {
    marginTop: 4,
    fontSize: 12,
    color: C.warmMuted,
  },
  logTeaser: {
    marginTop: 8,
    fontSize: 10,
    letterSpacing: 1.2,
    color: "rgba(197, 160, 40, 0.5)",
  },
  card: {
    marginTop: 16,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: C.slate,
    borderWidth: 1,
    borderColor: "rgba(197, 160, 40, 0.22)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 8,
  },
  artPlaceholder: {
    height: 300,
    backgroundColor: "#1a1a1a",
    alignItems: "center",
    justifyContent: "center",
  },
  artInnerGlow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(197, 160, 40, 0.06)",
  },
  artPlaceholderLabel: {
    fontSize: 12,
    letterSpacing: 2,
    color: "rgba(245, 245, 245, 0.35)",
  },
  bidOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: "rgba(18, 18, 18, 0.88)",
    borderTopWidth: 1,
    borderTopColor: "rgba(197, 160, 40, 0.15)",
  },
  bidLabel: {
    fontSize: 9,
    letterSpacing: 1.4,
    color: C.warmMuted,
    textTransform: "uppercase",
  },
  bidAmount: {
    marginTop: 4,
    fontSize: 18,
    fontWeight: "700",
    color: C.gold,
    letterSpacing: 0.5,
  },
  countdown: {
    marginTop: 6,
    fontSize: 11,
    color: C.warm,
    letterSpacing: 0.3,
  },
  authenticatedPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-end",
    margin: 12,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 4,
    backgroundColor: "rgba(18, 18, 18, 0.92)",
    borderWidth: 1,
    borderColor: "rgba(196, 53, 53, 0.65)",
  },
  authenticatedText: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1,
    color: C.seal,
  },
  miniGrid: {
    marginTop: 16,
    flexDirection: "row",
    gap: 12,
  },
  miniCard: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: "rgba(43, 43, 43, 0.9)",
    borderWidth: 1,
    borderColor: "rgba(245, 245, 245, 0.08)",
  },
  miniValue: {
    fontSize: 20,
    fontWeight: "700",
    color: C.warm,
  },
  miniLabel: {
    marginTop: 4,
    fontSize: 10,
    letterSpacing: 0.8,
    color: C.warmMuted,
    textTransform: "uppercase",
  },
  navLinks: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginTop: 20,
  },
  navLink: {
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 1.4,
    color: C.gold,
  },
  navSep: {
    fontSize: 10,
    color: "rgba(245, 245, 245, 0.25)",
  },
  cta: {
    marginTop: 20,
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: "center",
    backgroundColor: C.gold,
    shadowColor: C.gold,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 6,
  },
  ctaPressed: {
    backgroundColor: C.goldDim,
  },
  ctaText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
    color: C.charcoal,
  },
  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "flex-end",
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(245, 245, 245, 0.08)",
    backgroundColor: C.charcoal,
  },
  tabCol: {
    alignItems: "center",
    justifyContent: "center",
    minWidth: 56,
    paddingVertical: 4,
  },
  tabLabel: {
    marginTop: 4,
    fontSize: 10,
    fontWeight: "600",
    color: C.gold,
    letterSpacing: 0.2,
  },
  tabLabelMuted: {
    marginTop: 4,
    fontSize: 10,
    color: "rgba(245, 245, 245, 0.45)",
    letterSpacing: 0.2,
  },
  badge: {
    position: "absolute",
    right: -8,
    top: -6,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: C.gold,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: C.charcoal,
  },
});
