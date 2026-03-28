import type { Metadata } from "next";
import Link from "next/link";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { getDictionary } from "@/i18n/catalog";
import { normalizeLocale, withLocale } from "@/i18n/paths";
import { renderSimpleMarkdown } from "@/lib/renderSimpleMarkdown";

type Props = { params: Promise<{ locale: string }> };

async function loadPrivacyPolicyMd(): Promise<string | null> {
  try {
    const filePath = path.join(process.cwd(), "public", "docs", "privacy-policy.md");
    return await readFile(filePath, "utf8");
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale = normalizeLocale(raw);
  const d = getDictionary(locale);
  return {
    title: d.meta.privacyTitle,
    description: d.meta.privacyDescription,
  };
}

export default async function PrivacyPage({ params }: Props) {
  const { locale: raw } = await params;
  const locale = normalizeLocale(raw);
  const m = getDictionary(locale);
  const p = m.legalPrivacy;
  const mdRaw = locale === "ko" ? await loadPrivacyPolicyMd() : null;
  const md = mdRaw?.trim() ? mdRaw : null;

  return (
    <main className="mx-auto max-w-3xl px-6 pb-16 pt-[calc(6.5rem+2.5rem)] text-opus-warm/80">
      <Link
        href={withLocale(locale, "/")}
        className="text-sm text-opus-warm/70 underline-offset-4 hover:text-opus-gold hover:underline"
      >
        {p.back}
      </Link>
      <p className="opus-text-metallic-soft mt-8 font-mono text-[0.65rem] uppercase tracking-[0.28em]">OPUS</p>

      {md ? (
        <div className="mt-6 rounded-xl border border-white/[0.08] bg-opus-slate/15 p-6 md:p-8">
          {renderSimpleMarkdown(md)}
        </div>
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
