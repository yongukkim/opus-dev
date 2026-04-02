export const OPUS_ARTIST_KYC_COOKIE = "opus_artist_kyc";

export type ArtistKycStatus = "pending" | "verified";

export function parseArtistKycCookie(raw: string | undefined): ArtistKycStatus {
  return raw === "verified" ? "verified" : "pending";
}

export function getArtistKycFromCookies(cookieStore: {
  get(name: string): { value: string } | undefined;
}): ArtistKycStatus {
  return parseArtistKycCookie(cookieStore.get(OPUS_ARTIST_KYC_COOKIE)?.value);
}

