/**
 * Public origin of the operator console (separate host from the storefront).
 * ISO 27001 A.13.1.3 (CLAUDE.md §6) — split storefront vs operator ingress; links must not assume same host.
 * KO: 스토어와 다른 콘솔 호스트 URL을 한 곳에서 조합한다.
 * JA: ストアとは別ホストのコンソールURLをここで組み立てる。
 * EN: Centralize the console public origin so storefront pages link to the correct host.
 */
export function getOpusConsoleOrigin(): string {
  const fromEnv = process.env["NEXT_PUBLIC_OPUS_CONSOLE_ORIGIN"]?.trim();
  if (fromEnv) {
    return fromEnv.replace(/\/$/, "");
  }
  if (process.env["NODE_ENV"] === "development") {
    return "http://localhost:3010";
  }
  return "https://console.opus-store.com";
}

/** Locale-prefixed review queue (primary operator artwork review). */
export function getOpusConsoleReviewUrl(locale: string): string {
  const safe = locale.replace(/^\/+|\/+$/g, "") || "en";
  return `${getOpusConsoleOrigin()}/${safe}/review`;
}
