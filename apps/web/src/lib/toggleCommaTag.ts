/** Split tags like the tags `<input>` hint: comma-separated, trim empties. */
export function splitCommaTags(s: string): string[] {
  return s
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

function joinCommaTags(parts: string[]): string {
  return parts.join(", ");
}

/**
 * Toggle `keyword` in a comma-separated tag string (exact match after trim).
 * KO: 태그 문자열에서 키워드를 추가하거나 제거한다.
 * JA: カンマ区切りタグにキーワードを追加/削除する。
 * EN: Add or remove an exact keyword token in a comma-separated tag list.
 */
export function toggleCommaTag(current: string, keyword: string): string {
  const k = keyword.trim();
  if (!k) return current.trim();
  const parts = splitCommaTags(current);
  const idx = parts.findIndex((p) => p === k);
  if (idx >= 0) {
    parts.splice(idx, 1);
    return joinCommaTags(parts);
  }
  return joinCommaTags([...parts, k]);
}

export function commaTagsContain(current: string, keyword: string): boolean {
  const k = keyword.trim();
  if (!k) return false;
  return splitCommaTags(current).some((p) => p === k);
}
