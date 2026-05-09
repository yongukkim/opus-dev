/**
 * Google OAuth login screen — OPUS Classic Luxury design.
 *
 * ISO 27001 A.9.4.2 (CLAUDE.md §2)
 * KO: Google OAuth PKCE 흐름으로 로그인하고 앱 Bearer 토큰을 발급받는다.
 * JA: Google OAuth PKCE フローでログインし、アプリ Bearer トークンを取得する。
 * EN: Sign in via Google OAuth PKCE and obtain app Bearer tokens.
 */
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaskedView } from "@react-native-masked-view/masked-view";
import { exchangeGoogleCode } from "../auth/googleAuth";
import { useAuth } from "../auth/AuthContext";
import { opusColors, opusFonts, brassPalette } from "../theme/opusTheme";

const API_BASE = process.env["EXPO_PUBLIC_API_URL"] ?? "https://app.opus-store.com";
/** Native / shared OAuth client (iOS URL scheme or multi-platform). */
const GOOGLE_CLIENT_ID = process.env["EXPO_PUBLIC_GOOGLE_CLIENT_ID"] ?? "";
/** Web OAuth 2.0 "Web application" client — required for browser redirect URIs (e.g. http://localhost:8081). */
const GOOGLE_WEB_CLIENT_ID = process.env["EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID"] ?? "";
const { width } = Dimensions.get("window");

function resolveGoogleClientId(): string {
  if (Platform.OS === "web") {
    return (GOOGLE_WEB_CLIENT_ID || GOOGLE_CLIENT_ID).trim();
  }
  return GOOGLE_CLIENT_ID.trim();
}

/**
 * Google "Web application" OAuth requires an https? redirect_uri.
 * With `expo.scheme` set, `makeRedirectUri({ scheme: "opus" })` can resolve to `opus://...` on web — not allowed → redirect_uri_mismatch.
 */
function resolveGoogleOAuthRedirectUri(expoAuth: { makeRedirectUri: (options?: { scheme?: string }) => string }): string {
  const fromEnv = process.env["EXPO_PUBLIC_GOOGLE_REDIRECT_URI"]?.trim();
  if (fromEnv) return fromEnv;
  if (Platform.OS === "web" && typeof window !== "undefined") {
    const u = new URL(window.location.href);
    if (!u.pathname || u.pathname === "/") return u.origin;
    const path = u.pathname.endsWith("/") ? u.pathname.slice(0, -1) : u.pathname;
    return `${u.origin}${path}`;
  }
  return expoAuth.makeRedirectUri({ scheme: "opus" });
}

/** Gradient text using MaskedView — mirrors .opus-text-metallic from globals.css (native). Web: solid brass (MaskedView is unreliable on react-native-web). */
function MetallicText({ style, children }: { style?: object; children: string }) {
  if (Platform.OS === "web") {
    return (
      <Text
        style={[
          styles.logoBase,
          style,
          {
            color: brassPalette.accent,
            textShadowColor: "rgba(0,0,0,0.45)",
            textShadowOffset: { width: 0, height: 1 },
            textShadowRadius: 3,
          },
        ]}
      >
        {children}
      </Text>
    );
  }
  return (
    <MaskedView maskElement={<Text style={[styles.logoBase, style]}>{children}</Text>}>
      <LinearGradient
        colors={[
          brassPalette.highlight,
          brassPalette.accent,
          brassPalette.body,
          brassPalette.shadow,
          "#c9a97e",
        ]}
        locations={[0, 0.34, 0.58, 0.82, 1]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
      >
        <Text style={[styles.logoBase, style, { opacity: 0 }]}>{children}</Text>
      </LinearGradient>
    </MaskedView>
  );
}

/** Gradient button — mirrors .opus-surface-metallic from globals.css */
function MetallicButton({
  onPress,
  disabled,
  loading,
  label,
}: {
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  label: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [styles.btnWrap, pressed && { opacity: 0.88 }, disabled && { opacity: 0.55 }]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <LinearGradient
        colors={["#f7f0e6", "#ead8c4", "#dcc7a8", "#c9a972", "#b89158", "#d4b88a"]}
        locations={[0, 0.18, 0.40, 0.62, 0.82, 1]}
        start={{ x: 0.05, y: 0 }}
        end={{ x: 0.95, y: 1 }}
        style={styles.btnGradient}
      >
        {/* Highlight layer */}
        <LinearGradient
          colors={["rgba(255,252,248,0.55)", "rgba(255,250,242,0.12)", "transparent"]}
          locations={[0, 0.38, 0.62]}
          start={{ x: 0.18, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        {loading ? (
          <ActivityIndicator size="small" color={opusColors.charcoal} />
        ) : (
          <Text style={styles.btnText}>{label}</Text>
        )}
      </LinearGradient>
    </Pressable>
  );
}

function useGoogleOAuth() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [authSession, setAuthSession] = useState<any>(null);
  useEffect(() => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const expoAuth = require("expo-auth-session");
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const expoBrowser = require("expo-web-browser");
      expoBrowser.maybeCompleteAuthSession();
      setAuthSession({ expoAuth, expoBrowser });
    } catch {
      console.warn("expo-auth-session not installed.");
    }
  }, []);
  return authSession;
}

