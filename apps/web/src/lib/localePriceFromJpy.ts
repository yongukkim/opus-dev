import type { Locale } from "@/i18n/config";

/**
 * ISO 27001 A.14.2.1 (§1) — display-only FX inputs are untrusted env; validate before use.
 * KO: UI 표시용 환율은 운영 환경변수로만 주입하고, 법적 확정 요율이 아님을 UI 문구로 분리합니다.
 * JA: UI表示用レートは環境変数のみで与え、法的確定レートではない旨をUI文言で分離します。
 * EN: Display rates come from env only and are not legal settlement quotes; UI copy states the basis.
 */

const DEFAULT_KRW_PER_JPY = 9.0;
const DEFAULT_JPY_PER_USD = 149;

function parseEnvPositiveFloat(name: string, fallback: number): number {
  const raw = process.env[name]?.trim();
  if (!raw) return fallback;
  const n = Number.parseFloat(raw);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return n;
}

/** Integer JPY list price, formatted for footnotes (¥ nnn). */
export function formatJpyListAmount(priceJpy: number): string {
  if (!Number.isFinite(priceJpy) || priceJpy < 0) return "";
  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
    maximumFractionDigits: 0,
  }).format(priceJpy);
}

/**
 * Primary price line for the active UI locale. Source amount is always integer JPY (list/registration).
 * KO: ko는 원화 환산 표시, en은 USD 환산, ja는 엔 그대로.
 * JA: jaは円そのまま、ko/enは参考レート換算の表示。
 * EN: ja shows JPY; ko/en show KRW/USD at configurable reference rates.
 */
export function formatListPriceForLocale(
  locale: Locale,
  priceJpy: number,
): { primary: string; listYenFormatted: string; showListBasis: boolean } {
  const listYenFormatted = formatJpyListAmount(priceJpy);
  if (!Number.isFinite(priceJpy) || priceJpy <= 0) {
    return { primary: "", listYenFormatted, showListBasis: false };
  }

  if (locale === "ja") {
    return { primary: listYenFormatted, listYenFormatted, showListBasis: false };
  }

  if (locale === "ko") {
    const krwPerJpy = parseEnvPositiveFloat("OPUS_DISPLAY_KRW_PER_JPY", DEFAULT_KRW_PER_JPY);
    const krw = Math.round(priceJpy * krwPerJpy);
    const primary = new Intl.NumberFormat("ko-KR", {
      style: "currency",
      currency: "KRW",
      maximumFractionDigits: 0,
    }).format(krw);
    return { primary, listYenFormatted, showListBasis: true };
  }

  const jpyPerUsd = parseEnvPositiveFloat("OPUS_DISPLAY_JPY_PER_USD", DEFAULT_JPY_PER_USD);
  const usd = priceJpy / jpyPerUsd;
  const primary = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(usd);
  return { primary, listYenFormatted, showListBasis: true };
}
