import Link from "next/link";
import { auth } from "@/auth";
import { OperatorMintJobsPanel } from "@/components/operator/OperatorMintJobsPanel";
import { getDictionary } from "@/i18n/catalog";
import { normalizeLocale, withLocale } from "@/i18n/paths";

type Props = { params: Promise<{ locale: string }> };

export default async function OperatorOnchainMintPage({ params }: Props) {
  const { locale: raw } = await params;
  const locale = normalizeLocale(raw);
  const m = getDictionary(locale);

  const session = await auth();
  const authed = session?.user?.role === "operator";
  const q = m.operatorMintQueue;

  return (
    <main className="min-h-screen bg-opus-charcoal px-6 pb-24 pt-[calc(var(--opus-header-plus-trust)+4rem)] text-opus-warm/80">
      <div className="mx-auto max-w-6xl">
        <p className="opus-text-metallic-soft text-center text-xs uppercase tracking-[0.4em]">OPUS</p>
        <h1 className="mt-4 text-center font-display text-3xl tracking-[0.12em] text-opus-warm">{q.title}</h1>
        <p className="mt-3 text-center text-sm text-opus-warm/55">{q.subtitle}</p>

        <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm">
          <Link
            href={withLocale(locale, "/operator/review")}
            className="text-opus-gold underline-offset-4 hover:text-opus-gold-light hover:underline"
          >
            {q.linkReview}
          </Link>
          <Link
            href={withLocale(locale, "/")}
            className="text-opus-gold underline-offset-4 hover:text-opus-gold-light hover:underline"
          >
            {m.operatorReview.backHome}
          </Link>
        </div>

        {!authed ? (
          <div className="mx-auto mt-10 max-w-xl rounded-xl border border-white/[0.08] bg-opus-slate/30 p-6 text-center shadow-opus-card">
            <p className="font-display text-xl text-opus-warm">{m.operatorAdmin.unauthorizedTitle}</p>
            <p className="mt-3 text-sm text-opus-warm/60">{m.operatorAdmin.unauthorizedBody}</p>
          </div>
        ) : (
          <OperatorMintJobsPanel locale={locale} m={m} />
        )}
      </div>
    </main>
  );
}
