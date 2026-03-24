/**
 * RBAC roles — SECURITY_GOVERNANCE.md: strict separation of writer / collector / admin.
 * Server must validate JWT claims; client types are non-authoritative.
 */
export type OpusRole = "writer" | "collector" | "admin";

export type AuthUser = {
  id: string;
  role: OpusRole;
};

/**
 * APPI / PII: surface only fields required for UI; never log raw PII from the client.
 * Server-side persistence must follow encryption / pseudonymization policies.
 */
export type PublicProfile = {
  displayName: string;
};
