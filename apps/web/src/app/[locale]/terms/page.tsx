import type { Metadata } from "next";
import Link from "next/link";
import { getDictionary } from "@/i18n/catalog";
import { normalizeLocale, withLocale } from "@/i18n/paths";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale = normalizeLocale(raw);
  const d = getDictionary(locale);
  return {
    title: d.meta.termsTitle,
    description: d.meta.termsDescription,
  };
}

export default async function TermsPage({ params }: Props) {
  const { locale: raw } = await params;
  const locale = normalizeLocale(raw);
  const m = getDictionary(locale);
  const t = m.legalTerms;

  return (
    <main className="mx-auto max-w-3xl px-6 pb-16 pt-[calc(6.5rem+2.5rem)] text-opus-warm/80">
      <Link
        href={withLocale(locale, "/")}
        className="text-sm text-opus-warm/70 underline-offset-4 hover:text-opus-gold hover:underline"
      >
        {t.back}
      </Link>
      <p className="opus-text-metallic-soft mt-8 font-mono text-[0.65rem] uppercase tracking-[0.28em]">OPUS</p>
      <h1 className="mt-3 font-display text-2xl text-opus-warm md:text-3xl">{t.title}</h1>
      <p className="mt-4 font-sans text-sm leading-relaxed text-opus-warm/60">{t.lead}</p>
      <div className="mt-8 rounded-xl border border-white/[0.08] bg-opus-slate/15 p-6">
        <p className="font-sans text-sm leading-relaxed text-opus-warm/70">{t.body}</p>
      </div>
    </main>
  );
}
