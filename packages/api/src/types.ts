/**
 * RBAC roles — aligned with server-side web role: artist | collector | operator.
 * Server must validate JWT claims; client types are non-authoritative.
 *
 * ISO 27001 A.9.2.1 (CLAUDE.md §4)
 * KO: 클라이언트 role 타입은 서버 웹 role과 동일하게 유지한다. 이전 "writer/admin" 값은 제거.
 * JA: クライアントの role 型はサーバーの web role と同一に保つ。旧 "writer/admin" は削除。
 * EN: Keep client role type aligned with server web role. Legacy "writer/admin" removed.
 */
export type OpusRole = "collector" | "artist" | "operator";

export type AuthUser = {
  id: string;
  email: string;
  name: string | null;
  role: OpusRole;
};

/**
 * APPI / PII: surface only fields required for UI; never log raw PII from the client.
 * Server-side persistence must follow encryption / pseudonymization policies.
 */
export type PublicProfile = {
  displayName: string;
};
