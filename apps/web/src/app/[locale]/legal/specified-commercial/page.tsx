import type { Metadata } from "next";
import Link from "next/link";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { type Locale, locales } from "@/i18n/config";
import { normalizeLocale, withLocale } from "@/i18n/paths";
import { renderLegalMarkdown } from "@/lib/renderLegalMarkdown";

type Props = { params: Promise<{ locale: string }> };

/**
 * "特定商取引法に基づく表記" (Japan Specified Commercial Transactions Act
 * §11 notice).
 *
 * The statute is Japanese law; the Japanese version of the notice is the
 * authoritative original. Korean and English files are courtesy translations
 * that each carry a prominent disclaimer pointing back to the Japanese
 * original. If a locale file is missing, we fall back to the Japanese
 * original so the legally-required information is never absent.
 *
 * KO: 特商法은 일본 관할 법이며, 일본어 파일이 정본이다. KO/EN 파일은
 *     참고용 번역이고 각 파일에 "일본어 원본이 우선"임을 명시한다. 누락 시
 *     일본어 원본으로 폴백해 법적 고지 공백을 방지한다.
 * JA: 特商法は日本法であり、日本語原本が正本。KO/EN は参考訳で原本優先の
 *     表示を含む。未翻訳時は日本語原本へフォールバックする。
 * EN: The statute is Japanese; the Japanese file is authoritative. KO/EN are
 *     courtesy translations with prominent disclaimers. Missing locale files
 *     fall back to the Japanese original so the §11 disclosure is never blank.
 *
 * ISO 27001 A.18.1.4 / CLAUDE.md §5, §7 — statutory disclosure must reach the
 * consumer in a readable form, not as raw markdown, with original-language
 * authority preserved.
 */
async function loadSpecifiedCommercialMd(
  locale: Locale,
): Promise<{ content: string; servedLocale: Locale; isFallback: boolean } | null> {
  const tryOrder: Locale[] = [locale, "ja"];
  const seen = new Set<Locale>();
  for (const loc of tryOrder) {
    if (seen.has(loc)) continue;
    seen.add(loc);
    try {
      const filePath = path.join(
        process.cwd(),
        "public",
        "docs",
        `specified-commercial.${loc}.md`,
      );
      const content = await readFile(filePath, "utf8");
      if (content.trim()) {
        return {
          content,
          servedLocale: loc,
          isFallback: loc !== locale,
        };
      }
    } catch {
      continue;
    }
  }
  return null;
}

const META: Record<Locale, { title: string; description: string }> = {
  ko: {
    title: "특정상거래법에 기초한 표기 | OPUS",
    description:
      "OPUS는 일본 거주 이용자를 위하여 「특정상거래법」 제11조에 따른 통신판매 사업자 표시를 제공합니다. 한국어 페이지는 참고용 번역이며 일본어 원본이 정본입니다.",
  },
  ja: {
    title: "特定商取引法に基づく表記 | OPUS",
    description:
      "OPUS は日本「特定商取引に関する法律」第 11 条に基づき通信販売業者の表示を行います。",
  },
  en: {
    title: "Notice under Japan's Specified Commercial Transactions Act | OPUS",
    description:
      "Mail-order business notice required by Article 11 of Japan's Act on Specified Commercial Transactions. English page is a courtesy translation; the Japanese original is authoritative.",
  },
};

const LABELS: Record<Locale, { back: string; stub: string }> = {
  ko: {
    back: "← 홈으로",
    stub: "특상법 표기 문서를 불러오지 못했습니다.",
  },
  ja: {
    back: "← ホームへ",
    stub: "特定商取引法に基づく表記の読み込みに失敗しました。",
  },
  en: {
    back: "← Home",
    stub: "The specified-commercial notice could not be loaded.",
  },
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale = normalizeLocale(raw);
  return {
    title: META[locale].title,
    description: META[locale].description,
  };
}

export default async function SpecifiedCommercialPage({ params }: Props) {
  const { locale: raw } = await params;
  const locale: Locale = normalizeLocale(raw);
  const l = LABELS[locale];
  const loaded = await loadSpecifiedCommercialMd(locale);

  return (
    <main className="mx-auto max-w-3xl px-6 pb-16 pt-[calc(6.5rem+2.5rem)] text-opus-warm/80">
      <Link
        href={withLocale(locale, "/")}
        className="text-sm text-opus-warm/70 underline-offset-4 hover:text-opus-gold hover:underline"
      >
        {l.back}
      </Link>
      <p className="opus-text-metallic-soft mt-8 font-mono text-[0.65rem] uppercase tracking-[0.28em]">
        OPUS
      </p>

      {loaded ? (
        <>
          {loaded.isFallback ? (
            <FallbackBanner
              requestedLocale={locale}
              servedLocale={loaded.servedLocale}
            />
          ) : null}
          <div className="mt-6 rounded-xl border border-white/[0.08] bg-opus-slate/15 p-6 md:p-8">
            {renderLegalMarkdown(loaded.content)}
          </div>
        </>
      ) : (
        <div className="mt-6 rounded-xl border border-white/[0.08] bg-opus-slate/15 p-6">
          <p className="font-sans text-sm leading-relaxed text-opus-warm/70">
            {l.stub}
          </p>
        </div>
      )}
    </main>
  );
}

/**
 * Shown when the requested locale's translation has not yet been published
 * and the Japanese authoritative original is served instead. Explains the
 * authority hierarchy to the visitor in their requested language.
 *
 * KO: 요청 언어의 번역이 없어 일본어 정본을 보여줄 때, 권위 관계를
 *     이용자의 언어로 설명한다.
 * JA: 要求言語の翻訳が未公開で日本語正本を表示している旨を、利用者の言語で
 *     明示する。
 * EN: Discloses that the authoritative Japanese text is shown because the
 *     requested-locale translation is not available.
 */
function FallbackBanner({
  requestedLocale,
  servedLocale,
}: {
  requestedLocale: Locale;
  servedLocale: Locale;
}) {
  const validRequest = locales.includes(requestedLocale) ? requestedLocale : "ja";
  const validServed = locales.includes(servedLocale) ? servedLocale : "ja";
  const messages: Record<Locale, string> = {
    ko: `요청하신 언어(${validRequest.toUpperCase()})의 참고용 번역본이 아직 공개되지 않아, 일본어 정본(${validServed.toUpperCase()})을 그대로 표시합니다.`,
    ja: `ご要望の言語（${validRequest.toUpperCase()}）の参考訳はまだ公開されていないため、日本語の正本（${validServed.toUpperCase()}）をそのまま表示しています。`,
    en: `A courtesy translation for ${validRequest.toUpperCase()} is not yet published; the authoritative Japanese (${validServed.toUpperCase()}) original is shown instead.`,
  };
  return (
    <div className="mt-6 rounded-lg border border-opus-gold/30 bg-opus-slate/20 px-4 py-3 text-xs leading-relaxed text-opus-warm/75">
      {messages[requestedLocale] ?? messages.en}
    </div>
  );
}
