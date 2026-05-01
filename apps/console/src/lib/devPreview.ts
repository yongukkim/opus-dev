import type { Session } from "next-auth";

/**
 * ISO 27001 A.9.2.1 — UI-only local preview; never enable in production builds.
 * KO: OAuth 없이 로컬에서 레이아웃만 보려면 development + 명시 플래그에서만 허용한다.
 * JA: OAuthなしでローカルUI確認は development と明示フラグのときのみ許可する。
 * EN: Allow no-OAuth UI inspection only in development with an explicit env flag.
 */
export function isConsoleDevPreview(): boolean {
  if (process.env["NODE_ENV"] === "production") return false;
  return process.env["OPUS_CONSOLE_DEV_PREVIEW"] === "1";
}

/** Placeholder user for chrome shell only — not a real session; no API access. */
export function devPreviewChromeUser(): Session["user"] {
  return {
    id: "dev-preview-local",
    email: "preview@local.dev",
    name: "UI Preview",
    role: "operator",
  };
}
