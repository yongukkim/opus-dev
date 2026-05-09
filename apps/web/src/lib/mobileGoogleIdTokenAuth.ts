import { prisma } from "@/lib/prisma";
import { signMobileAccessToken, signMobileRefreshToken } from "@/lib/mobileAuthToken";

type GoogleTokenInfo = { sub: string; email: string; email_verified: string; aud: string };

export type MobileAuthFromGoogleOk = {
  ok: true;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: {
    id: string;
    email: string;
    name: string | null;
    image: string | null;
    role: "collector" | "artist" | "operator";
  };
};

export type MobileAuthFromGoogleErr = { ok: false; error: string; status: number };

/**
 * ISO 27001 A.9.4.2 / A.14.2.1 (CLAUDE.md §2, §1)
 * KO: Google id_token을 tokeninfo로 검증한 뒤 모바일 access/refresh를 발급한다(공통 로직).
 * JA: Google id_token を tokeninfo で検証後、モバイル access/refresh を発行する（共通）。
 * EN: Verify Google id_token via tokeninfo, then issue mobile access/refresh (shared path).
 */
export async function issueMobileAuthFromGoogleIdToken(
  idToken: string,
): Promise<MobileAuthFromGoogleOk | MobileAuthFromGoogleErr> {
  const trimmed = idToken.trim();
  if (!trimmed) {
    return { ok: false, error: "id_token_required", status: 400 };
  }

  let googlePayload: GoogleTokenInfo | null = null;
  try {
    const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(trimmed)}`);
    if (!res.ok) {
      return { ok: false, error: "invalid_id_token", status: 401 };
    }
    googlePayload = (await res.json()) as GoogleTokenInfo;
  } catch {
    return { ok: false, error: "google_verify_failed", status: 502 };
  }

  if (!googlePayload?.email || googlePayload.email_verified !== "true") {
    return { ok: false, error: "email_not_verified", status: 401 };
  }

  const clientId = process.env["AUTH_GOOGLE_ID"]?.trim();
  if (clientId && googlePayload.aud !== clientId) {
    return { ok: false, error: "invalid_audience", status: 401 };
  }

  const email = googlePayload.email.trim().toLowerCase();

  const user = await prisma.user.upsert({
    where: { email },
    create: {
      email,
      emailVerified: new Date(),
      role: "COLLECTOR",
    },
    update: { emailVerified: new Date() },
    select: { id: true, role: true, email: true, name: true, image: true },
  });

  const roleMap: Record<string, "collector" | "artist" | "operator"> = {
    COLLECTOR: "collector",
    ARTIST: "artist",
    OPERATOR: "operator",
  };
  const role = roleMap[user.role] ?? "collector";

  const accessToken = signMobileAccessToken(user.id, role, user.email ?? email);
  const refreshToken = signMobileRefreshToken(user.id);

  return {
    ok: true,
    accessToken,
    refreshToken,
    expiresIn: 900,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
      role,
    },
  };
}
