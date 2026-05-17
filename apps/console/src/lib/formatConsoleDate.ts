export function formatConsoleDate(locale: string, iso: string): string {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat(locale, { year: "numeric", month: "short", day: "numeric" }).format(new Date(iso));
  } catch {
    return "—";
  }
}

export function formatConsoleDateTime(locale: string, iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return "—";
  }
}
