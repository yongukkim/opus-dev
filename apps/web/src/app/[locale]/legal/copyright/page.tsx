import type { Metadata } from "next";
import Link from "next/link";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { getDictionary } from "@/i18n/catalog";
import { type Locale, locales } from "@/i18n/config";
import { normalizeLocale, withLocale } from "@/i18n/paths";
import { renderLegalMarkdown } from "@/lib/renderLegalMarkdown";

type Props = { params: Promise<{ locale: string }> };

/**
 * Loads locale-specific copyright & permitted-use markdown. Falls back to
 * Korean (authoritative draft) when a translation file is missing.
 *
 * ISO 27001 A.18.1.4 — transparency of published legal-style notices (KO/JA/EN).
 */
async function loadCopyrightMd(
  locale: Locale,
): Promise<{ content: string; servedLocale: Locale; isFallback: boolean } | null> {
  const tryOrder: Locale[] = [locale, "ko"];
  const seen = new Set<Locale>();
  for (const loc of tryOrder) {
    if (seen.has(loc)) continue;
    seen.add(loc);
    try {
      const filePath = path.join(
        process.cwd(),
        "public",
        "docs",
        `copyright-and-license.${loc}.md`,
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

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale = normalizeLocale(raw);
  const d = getDictionary(locale);
  return {
    title: d.meta.copyrightTitle,
    description: d.meta.copyrightDescription,
  };
}

export default async function LegalCopyrightPage({ params }: Props) {
  const { locale: raw } = await params;
  const locale = normalizeLocale(raw);
  const m = getDictionary(locale);
  const p = m.legalCopyright;
  const loaded = await loadCopyrightMd(locale);

  return (
    <main className="mx-auto max-w-3xl px-6 pb-16 pt-[calc(6.5rem+2.5rem)] text-opus-warm/80">
      <Link
        href={withLocale(locale, "/")}
        className="text-sm text-opus-warm/70 underline-offset-4 hover:text-opus-gold hover:underline"
      >
        {p.back}
      </Link>
      <p className="opus-text-metallic-soft mt-8 font-mono text-[0.65rem] uppercase tracking-[0.28em]">
        OPUS
      </p>

      {loaded ? (
        <>
          {loaded.isFallback ? (
            <FallbackBanner requestedLocale={locale} servedLocale={loaded.servedLocale} />
          ) : null}
          <div className="mt-6 rounded-xl border border-white/[0.08] bg-opus-slate/15 p-6 md:p-8">
            {renderLegalMarkdown(loaded.content)}
          </div>
        </>
      ) : (
        <>
          <h1 className="mt-3 font-display text-2xl text-opus-warm md:text-3xl">{p.title}</h1>
          <p className="mt-4 font-sans text-sm leading-relaxed text-opus-warm/60">{p.lead}</p>
          <div className="mt-8 rounded-xl border border-white/[0.08] bg-opus-slate/15 p-6">
            <p className="font-sans text-sm leading-relaxed text-opus-warm/70">{p.body}</p>
          </div>
        </>
      )}
    </main>
  );
}

function FallbackBanner({
  requestedLocale,
  servedLocale,
}: {
  requestedLocale: Locale;
  servedLocale: Locale;
}) {
  const validRequest = locales.includes(requestedLocale) ? requestedLocale : "ko";
  const validServed = locales.includes(servedLocale) ? servedLocale : "ko";
  const messages: Record<Locale, string> = {
    ko: `요청하신 언어(${validRequest.toUpperCase()})의 번역본이 아직 공개되지 않아, 정본(${validServed.toUpperCase()})을 표시합니다.`,
    ja: `ご要望の言語（${validRequest.toUpperCase()}）の翻訳はまだ公開されていないため、正本（${validServed.toUpperCase()}）を表示しています。`,
    en: `A translation for ${validRequest.toUpperCase()} is not yet published; the authoritative ${validServed.toUpperCase()} version is shown instead.`,
  };
  return (
    <div className="mt-6 rounded-lg border border-opus-gold/30 bg-opus-slate/20 px-4 py-3 text-xs leading-relaxed text-opus-warm/75">
      {messages[requestedLocale] ?? messages.en}
    </div>
  );
}
