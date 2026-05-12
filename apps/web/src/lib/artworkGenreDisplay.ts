import type { Messages } from "@/i18n/types";

/**
 * Localized label for `SubmissionRecord.genre` / listing genre slug.
 * KO: 알 수 없는(구버전) slug는 원문 slug를 그대로 보여 주어 데이터를 잃지 않습니다.
 * JA: 未知の（旧）slugはそのまま表示しデータを失いません。
 * EN: Unknown legacy slugs echo the stored slug so historical rows stay readable.
 */
export function opusArtworkGenreLabel(ct: Messages["collectorTransfer"], genre: string): string {
  const g = genre.trim();
  if (!g) return "—";
  switch (g) {
    case "illustration":
      return ct.genreOptIllustration;
    case "pixel-art":
      return ct.genreOptPixelArt;
    case "sf":
      return ct.genreOptSf;
    case "anime-style":
      return ct.genreOptAnimeStyle;
    case "manga-style":
      return ct.genreOptMangaStyle;
    case "animated-gif":
      return ct.genreOptAnimatedGif;
    case "character-art":
      return ct.genreOptCharacterArt;
    default:
      return g;
  }
}
