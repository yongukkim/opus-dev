import {
  storefrontAppleCredentials,
  storefrontGoogleConfigured,
  storefrontLineCredentials,
} from "@/lib/storefrontOAuthEnv";

/**
 * ISO 27001 A.9.4.2 (§2) — runtime OAuth client availability for storefront UI (no secrets exposed).
 * KO: 런타임 환경변수 존재 여부만으로 버튼 활성화를 판단한다(시크릿 값은 노출하지 않음).
 * JA: ランタイム環境変数の有無のみでボタン可否を判定する(秘密値は出さない)。
 * EN: Gate buttons on presence of runtime env vars only — never expose secret values.
 */
export type StorefrontSsoConfigured = {
  google: boolean;
  apple: boolean;
  line: boolean;
};

export function storefrontSsoConfigured(): StorefrontSsoConfigured {
  return {
    google: storefrontGoogleConfigured(),
    apple: storefrontAppleCredentials() != null,
    line: storefrontLineCredentials() != null,
  };
}
