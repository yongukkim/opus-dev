import { notFound } from "next/navigation";
import Link from "next/link";
import { ArtistEditionEditForm } from "@/components/artist/ArtistEditionEditForm";
import { VaultArtistGate } from "@/components/vault/VaultArtistGate";
import { auth } from "@/auth";
import { getDictionary } from "@/i18n/catalog";
import { normalizeLocale, withLocale } from "@/i18n/paths";
import { getSubmissionById, hasCollectorOwnershipEvent } from "@/lib/privateStorage";
import { getVaultUiRoleFromCookies } from "@/lib/vaultRole";
import { cookies } from "next/headers";

type Props = {
  params: Promise<{ locale: string; submissionId: string }>;
};

export default async function VaultMyArtworkEditionEditPage({ params }: Props) {
  const { locale: raw, submissionId } = await params;
  const locale = normalizeLocale(raw);
  const m = getDictionary(locale);
  const aa = m.artistArtworks;

  const session = await auth();
  const cookieStore = await cookies();
  const cookieRole = getVaultUiRoleFromCookies(cookieStore);

  if (session?.user?.role !== "artist") {
    return (
      <VaultArtistGate
        variant="myArtworks"
        gateReason="notRegisteredArtist"
        locale={locale}
        vault={m.vault}
        currentRole={cookieRole}
      />
    );
  }

  if (cookieRole !== "artist") {
    return (
      <VaultArtistGate
        variant="myArtworks"
        gateReason="needArtistUiMode"
        locale={locale}
        vault={m.vault}
        currentRole={cookieRole}
      />
    );
  }

  const artistId = session.user.id ?? "";
  const submission = await getSubmissionById(submissionId);
  if (!submission || submission.artistId !== artistId) {
    notFound();
  }

  const reviewStatus = submission.reviewStatus ?? "pending_review";
  const soldAtLeastOneEdition = await hasCollectorOwnershipEvent(submission.id);
  const editionEditable =
    (reviewStatus === "pending_review" || reviewStatus === "changes_requested") &&
    !soldAtLeastOneEdition;

  const listBackHref = `${withLocale(locale, "/vault/my-artworks")}?artist=${encodeURIComponent(artistId)}`;

  return (
    <main className="flex-1 p-6 pb-24 text-opus-warm/80 md:p-10">
      <div className="mx-auto max-w-3xl">
        <p className="text-center text-sm uppercase tracking-[0.35em] text-opus-warm/45">{aa.editEditionKicker}</p>
        <h1 className="mt-3 text-center font-display text-2xl text-opus-warm md:text-3xl">{aa.editEditionTitle}</h1>
        <p className="mx-auto mt-3 max-w-lg text-center text-sm text-opus-warm/60">{aa.editEditionBody}</p>

        {!editionEditable ? (
          <div className="mx-auto mt-10 max-w-lg rounded-lg border border-white/[0.1] bg-opus-slate/25 p-6 text-center">
            <p className="font-display text-lg text-opus-warm/90">{aa.editionLockedTitle}</p>
            <p className="mt-2 text-sm text-opus-warm/60">
              {soldAtLeastOneEdition ? aa.editionLockedAfterSaleBody : aa.editionLockedBody}
            </p>
            {submission.reviewNote?.trim() ? (
              <div className="mt-5 rounded-md border border-opus-gold/20 bg-opus-gold/[0.06] p-4 text-left">
                <p className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-opus-warm/50">
                  {aa.operatorFeedbackLabel}
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-opus-warm/85">
                  {submission.reviewNote.trim()}
                </p>
              </div>
            ) : null}
            <Link
              href={listBackHref}
              className="mt-6 inline-block text-sm text-opus-gold underline-offset-4 hover:text-opus-gold-light hover:underline"
            >
              {aa.backToMyArtworks}
            </Link>
          </div>
        ) : (
          <>
            {submission.reviewNote?.trim() ? (
              <div className="mx-auto mt-8 max-w-lg rounded-md border border-opus-gold/20 bg-opus-gold/[0.06] p-4">
                <p className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-opus-warm/50">
                  {aa.operatorFeedbackLabel}
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-opus-warm/85">
                  {submission.reviewNote.trim()}
                </p>
              </div>
            ) : null}
            <ArtistEditionEditForm
            locale={locale}
            m={m}
            submissionId={submission.id}
            artistId={artistId}
            artworkTitle={submission.artworkTitle}
            initial={{
              editionMode: submission.editionMode,
              editionTotal: submission.editionTotal,
              initialMint: submission.initialMint,
              numberingPolicy: submission.numberingPolicy,
              lockEdition: submission.lockEdition,
            }}
          />
          </>
        )}
      </div>
    </main>
  );
}
