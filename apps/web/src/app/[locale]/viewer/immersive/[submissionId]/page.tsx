import Link from "next/link";
import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { auth } from "@/auth";
import { ImmersiveArtworkViewer } from "@/components/viewer/ImmersiveArtworkViewer";
import { ProtectedArtworkSurface } from "@/components/viewer/ProtectedArtworkSurface";
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
      <main className="mx-auto min-h-screen max-w-lg px-6 pb-16 pt-[calc(var(--opus-header-plus-trust)+2rem)]">
        <p className="text-sm text-opus-warm/60">{mv.immersiveNoAccess}</p>
        <p className="mt-8">
          <Link href={withLocale(locale, "/vault/collection")} className="text-sm text-opus-gold/75 hover:underline">
            {m.vaultNav.collection}
          </Link>
        </p>
      </main>
    );
  }

  const previewSrc = `/api/artwork-submissions/${encodeURIComponent(submission.id)}/public-preview`;

  return (
    <main className="mx-auto min-h-screen max-w-lg px-6 pb-20 pt-[calc(var(--opus-header-plus-trust)+1.25rem)] md:pb-24 md:pt-[calc(var(--opus-header-plus-trust)+2rem)]">
      <p className="font-mono text-[0.65rem] uppercase tracking-[0.22em] text-opus-warm/45">{mv.immersiveKicker}</p>
      <h1 className="mt-2 font-display text-2xl text-opus-warm md:text-3xl">{mv.immersiveTitle}</h1>
      <p className="mt-2 font-display text-lg text-opus-gold-light/90">{submission.artworkTitle}</p>
      <p className="mt-4 text-sm leading-relaxed text-opus-warm/58">{mv.immersiveLead}</p>

      <div className="mt-6 flex min-h-[12rem] justify-center overflow-hidden rounded-xl border border-white/[0.08] bg-black/20 py-3 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
        <ProtectedArtworkSurface
          src={previewSrc}
          alt=""
          wrapperClassName="mx-auto inline-flex justify-center"
          imgClassName="h-auto max-h-[min(55dvh,480px)] w-auto max-w-full object-contain"
          loading="eager"
          decoding="async"
        />
      </div>
      <p className="mt-2 font-mono text-[0.58rem] uppercase tracking-[0.18em] text-opus-warm/40">{mv.immersivePreviewNote}</p>

      <div className="mt-8 rounded-2xl border border-white/[0.08] bg-opus-charcoal/40 p-6">
        <ImmersiveArtworkViewer
          submissionId={submission.id}
          ctaLabel={mv.artworkViewCta}
          closeLabel={mv.artworkViewClose}
          pinchHint={mv.artworkViewHint}
          loadErrorLabel={mv.artworkViewLoadError}
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
