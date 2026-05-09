import Link from "next/link";
import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { auth } from "@/auth";
import { ImmersiveTileSessionButton } from "@/components/viewer/ImmersiveTileSessionButton";
import { getDictionary } from "@/i18n/catalog";
import { normalizeLocale, withLocale } from "@/i18n/paths";
import { isLikelyMobileWebClient } from "@/lib/mobileUserAgent";
import {
  canAccessSubmission,
  getCurrentOwner,
  getSubmissionById,
  type Actor,
} from "@/lib/privateStorage";

type Props = { params: Promise<{ locale: string; submissionId: string }> };

export const dynamic = "force-dynamic";

export default async function ImmersiveViewerPage({ params }: Props) {
  const { locale: raw, submissionId } = await params;
  const locale = normalizeLocale(raw);
  const m = getDictionary(locale);
  const mv = m.mobileViewer;

  const session = await auth();
  if (!session?.user?.id || !session.user.role) {
    const returnTo = encodeURIComponent(withLocale(locale, `/viewer/immersive/${submissionId}`));
    redirect(`${withLocale(locale, "/login")}?returnTo=${returnTo}`);
  }

  const h = await headers();
  const mobile = isLikelyMobileWebClient(h.get("user-agent"), h.get("sec-ch-ua-mobile"));
  if (!mobile) {
    const bridgePath = withLocale(locale, "/mobile-bridge");
    const qs = new URLSearchParams({
      returnTo: withLocale(locale, `/viewer/immersive/${submissionId}`),
    }).toString();
    redirect(`${bridgePath}?${qs}`);
  }

  const actor: Actor = {
    userId: session.user.id,
    role: session.user.role as Actor["role"],
  };

  const submission = await getSubmissionById(submissionId.trim());
  if (!submission || (submission.reviewStatus ?? "pending_review") !== "approved") {
    notFound();
  }

  const owner = await getCurrentOwner(submission.id, submission.artistId);
  if (!canAccessSubmission(actor, submission, owner)) {
    return (
      <main className="mx-auto max-w-lg px-6 py-16">
        <p className="text-sm text-opus-warm/60">{mv.immersiveNoAccess}</p>
        <p className="mt-8">
          <Link href={withLocale(locale, "/vault/collection")} className="text-sm text-opus-gold/75 hover:underline">
            {m.vaultNav.collection}
          </Link>
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-lg px-6 py-16 md:py-20">
      <p className="font-mono text-[0.65rem] uppercase tracking-[0.22em] text-opus-warm/45">{mv.immersiveKicker}</p>
      <h1 className="mt-2 font-display text-2xl text-opus-warm md:text-3xl">{mv.immersiveTitle}</h1>
      <p className="mt-2 font-display text-lg text-opus-gold-light/90">{submission.artworkTitle}</p>
      <p className="mt-6 text-sm leading-relaxed text-opus-warm/58">{mv.immersiveLead}</p>

      <div className="mt-10 rounded-2xl border border-white/[0.08] bg-opus-charcoal/40 p-6">
        <ImmersiveTileSessionButton
          submissionId={submission.id}
          requestCta={mv.tileRequestCta}
          resultLabel={mv.tileResultLabel}
          errorLabel={mv.tileErrorGeneric}
        />
      </div>

      <p className="mt-10 text-center text-sm">
        <Link href={withLocale(locale, "/vault/collection")} className="text-opus-gold/70 hover:underline">
          ← {m.vaultNav.collection}
        </Link>
      </p>
    </main>
  );
}
