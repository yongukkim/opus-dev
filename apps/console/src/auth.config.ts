import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

const useGoogle =
  Boolean(process.env["AUTH_GOOGLE_ID"]?.trim()) &&
  Boolean(process.env["AUTH_GOOGLE_SECRET"]?.trim());

/** Used only in `auth.ts` (Node). Middleware keeps `authConfig.providers` empty so the Edge bundle stays small. */
export const googleAuthProviders = useGoogle
  ? [
      Google({
        clientId: process.env["AUTH_GOOGLE_ID"]!,
        clientSecret: process.env["AUTH_GOOGLE_SECRET"]!,
      }),
    ]
  : [];

export const authConfig = {
  trustHost: true,
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 30 },
  providers: [],
} satisfies NextAuthConfig;
