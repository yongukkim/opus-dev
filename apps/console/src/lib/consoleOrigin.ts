/** Public origin for absolute links in console emails (must match `AUTH_URL` / compose override). */
export function consolePublicOrigin(): string {
  // CONSOLE_PUBLIC_ORIGIN takes precedence; AUTH_URL is set by compose but may not be
  // visible in server actions if Next inlines env at build time.
  return (
    process.env["CONSOLE_PUBLIC_ORIGIN"] ??
    process.env["AUTH_URL"] ??
    "http://localhost:3010"
  ).replace(/\/$/, "");
}
