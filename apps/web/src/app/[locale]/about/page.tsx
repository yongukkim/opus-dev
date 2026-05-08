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
    title: d.meta.aboutTitle,
    description: d.meta.aboutDescription,
  };
}

export default async function AboutPage({ params }: Props) {
  const { locale: raw } = await params;
  const locale = normalizeLocale(raw);
  const m = getDictionary(locale);
  const a = m.aboutPage;

  const s3Bullets = [
    { label: a.s3Bullet1Label, body: a.s3Bullet1Body },
    { label: a.s3Bullet2Label, body: a.s3Bullet2Body },
    { label: a.s3Bullet3Label, body: a.s3Bullet3Body },
  ] as const;

  return (
    <main className="mx-auto max-w-3xl px-6 pb-16 pt-[calc(var(--opus-header-plus-trust)+2.5rem)] text-opus-warm/80">
      <Link
        href={withLocale(locale, "/")}
        className="text-sm text-opus-warm/70 underline-offset-4 hover:text-opus-gold hover:underline"
      >
        {a.back}
      </Link>
      <h1 className="mt-8 font-display text-2xl font-semibold tracking-tight text-opus-warm sm:text-3xl md:text-4xl">
        {a.title}
      </h1>
      <p className="mt-6 text-base leading-relaxed text-opus-warm/75">{a.lead}</p>
      <p className="mt-4 text-base leading-relaxed text-opus-warm/75">{a.lead2}</p>

      <section className="mt-12 space-y-4">
        <h2 className="font-display text-xl font-semibold text-opus-warm">{a.s1Title}</h2>
        <p className="leading-relaxed">{a.s1p1}</p>
        <p className="leading-relaxed">{a.s1p2}</p>
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="font-display text-xl font-semibold text-opus-warm">{a.s2Title}</h2>
        <p className="leading-relaxed">{a.s2p1}</p>
        <p className="leading-relaxed">{a.s2p2}</p>
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="font-display text-xl font-semibold text-opus-warm">{a.s3Title}</h2>
        <p className="leading-relaxed">{a.s3p1}</p>
        <ul className="list-none space-y-4 border-l border-opus-gold/25 pl-4">
          {s3Bullets.map(({ label, body }) => (
            <li key={label}>
              <span className="font-medium text-opus-warm">{label}</span>
              <span className="text-opus-warm/55"> — </span>
              <span className="leading-relaxed">{body}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="font-display text-xl font-semibold text-opus-warm">{a.s4Title}</h2>
        <p className="leading-relaxed">{a.s4Lead}</p>
        <div className="space-y-4 rounded-md border border-white/[0.08] bg-white/[0.02] p-5">
          <div>
            <h3 className="font-medium text-opus-gold/90">{a.s4WebTitle}</h3>
            <p className="mt-2 leading-relaxed text-opus-warm/75">{a.s4WebBody}</p>
          </div>
          <div>
            <h3 className="font-medium text-opus-gold/90">{a.s4AppTitle}</h3>
            <p className="mt-2 leading-relaxed text-opus-warm/75">{a.s4AppBody}</p>
          </div>
        </div>
      </section>

      <p className="mt-12 border-t border-white/[0.08] pt-6 text-sm text-opus-warm/50">{a.draftNote}</p>
    </main>
  );
}
