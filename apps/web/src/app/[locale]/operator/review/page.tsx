import Link from "next/link";
import { auth } from "@/auth";
import { getDictionary } from "@/i18n/catalog";
import { normalizeLocale, withLocale } from "@/i18n/paths";
import { listAllSubmissions, type SubmissionRecord } from "@/lib/privateStorage";
import { OperatorReviewTable, type OperatorReviewRow } from "@/components/operator/OperatorReviewTable";

type Props = { params: Promise<{ locale: string }> };

function normalizeSubmission(rec: SubmissionRecord): OperatorReviewRow {
  return {
    id: rec.id,
    createdAt: rec.createdAt,
    artistId: rec.artistId,
    nickname: rec.nickname,
    artworkTitle: rec.artworkTitle,
    mime: rec.storedFile?.mime,
    audienceCategory: rec.audienceCategory,
    priceJpy: rec.priceJpy,
    reviewStatus: rec.reviewStatus ?? "pending_review",
    contentRating: rec.contentRating ?? "general",
    reviewNote: rec.reviewNote,
  };
}

export default async function OperatorReviewPage({ params }: Props) {
  const { locale: raw } = await params;
  const locale = normalizeLocale(raw);
  const m = getDictionary(locale);

  const session = await auth();
  const authed = session?.user?.role === "operator";
  const rows = (await listAllSubmissions()).map(normalizeSubmission);

  return (
    <main className="min-h-screen bg-opus-charcoal px-6 pb-24 pt-[calc(var(--opus-header-plus-trust)+4rem)] text-opus-warm/80">
      <div className="mx-auto max-w-6xl">
        <p className="opus-text-metallic-soft text-center text-xs uppercase tracking-[0.4em]">OPUS</p>
        <h1 className="mt-4 text-center font-display text-3xl tracking-[0.12em] text-opus-warm">
          {m.operatorReview.title}
        </h1>
        <p className="mt-3 text-center text-sm text-opus-warm/55">{m.operatorReview.subtitle}</p>

        {!authed ? (
          <div className="mx-auto mt-10 max-w-xl rounded-xl border border-white/[0.08] bg-opus-slate/30 p-6 text-center shadow-opus-card">
            <p className="font-display text-xl text-opus-warm">{m.operatorAdmin.unauthorizedTitle}</p>
            <p className="mt-3 text-sm text-opus-warm/60">{m.operatorAdmin.unauthorizedBody}</p>
          </div>
        ) : null}

        {authed ? <OperatorReviewTable m={m} rows={rows} /> : null}

        <div className="mt-14 text-center">
          <Link
            href={withLocale(locale, "/")}
            className="inline-block text-sm text-opus-gold underline-offset-4 hover:text-opus-gold-light hover:underline"
          >
            ← Home
          </Link>
        </div>
      </div>
    </main>
  );
}