export function LoginScreen() {
  const { signIn } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const authSessionRef = useGoogleOAuth();

  async function handleGoogleSignIn() {
    if (!authSessionRef) {
      Alert.alert("설정 오류", "Google 로그인 모듈이 설치되지 않았습니다.");
      return;
    }
    const googleClientId = resolveGoogleClientId();
    if (!googleClientId) {
      setError(
        Platform.OS === "web"
          ? "EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID(또는 EXPO_PUBLIC_GOOGLE_CLIENT_ID)를 .env에 설정하세요."
          : "EXPO_PUBLIC_GOOGLE_CLIENT_ID가 설정되지 않았습니다.",
      );
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const { expoAuth } = authSessionRef;
      const redirectUri = resolveGoogleOAuthRedirectUri(expoAuth);
      const discovery = {
        authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
        tokenEndpoint: "https://oauth2.googleapis.com/token",
      };
      // expo-auth-session v55 has no AuthRequest.buildAsync — construct AuthRequest then makeAuthUrlAsync (AuthRequest.js).
      const request = new expoAuth.AuthRequest({
        clientId: googleClientId,
        scopes: ["openid", "email", "profile"],
        redirectUri,
        usePKCE: true,
      });
      await request.makeAuthUrlAsync(discovery);

      const result = await request.promptAsync(discovery);
      if (result.type === "dismiss") return;
      if (result.type === "locked") {
        setError("다른 로그인 창이 열려 있습니다. 잠시 후 다시 시도해 주세요.");
        return;
      }
      if (result.type === "error") {
        setError("로그인 응답을 확인할 수 없습니다. 팝업이 차단됐는지 확인 후 다시 시도해 주세요.");
        return;
      }
      if (result.type !== "success") {
        setError("로그인이 취소됐습니다.");
        return;
      }
      const code = typeof result.params?.code === "string" ? result.params.code : "";
      if (!code) {
        setError("인증 코드를 받지 못했습니다. Google 콘솔의 리디렉션 URI를 확인하세요.");
        return;
      }
      const exchangeResult = await exchangeGoogleCode(
        code,
        request.codeVerifier ?? "",
        redirectUri,
        API_BASE,
        googleClientId,
      );
      if (!exchangeResult.ok) {
        const detail =
          exchangeResult.error === "app_network_error"
            ? "브라우저 주소(localhost:8081)는 맞습니다. 로그인 API(Next)에 연결하지 못했습니다. 로컬에서 웹을 띄웠다면 apps/mobile .env에 EXPO_PUBLIC_API_URL=http://localhost:3000 처럼 같은 머신의 Next 주소를 넣고, 프로덕션을 쓴다면 app.opus-store.com에 최신 배포가 있는지 확인하세요."
            : `로그인 실패: ${exchangeResult.error}`;
        setError(detail);
        return;
      }
      await signIn(exchangeResult.accessToken, exchangeResult.refreshToken, exchangeResult.user);
    } catch (e) {
      const hint =
        e && typeof e === "object" && "code" in e && (e as { code?: string }).code === "ERR_WEB_BROWSER_BLOCKED"
          ? "브라우저가 팝업을 차단했습니다. 주소창 옆 팝업 허용 후 다시 시도해 주세요."
          : "오류가 발생했습니다. 다시 시도해 주세요.";
      setError(hint);
      if (__DEV__) console.warn("[LoginScreen] Google sign-in", e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.root}>
      {/* Background subtle gradient */}
      <LinearGradient
        colors={["#141414", opusColors.charcoal, "#0a0a0a"]}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={styles.content}>
        {/* OPUS logo — metallic gradient text */}
        <MetallicText style={styles.logoBase}>OPUS</MetallicText>

        {/* Tagline — soft metallic (native); web uses solid warm brass */}
        {Platform.OS === "web" ? (
          <Text style={[styles.tagline, { color: brassPalette.mid }]}>복제 불가능한 디지털 아트{"\n"}인증 · 소유 · 감상</Text>
        ) : (
          <MaskedView maskElement={<Text style={styles.tagline}>복제 불가능한 디지털 아트{"\n"}인증 · 소유 · 감상</Text>}>
            <LinearGradient
              colors={["#faf6ef", brassPalette.accent, brassPalette.shadow]}
              locations={[0, 0.42, 1]}
              start={{ x: 0.1, y: 0 }}
              end={{ x: 0.9, y: 1 }}
            >
              <Text style={[styles.tagline, { opacity: 0 }]}>복제 불가능한 디지털 아트{"\n"}인증 · 소유 · 감상</Text>
            </LinearGradient>
          </MaskedView>
        )}

        <Text style={styles.subtitle}>구매하신 에디션은 본 앱에서만 감상할 수 있습니다.</Text>

        {/* Divider */}
        <LinearGradient
          colors={["transparent", brassPalette.shadow, "transparent"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.divider}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {/* Metallic CTA button */}
        <MetallicButton
          onPress={() => void handleGoogleSignIn()}
          disabled={loading}
          loading={loading}
          label="Google로 계속하기"
        />

        <Text style={styles.note}>
          {API_BASE.replace("https://", "")}에서 작품을 구매한 후{"\n"}
          동일한 Google 계정으로 로그인하세요.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: opusColors.charcoal },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  logoBase: {
    fontFamily: opusFonts.display,
    fontSize: 56,
    letterSpacing: 14,
    textAlign: "center",
    includeFontPadding: false,
  },
  tagline: {
    fontFamily: opusFonts.displayRegular,
    fontSize: 14,
    lineHeight: 22,
    letterSpacing: 0.8,
    textAlign: "center",
    marginTop: 12,
    color: brassPalette.accent, // fallback for MaskedView
  },
  subtitle: {
    marginTop: 10,
    fontFamily: opusFonts.mono,
    fontSize: 11,
    color: "rgba(246,244,240,0.45)",
    textAlign: "center",
    letterSpacing: 0.2,
  },
  divider: {
    width: width * 0.5,
    height: 1,
    marginVertical: 36,
    opacity: 0.4,
  },
  error: {
    marginBottom: 16,
    color: "#ff9a9a",
    fontSize: 13,
    textAlign: "center",
    maxWidth: 300,
    fontFamily: opusFonts.mono,
  },
  btnWrap: {
    width: "100%",
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: brassPalette.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 8,
  },
  btnGradient: {
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 56,
    borderRadius: 14,
  },
  btnText: {
    fontFamily: opusFonts.displayMedium,
    fontSize: 13,
    letterSpacing: 2,
    color: "#1a1208",
    textAlign: "center",
  },
  note: {
    marginTop: 28,
    textAlign: "center",
    fontFamily: opusFonts.mono,
    fontSize: 10,
    lineHeight: 16,
    color: "rgba(246,244,240,0.3)",
    letterSpacing: 0.1,
  },
});
