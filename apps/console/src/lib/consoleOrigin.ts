/** Public origin for absolute links in console emails (must match `AUTH_URL` / compose override). */
export function consolePublicOrigin(): string {
  return (process.env["AUTH_URL"] ?? "http://localhost:3010").replace(/\/$/, "");
}
