import { auth } from "@/auth";
import { getDictionary } from "@/i18n/catalog";
import { normalizeLocale, withLocale } from "@/i18n/paths";
import { prisma } from "@/lib/prisma";
import { sanitizeReturnTo } from "@/lib/returnTo";
import Link from "next/link";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ artwork?: string; returnTo?: string; orderId?: string }>;
};

export default async function PurchaseSuccessPage({ params, searchParams }: Props) {
  const { locale: raw } = await params;
  const { artwork: artworkParam, returnTo: returnToParam, orderId: orderIdParam } = await searchParams;
  const locale = normalizeLocale(raw);
  const m = getDictionary(locale);
  const p = m.purchaseSuccess;

  const artwork = (artworkParam ?? "").trim();
  const vaultHref = sanitizeReturnTo(returnToParam, withLocale(locale, "/vault/collection"));
  const orderId = (orderIdParam ?? "").trim();

  let paymentState: "ok" | "pending" | "failed" | "none" = "none";
  if (orderId) {
    const session = await auth();
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
