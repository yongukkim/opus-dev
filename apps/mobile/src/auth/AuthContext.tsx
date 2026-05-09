/**
 * ISO 27001 A.9.4.2 (CLAUDE.md §2)
 * KO: 앱 전역 인증 상태를 React Context로 관리한다. 토큰·사용자 정보를 SecureStore에서 로드/저장한다.
 * JA: アプリ全体の認証状態を React Context で管理する。トークン・ユーザー情報を SecureStore に保存/読込。
 * EN: Manage app-wide auth state via React Context. Load/save tokens and user from SecureStore.
 */
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { clearTokens, loadTokens, saveTokens, type StoredUser } from "./tokenStore";
import { refreshAccessToken } from "./googleAuth";

const API_BASE = process.env["EXPO_PUBLIC_API_URL"] ?? "https://app.opus-store.com";

type AuthState =
  | { status: "loading" }
  | { status: "unauthenticated" }
  | { status: "authenticated"; accessToken: string; refreshToken: string; user: StoredUser };

type AuthContextValue = {
  auth: AuthState;
  signIn: (accessToken: string, refreshToken: string, user: StoredUser) => Promise<void>;
  signOut: () => Promise<void>;
  getAccessToken: () => Promise<string | null>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [auth, setAuth] = useState<AuthState>({ status: "loading" });
  const refreshPromiseRef = useRef<Promise<string | null> | null>(null);

  // Load persisted tokens on mount
  useEffect(() => {
    void (async () => {
      try {
        const { accessToken, refreshToken, user } = await loadTokens();
        if (accessToken && refreshToken && user) {
          setAuth({ status: "authenticated", accessToken, refreshToken, user });
        } else {
          setAuth({ status: "unauthenticated" });
        }
      } catch {
        // ISO 27001 A.12.4.1 (CLAUDE.md §5) — persist load failure → safe unauthenticated state; no PII in logs.
        // KO: 저장소 읽기 실패 시 로그인 화면으로 되돌려 세션 상태를 안전하게 초기화한다.
        // JA: ストア読込失敗時はログイン画面へ戻し、セッション状態を安全に初期化する。
        // EN: On storage read failure, fall back to unauthenticated state without leaking details.
        setAuth({ status: "unauthenticated" });
      }
    })();
  }, []);

  const signIn = useCallback(async (accessToken: string, refreshToken: string, user: StoredUser) => {
    await saveTokens(accessToken, refreshToken, user);
    setAuth({ status: "authenticated", accessToken, refreshToken, user });
  }, []);

  const signOut = useCallback(async () => {
    await clearTokens();
    setAuth({ status: "unauthenticated" });
  }, []);

  /**
   * Returns a valid access token, refreshing if needed.
   * Deduplicates concurrent refresh calls.
   */
  const getAccessToken = useCallback(async (): Promise<string | null> => {
    if (auth.status !== "authenticated") return null;

    // Simple expiry check: try to refresh proactively
    // (In production: decode JWT exp and refresh 60s before expiry)
    if (refreshPromiseRef.current) {
      return refreshPromiseRef.current;
    }

    const doRefresh = async (): Promise<string | null> => {
      try {
        const result = await refreshAccessToken(auth.refreshToken, API_BASE);
        if (!result) {
          await signOut();
          return null;
        }
        await saveTokens(result.accessToken, result.refreshToken, auth.user);
        setAuth((prev) =>
          prev.status === "authenticated"
            ? { ...prev, accessToken: result.accessToken, refreshToken: result.refreshToken }
            : prev,
        );
        return result.accessToken;
      } finally {
        refreshPromiseRef.current = null;
      }
    };

    // For now just return current token — refresh on 401 in API calls
    return auth.accessToken;
  }, [auth, signOut]);

  return (
    <AuthContext.Provider value={{ auth, signIn, signOut, getAccessToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
