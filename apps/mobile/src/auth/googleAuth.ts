/**
 * ISO 27001 A.9.4.2 (CLAUDE.md §2)
 * KO: Google PKCE OAuth 흐름 처리 및 id_token을 웹 API와 교환한다.
 * JA: Google PKCE OAuth を処理し id_token を Web API と交換する。
 * EN: Handle Google PKCE OAuth and exchange id_token for app Bearer tokens.
 *
 * NOTE: expo-auth-session and expo-web-browser are required.
 * Install with: npx expo install expo-auth-session expo-web-browser
 */
import { Platform } from "react-native";
import type { StoredUser } from "./tokenStore";

export type GoogleAuthResult =
  | { ok: true; accessToken: string; refreshToken: string; user: StoredUser }
  | { ok: false; error: string };

/**
 * Web (Expo Metro): Google "Web application" clients require client_secret at token endpoint —
 * performed on OPUS API with AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET (ISO A.10.1.1).
 */
async function exchangeGoogleCodeViaOpusApi(
  code: string,
  codeVerifier: string,
  redirectUri: string,
  apiBase: string,
): Promise<GoogleAuthResult> {
  try {
    const appRes = await fetch(`${apiBase}/api/mobile/auth/google/code`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, redirectUri, codeVerifier }),
    });
    const data = (await appRes.json().catch(() => ({}))) as {
      ok?: boolean;
      error?: string;
      accessToken?: string;
      refreshToken?: string;
      user?: { id: string; email: string; name: string | null; role: string };
    };
    if (!appRes.ok || !data.ok || !data.accessToken || !data.refreshToken || !data.user?.id) {
      return { ok: false, error: typeof data.error === "string" ? data.error : "app_token_exchange_failed" };
    }
    return {
      ok: true,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      user: {
        id: data.user.id,
        email: data.user.email,
        name: data.user.name ?? null,
        role: (data.user.role as StoredUser["role"]) ?? "collector",
      },
    };
  } catch (e) {
    if (__DEV__) console.warn("[exchangeGoogleCodeViaOpusApi]", apiBase, e);
    return { ok: false, error: "app_network_error" };
  }
}

/**
 * Exchange Google authorization code for app tokens.
 */
export async function exchangeGoogleCode(
  code: string,
  codeVerifier: string,
  redirectUri: string,
  apiBase: string,
  googleClientId: string,
): Promise<GoogleAuthResult> {
  if (Platform.OS === "web") {
    return exchangeGoogleCodeViaOpusApi(code, codeVerifier, redirectUri, apiBase);
  }

  // Native: public client + PKCE — token exchange without client_secret (Google iOS/Android client types).

  // Step 1: Exchange code for Google tokens
  let idToken: string;
  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: googleClientId,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
        code_verifier: codeVerifier,
      }).toString(),
    });

    if (!tokenRes.ok) {
      const err = (await tokenRes.json().catch(() => ({}))) as { error?: string };
      return { ok: false, error: err.error ?? "google_token_exchange_failed" };
    }

    const data = (await tokenRes.json()) as { id_token?: string };
    if (!data.id_token) return { ok: false, error: "no_id_token" };
    idToken = data.id_token;
  } catch {
    return { ok: false, error: "google_network_error" };
  }

  // Step 2: Exchange id_token for app tokens
  try {
    const appRes = await fetch(`${apiBase}/api/mobile/auth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    });

    if (!appRes.ok) {
      const err = (await appRes.json().catch(() => ({}))) as { error?: string };
      return { ok: false, error: err.error ?? "app_token_exchange_failed" };
    }

    const data = (await appRes.json()) as {
      ok: boolean;
      accessToken: string;
      refreshToken: string;
      user: { id: string; email: string; name: string | null; role: string };
    };

    return {
      ok: true,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      user: {
        id: data.user.id,
        email: data.user.email,
        name: data.user.name ?? null,
        role: (data.user.role as StoredUser["role"]) ?? "collector",
      },
    };
  } catch {
    return { ok: false, error: "app_network_error" };
  }
}

/**
 * Refresh access token using stored refresh token.
 */
export async function refreshAccessToken(
  refreshToken: string,
  apiBase: string,
): Promise<{ accessToken: string; refreshToken: string } | null> {
  try {
    const res = await fetch(`${apiBase}/api/mobile/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { accessToken: string; refreshToken: string };
    return data;
  } catch {
    return null;
  }
}
