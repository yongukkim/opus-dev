/** Cookie until real SSO/RBAC wires Vault; mirrors `readActorFromRequest` roles for UI. */
export const OPUS_VAULT_UI_ROLE_COOKIE = "opus_vault_ui_role";

export type VaultUiRole = "collector" | "artist";

export function parseVaultUiRoleCookie(raw: string | undefined): VaultUiRole {
  return raw === "artist" ? "artist" : "collector";
}

export function getVaultUiRoleFromCookies(cookieStore: {
  get(name: string): { value: string } | undefined;
}): VaultUiRole {
  return parseVaultUiRoleCookie(cookieStore.get(OPUS_VAULT_UI_ROLE_COOKIE)?.value);
}
