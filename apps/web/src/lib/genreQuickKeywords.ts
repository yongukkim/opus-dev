import type { Locale } from "@/i18n/config";
import type { OpusArtworkGenreKey } from "@/lib/opusArtworkGenres";

/** Curated quick-pick tags for artwork / transfer forms (locale-specific display). */
export const GENRE_QUICK_KEYWORDS_KO = [
  "미소녀",
  "미소년",
  "이케멘",
  "BL",
  "GL",
  "창작 캐릭터",
  "모에",
  "버추얼",
  "이세계",
  "사이버펑크",
  "레트로 퓨처리즘",
  "스팀펑크",
  "다크 판타지",
  "일상물",
  "동양풍/요괴",
  "픽셀 아트",
  "시티 팝",
  "테크웨어",
  "로파이",
  "디스토피아",
  "그로테스크",
] as const;

export const GENRE_QUICK_KEYWORDS_JA = [
  "美少女",
  "美少年",
  "イケメン",
  "BL",
  "GL",
  "オリジナルキャラクター",
  "萌え",
  "バーチャル",
  "異世界",
  "サイバーパンク",
  "レトロフューチャリズム",
  "スチームパンク",
  "ダークファンタジー",
  "日常系",
  "東洋風/妖怪",
  "ピクセルアート",
  "シティポップ",
  "テックウェア",
  "ローファイ",
  "ディストピア",
  "グロテスク",
] as const;

export const GENRE_QUICK_KEYWORDS_EN = [
  "Bishoujo",
  "Bishounen",
  "Ikemen",
  "BL",
  "GL",
  "Original Character",
  "Moe",
  "Virtual",
  "Isekai",
  "Cyberpunk",
  "Retro-futurism",
  "Steampunk",
  "Dark Fantasy",
  "Slice of Life",
  "Folklore/Yokai",
  "Pixel Art",
  "City Pop",
  "Techwear",
  "Lo-fi",
  "Dystopian",
  "Grotesque",
] as const;

/**
 * Same row index as `GENRE_QUICK_KEYWORDS_{KO,JA,EN}` — omni-search maps any of those
 * display strings to this OPUS genre slug (submission / listing `genre` field).
 */
export const GENRE_QUICK_ROW_TARGET_GENRE: readonly OpusArtworkGenreKey[] = [
  "anime-style",
  "anime-style",
  "anime-style",
  "manga-style",
  "manga-style",
  "character-art",
  "anime-style",
  "anime-style",
  "sf",
  "sf",
  "sf",
  "sf",
  "sf",
  "anime-style",
  "manga-style",
  "pixel-art",
  "anime-style",
  "sf",
  "anime-style",
  "sf",
  "manga-style",
];

export function genreQuickKeywordsForLocale(locale: Locale): readonly string[] {
  switch (locale) {
    case "ko":
      return GENRE_QUICK_KEYWORDS_KO;
    case "ja":
      return GENRE_QUICK_KEYWORDS_JA;
    default:
      return GENRE_QUICK_KEYWORDS_EN;
  }
}
