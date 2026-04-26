import { auth } from "@/auth";
import { OperatorReviewTable, type OperatorReviewRow } from "@/components/operator/OperatorReviewTable";
import { OperatorStaffRolePanel } from "@/components/operator/OperatorStaffRolePanel";
import { getDictionary } from "@/i18n/catalog";
import { normalizeLocale, withLocale } from "@/i18n/paths";
import { prisma } from "@/lib/prisma";
import { listAllSubmissions, type SubmissionRecord } from "@/lib/privateStorage";
import Link from "next/link";

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
    editionMode: rec.editionMode,
    editionTotal: rec.editionTotal,
    initialMint: rec.initialMint,
    numberingPolicy: rec.numberingPolicy,
    lockEdition: rec.lockEdition,
  };
}

export default async function VaultAuthoritySettingsPage({ params }: Props) {
  const { locale: raw } = await params;
  const locale = normalizeLocale(raw);
  const m = getDictionary(locale);
  const a = m.vaultAuthority;

  const session = await auth();
  const isOperator = session?.user?.role === "operator";

  if (!isOperator || !session.user?.id) {
    return (
      <main className="flex-1 p-6 pb-24 text-opus-warm/80 md:p-10">
        <div className="mx-auto max-w-3xl rounded-xl border border-white/[0.08] bg-opus-slate/30 p-6 text-center shadow-opus-card">
          <p className="font-display text-xl text-opus-warm">{m.operatorAdmin.unauthorizedTitle}</p>
          <p className="mt-3 text-sm text-opus-warm/60">{m.operatorAdmin.unauthorizedBody}</p>
          <div className="mt-6">
            <Link
              href={withLocale(locale, "/vault")}
              className="text-sm text-opus-gold underline-offset-4 hover:text-opus-gold-light hover:underline"
            >
              {m.vault.artistGateBackVault}
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const submissionRows = (await listAllSubmissions()).map(normalizeSubmission);
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    where: { role: "OPERATOR" },
    take: 50,
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });
  const accountRows = users.map((u) => ({
    id: u.id,
    name: u.name ?? "",
    email: u.email ?? "",
    role: (u.role === "ARTIST" ? "artist" : u.role === "OPERATOR" ? "operator" : "collector") as
      | "collector"
      | "artist"
      | "operator",
    createdAt: u.createdAt.toISOString(),
  }));

  return (
    <main className="flex-1 p-6 pb-24 text-opus-warm/80 md:p-10">
      <h1 className="font-display text-2xl text-opus-warm">{a.title}</h1>
      <p className="mt-3 max-w-3xl text-sm text-opus-warm/55">{a.subtitle}</p>

      <section className="mt-10">
        <p className="font-mono text-[0.65rem] uppercase tracking-[0.28em] text-opus-warm/45">{a.reviewSection}</p>
        <OperatorReviewTable m={m} rows={submissionRows} />
      </section>

      <section className="mt-12">
        <p className="font-mono text-[0.65rem] uppercase tracking-[0.28em] text-opus-warm/45">{a.accountSection}</p>
        <OperatorStaffRolePanel rows={accountRows} m={m} />
      </section>
    </main>
  );
}
