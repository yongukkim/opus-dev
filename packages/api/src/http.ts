import axios, { type AxiosInstance } from "axios";

export type CreateHttpClientOptions = {
  baseURL: string;
  /**
   * KO: Authorization 헤더용 JWT를 반환한다. 이 패키지에 시크릿을 저장하지 않는다.
   * JA: Authorization ヘッダー用の JWT を返す。本パッケージにシークレットを保持しない。
   * EN: Returns JWT for the Authorization header; never persist secrets in this package.
   */
  getAccessToken?: () => string | undefined;
};

/**
 * OPUS 공용 HTTP 클라이언트 / OPUS 共通 HTTP クライアント / Shared HTTP client for OPUS apps.
 *
 * ISO 27001: A.9.4.2, A.13.1.3 · CLAUDE.md §2, §6
 * KO: 제공된 경우에만 Bearer 토큰을 붙이고, 이 레이어에 비밀을 두지 않는다. TLS·게이트웨이·속도 제한은 배포·서버에서 이행한다.
 * JA: 提供時のみ Bearer トークンを付与し、本層にシークレットを置かない。TLS・ゲートウェイ・レート制限はデプロイとサーバー側で実施する。
 * EN: Attaches Bearer token when provided; no secret storage here. TLS, gateway, and rate limits are enforced at deploy and server (SECURITY_GOVERNANCE.md §1, §3).
 */
export function createHttpClient(options: CreateHttpClientOptions): AxiosInstance {
  const client = axios.create({
    baseURL: options.baseURL,
    timeout: 30_000,
    headers: { "Content-Type": "application/json" },
    withCredentials: true,
  });

  client.interceptors.request.use((config) => {
    const token = options.getAccessToken?.();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  return client;
}
