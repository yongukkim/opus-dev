import { auth } from "@/auth";
import { getDictionary } from "@/i18n/catalog";
import { normalizeLocale, withLocale } from "@/i18n/paths";
import { attemptDemoPrimaryPurchaseSettle } from "@/lib/demoPrimaryPurchase";
import { prisma } from "@/lib/prisma";
import type { OpusRole } from "@/lib/privateStorage";
import { sanitizeReturnTo } from "@/lib/returnTo";
import Link from "next/link";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ artwork?: string; returnTo?: string; orderId?: string; fromSubmission?: string }>;
};

export default async function PurchaseSuccessPage({ params, searchParams }: Props) {
  const { locale: raw } = await params;
  const { artwork: artworkParam, returnTo: returnToParam, orderId: orderIdParam, fromSubmission: fromSubmissionParam } =
    await searchParams;
  const locale = normalizeLocale(raw);
  const m = getDictionary(locale);
  const p = m.purchaseSuccess;

  const artwork = (artworkParam ?? "").trim();
  const vaultHref = sanitizeReturnTo(returnToParam, withLocale(locale, "/vault/collection"));
  const orderId = (orderIdParam ?? "").trim();
  const fromSubmission = (fromSubmissionParam ?? "").trim();

  const session = await auth();

  let demoNotice: "recorded" | "failed" | null = null;
  if (!orderId && fromSubmission && session?.user?.id) {
    const role = session.user.role as OpusRole | undefined;
    const outcome = await attemptDemoPrimaryPurchaseSettle({
      submissionId: fromSubmission,
      buyerUserId: session.user.id,
      buyerRole: role ?? "collector",
    });
    if (outcome === "settled") demoNotice = "recorded";
    else if (outcome === "transfer_error" || outcome === "not_available" || outcome === "invalid_submission") {
      demoNotice = "failed";
    }
  }

  let paymentState: "ok" | "pending" | "failed" | "none" = "none";
  if (orderId) {
    if (session?.user?.id) {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        select: { buyerUserId: true, status: true },
      });
      if (order?.buyerUserId === session.user.id) {
        if (order.status === "PAID") paymentState = "ok";
        else if (order.status === "PENDING") paymentState = "pending";
        else paymentState = "failed";
      }
    }
  }

  const title =
    paymentState === "pending"
      ? p.paymentPendingTitle
      : paymentState === "failed"
        ? p.paymentFailedTitle
        : p.title;
  const subtitle =
    paymentState === "pending"
      ? p.paymentPendingBody
      : paymentState === "failed"
        ? p.paymentFailedBody
        : p.subtitle;
  const body =
    paymentState === "ok" || paymentState === "none"
      ? artwork
        ? p.bodyWithArtwork.replace("{artwork}", artwork)
        : p.body
      : null;

  return (
    <main className="min-h-screen bg-opus-charcoal px-6 pb-24 pt-[calc(var(--opus-header-plus-trust)+4rem)] text-opus-warm/80">
      <div className="mx-auto max-w-xl text-center">
        <p className="opus-text-metallic-soft text-xs uppercase tracking-[0.4em]">OPUS</p>
        <h1 className="mt-4 font-display text-3xl tracking-[0.12em] text-opus-warm">{title}</h1>
        <p className="mx-auto mt-3 max-w-md text-sm text-opus-warm/55">{subtitle}</p>

        <div className="mt-10 rounded-2xl border border-white/[0.1] bg-white/[0.045] px-8 py-10 shadow-[0_26px_80px_rgba(0,0,0,0.5)] backdrop-blur-md">
          <p className="opus-text-metallic-soft font-mono text-[0.65rem] uppercase tracking-[0.28em]">{p.kicker}</p>
          {body ? (
            <p className="mt-5 font-sans text-sm leading-relaxed text-opus-warm/75">{body}</p>
          ) : null}
          {demoNotice === "recorded" ? (
            <p className="mt-4 rounded-lg border border-opus-gold/20 bg-opus-gold/5 px-4 py-3 text-left text-xs leading-relaxed text-opus-gold-light/90">
              {p.demoCustodyRecorded}
            </p>
          ) : null}
          {demoNotice === "failed" ? (
            <p className="mt-4 rounded-lg border border-white/[0.08] bg-black/25 px-4 py-3 text-left text-xs leading-relaxed text-opus-warm/55">
              {p.demoCustodyFailed}
            </p>
          ) : null}

          <p className="mt-6 text-center text-xs leading-relaxed text-opus-warm/50">
            {p.collectorGuideBeforeLink}
            <Link
              href={withLocale(locale, "/legal/collector-guide")}
              className="text-opus-gold underline-offset-4 hover:text-opus-gold-light hover:underline"
            >
              {p.collectorGuideLink}
            </Link>
            {p.collectorGuideAfterLink}
          </p>

          <div className="mt-9 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href={vaultHref}
              className="opus-surface-metallic inline-flex min-w-[14rem] items-center justify-center rounded-full px-8 py-3 text-sm font-semibold tracking-[0.12em] text-black transition hover:opacity-95"
            >
              {p.toVault}
            </Link>
            <Link
              href={withLocale(locale, "/releases")}
              className="text-sm text-opus-gold/70 underline-offset-4 transition hover:text-opus-gold hover:underline"
            >
              {p.backToArchive}
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
