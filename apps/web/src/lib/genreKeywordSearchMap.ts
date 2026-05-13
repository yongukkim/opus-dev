import {
  GENRE_QUICK_KEYWORDS_EN,
  GENRE_QUICK_KEYWORDS_JA,
  GENRE_QUICK_KEYWORDS_KO,
  GENRE_QUICK_ROW_TARGET_GENRE,
} from "@/lib/genreQuickKeywords";
import { OPUS_ARTWORK_GENRE_KEYS } from "@/lib/opusArtworkGenres";

function normKey(s: string): string {
  return s.normalize("NFC").trim().toLowerCase();
}

function buildKeywordToGenreSlugMap(): Map<string, string> {
  const m = new Map<string, string>();
  const n = GENRE_QUICK_ROW_TARGET_GENRE.length;
  const reg = (kw: string, genre: string) => {
    const k = normKey(kw);
    if (k) m.set(k, genre);
  };
  for (let i = 0; i < n; i++) {
    const g = GENRE_QUICK_ROW_TARGET_GENRE[i]!;
    reg(GENRE_QUICK_KEYWORDS_KO[i]!, g);
    reg(GENRE_QUICK_KEYWORDS_JA[i]!, g);
    reg(GENRE_QUICK_KEYWORDS_EN[i]!, g);
  }
  for (const slug of OPUS_ARTWORK_GENRE_KEYS) {
    m.set(normKey(slug), slug);
  }
  return m;
}

let cachedMap: ReadonlyMap<string, string> | null = null;

export function getQuickKeywordToGenreSlugMap(): ReadonlyMap<string, string> {
  if (!cachedMap) cachedMap = buildKeywordToGenreSlugMap();
  return cachedMap;
}

/** All contiguous token joins (and full trimmed query) for keyword lookup. */
function lookupCandidatesFromQuery(query: string): Set<string> {
  const out = new Set<string>();
  const q = query.trim();
  if (!q) return out;
  out.add(normKey(q));
  const parts = q.split(/\s+/).filter(Boolean);
  for (let i = 0; i < parts.length; i++) {
    for (let j = i; j < parts.length; j++) {
      out.add(normKey(parts.slice(i, j + 1).join(" ")));
    }
  }
  for (const seg of q.split(",")) {
    const t = seg.trim();
    if (!t) continue;
    out.add(normKey(t));
    const ps = t.split(/\s+/).filter(Boolean);
    for (let i = 0; i < ps.length; i++) {
      for (let j = i; j < ps.length; j++) {
        out.add(normKey(ps.slice(i, j + 1).join(" ")));
      }
    }
  }
  return out;
}

/**
 * When the search box matches quick-pick vocabulary (any locale) or a genre slug,
 * returns OPUS `genre` field values to OR-match against indexed submissions/listings.
 * KO: 빠른 키워드·장르 슬러그가 질의에 포함되면 해당 장르 슬러그 집합을 돌려준다.
 * JA: クイックキーワードやジャンルスラッグがクエリに含まれる場合、OR 一致用のスラッグ集合を返す。
 * EN: If the query hits a quick keyword or genre slug, return the genre slug set for OR matching.
 */
export function collectGenreSlugsFromKeywordQuery(query: string): Set<string> | null {
  const map = getQuickKeywordToGenreSlugMap();
  const hits = new Set<string>();
  for (const c of lookupCandidatesFromQuery(query)) {
    const g = map.get(c);
    if (g) hits.add(g);
  }
  return hits.size > 0 ? hits : null;
}
