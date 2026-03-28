/**
 * Dev-oriented persistence for artist signup display name until real auth exists.
 * ISO 27001 A.18.1.4 (§7) Privacy by Design
 * KO: 표시 이름은 작가 헤더용으로만 쓰이며, 쿠키 값은 URL 인코딩·최소 보관 기간으로 제한합니다.
 * JA: 表示名は作家ヘッダ用のみに使用し、Cookie値はURLエンコード・最小保持で制限します。
 * EN: Display name is used only for the artist header; cookie value is URL-encoded and scoped with a finite max-age.
 */
export const OPUS_ARTIST_NICKNAME_COOKIE = "opus_artist_nickname";

/** Max-Age one year (seconds). */
export const OPUS_ARTIST_NICKNAME_MAX_AGE = 60 * 60 * 24 * 365;

export function encodeArtistNicknameForCookie(raw: string): string {
  return encodeURIComponent(raw.trim());
}

export function decodeArtistNicknameFromCookie(encoded: string | undefined): string {
  if (encoded == null || encoded === "") return "";
  try {
    return decodeURIComponent(encoded).trim();
  } catch {
    return "";
  }
}
