/**
 * Google OAuth login screen using expo-auth-session.
 *
 * ISO 27001 A.9.4.2 (CLAUDE.md §2)
 * KO: Google OAuth PKCE 흐름으로 로그인하고 앱 Bearer 토큰을 발급받는다.
 * JA: Google OAuth PKCE フローでログインし、アプリ Bearer トークンを取得する。
 * EN: Sign in via Google OAuth PKCE and obtain app Bearer tokens.
 *
 * NOTE: Run `npx expo install expo-auth-session expo-web-browser` before building.
 */
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { exchangeGoogleCode } from "../auth/googleAuth";
import { useAuth } from "../auth/AuthContext";
import { opusColors } from "../theme/opusTheme";

const API_BASE = process.env["EXPO_PUBLIC_API_URL"] ?? "https://app.opus-store.com";
const GOOGLE_CLIENT_ID = process.env["EXPO_PUBLIC_GOOGLE_CLIENT_ID"] ?? "";

/** Lazy-load expo-auth-session to avoid import errors when package isn't installed. */
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
      console.warn("expo-auth-session or expo-web-browser not installed. Run: npx expo install expo-auth-session expo-web-browser");
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
      Alert.alert("설정 오류", "Google 로그인 모듈이 설치되지 않았습니다.\n`npx expo install expo-auth-session expo-web-browser`를 실행하세요.");
      return;
    }
    setError(null);
    setLoading(true);

    try {
      const { expoAuth, expoBrowser } = authSessionRef;

      // Use Expo auth proxy so Google web client accepts the redirect.
      // Register https://auth.expo.io/@yongukkim/opus-mobile in Google Cloud Console.
      const redirectUri = expoAuth.makeRedirectUri({
        scheme: "opus",
        useProxy: true,
      });
      const discovery = {
        authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
        tokenEndpoint: "https://oauth2.googleapis.com/token",
      };

      // Create PKCE request manually
      const request = await expoAuth.AuthRequest.buildAsync(
        {
          clientId: GOOGLE_CLIENT_ID,
          scopes: ["openid", "email", "profile"],
          redirectUri,
          usePKCE: true,
        },
        discovery,
      ).catch(() => null);

      if (!request) {
        setError("Google 로그인 요청을 만들 수 없습니다.");
        return;
      }

      const result = await request.promptAsync(discovery);

      if (result.type !== "success") {
        if (result.type !== "dismiss") {
          setError("로그인이 취소됐습니다.");
        }
        return;
      }

      const { code } = result.params as { code: string };
      const codeVerifier: string = request.codeVerifier ?? "";

      const exchangeResult = await exchangeGoogleCode(
        code,
        codeVerifier,
        redirectUri,
        API_BASE,
        GOOGLE_CLIENT_ID,
      );

      if (!exchangeResult.ok) {
        setError(`로그인 실패: ${exchangeResult.error}`);
        return;
      }

      await signIn(exchangeResult.accessToken, exchangeResult.refreshToken, exchangeResult.user);
    } catch {
      setError("오류가 발생했습니다. 다시 시도해 주세요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.root}>
      <Text style={styles.logo}>OPUS</Text>
      <Text style={styles.tagline}>복제 불가능한 디지털 아트{"\n"}인증 · 소유 · 감상</Text>
      <Text style={styles.subtitle}>구매하신 에디션을 본 앱에서만 감상할 수 있습니다.</Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable
        style={({ pressed }) => [styles.btn, pressed && styles.btnPressed, loading && styles.btnDisabled]}
        onPress={() => void handleGoogleSignIn()}
        disabled={loading}
        accessibilityRole="button"
        accessibilityLabel="Google로 로그인"
      >
        {loading ? (
          <ActivityIndicator size="small" color={opusColors.charcoal} />
        ) : (
          <Text style={styles.btnText}>Google로 계속하기</Text>
        )}
      </Pressable>

      <Text style={styles.note}>
        {API_BASE.replace("https://", "")}에서 작품을 구매한 후{"\n"}
        동일한 Google 계정으로 로그인하세요.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: opusColors.charcoal,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  logo: {
    fontSize: 48,
    letterSpacing: 10,
    color: opusColors.gold,
    fontFamily: "Georgia",
  },
  tagline: {
    marginTop: 12,
    textAlign: "center",
    fontSize: 14,
    lineHeight: 22,
    color: opusColors.warm,
    letterSpacing: 0.3,
  },
  subtitle: {
    marginTop: 8,
    textAlign: "center",
    fontSize: 12,
    color: opusColors.warmMuted,
  },
  error: {
    marginTop: 16,
    color: "#ff9a9a",
    fontSize: 13,
    textAlign: "center",
    maxWidth: 300,
  },
  btn: {
    marginTop: 40,
    width: "100%",
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: opusColors.gold,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: opusColors.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
    minHeight: 52,
  },
  btnPressed: { backgroundColor: opusColors.goldDim },
  btnDisabled: { opacity: 0.55 },
  btnText: {
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.5,
    color: opusColors.charcoal,
  },
  note: {
    marginTop: 28,
    textAlign: "center",
    fontSize: 11,
    lineHeight: 17,
    color: "rgba(246, 244, 240, 0.35)",
  },
});
