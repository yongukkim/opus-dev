import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { getDictionary } from "@/i18n/catalog";
import { normalizeLocale, withLocale } from "@/i18n/paths";
import { prisma } from "@/lib/prisma";

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

export const dynamic = "force-dynamic";

export default async function VaultOrderDetailPage({ params }: Props) {
  const { locale: raw, id } = await params;
  const locale = normalizeLocale(raw);
  const m = getDictionary(locale);
  const v = m.vault;

  const session = await auth();
  if (!session?.user?.id) {
    const returnTo = encodeURIComponent(withLocale(locale, `/vault/activity/orders/${encodeURIComponent(id)}`));
    redirect(`${withLocale(locale, "/login")}?returnTo=${returnTo}`);
  }

  /**
   * ISO 27001 A.9.2.1 (§4), A.18.1.4 (§7)
   * KO: 주문 상세는 로그인한 본인(buyerUserId) 소유 주문만 조회하여 타인의 결제 기록 노출을 차단합니다.
   * JA: 注文詳細はサインイン本人(buyerUserId)の注文のみ参照し、他者の決済記録露出を防止します。
   * EN: Order detail loads only the signed-in buyer’s order to prevent cross-user payment record exposure.
   */
  const order = await prisma.order.findFirst({
    where: { id: id.trim(), buyerUserId: session.user.id },
    select: {
      id: true,
      title: true,
      amountJpy: true,
      currency: true,
      status: true,
      provider: true,
      createdAt: true,
      paidAt: true,
      failedAt: true,
      failureReasonMasked: true,
      cancelledAt: true,
      refundedAt: true,
      payments: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          status: true,
          provider: true,
          createdAt: true,
          capturedAt: true,
          failedAt: true,
          failureReasonMasked: true,
        },
      },
    },
  });
  if (!order) notFound();

  const money = new Intl.NumberFormat(locale === "ja" ? "ja-JP" : "ko-KR");
  const time = new Intl.DateTimeFormat(locale === "ja" ? "ja-JP" : "ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  const statusLabel: Record<typeof order.status, string> = {
    PENDING: v.activityPurchaseStatusPending,
    PAID: v.activityPurchaseStatusPaid,
    FAILED: v.activityPurchaseStatusFailed,
    CANCELLED: v.activityPurchaseStatusCancelled,
    REFUNDED: v.activityPurchaseStatusRefunded,
  };

  const paymentStatusLabel: Record<(typeof order.payments)[number]["status"], string> = {
    REQUIRES_ACTION: v.activityPurchaseStatusPending,
    SUCCEEDED: v.activityPurchaseStatusPaid,
    FAILED: v.activityPurchaseStatusFailed,
    CANCELLED: v.activityPurchaseStatusCancelled,
    REFUNDED: v.activityPurchaseStatusRefunded,
  };

  return (
    <main className="p-6 md:p-10">
      <h1 className="font-display text-2xl text-opus-warm md:text-3xl">{v.activityOrderDetailTitle}</h1>
      <p className="mt-3 max-w-2xl text-sm text-opus-warm/55">{v.activityOrderDetailBody}</p>

      <section className="mt-9 rounded-xl border border-white/[0.08] bg-opus-slate/20 p-5 shadow-opus-card">
        <h2 className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-opus-warm/45">
          {v.activityOrderSummaryLabel}
        </h2>
        <div className="mt-4 space-y-2 text-sm text-opus-warm/80">
          <p>{order.title}</p>
          <p className="font-mono text-opus-warm/65">
            {order.currency} {money.format(order.amountJpy)}
          </p>
          <p className="text-opus-warm/55">{time.format(order.createdAt)}</p>
          <p>
            <span className="rounded-full border border-white/[0.12] bg-black/20 px-2 py-0.5 text-xs text-opus-warm/70">
              {statusLabel[order.status]}
            </span>
          </p>
          {order.failureReasonMasked ? (
            <p className="line-clamp-3 break-words text-xs leading-relaxed text-opus-warm/60">
              {v.activityOrderFailureLabel}: {order.failureReasonMasked}
            </p>
          ) : null}
          <p className="font-mono text-xs text-opus-warm/35">{order.id}</p>
        </div>
      </section>

      <section className="mt-8 rounded-xl border border-white/[0.08] bg-opus-slate/20 p-5 shadow-opus-card">
        <h2 className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-opus-warm/45">
          {v.activityOrderPaymentsLabel}
        </h2>
        {order.payments.length === 0 ? (
          <p className="mt-4 text-sm text-opus-warm/50">{v.activityOrderPaymentEmpty}</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {order.payments.map((payment) => (
              <li key={payment.id} className="rounded-lg border border-white/[0.08] bg-black/15 px-4 py-3">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="rounded-full border border-white/[0.12] bg-black/20 px-2 py-0.5 text-xs text-opus-warm/70">
                    {paymentStatusLabel[payment.status]}
                  </span>
                  <span className="text-xs text-opus-warm/50">{payment.provider}</span>
                  <span className="text-xs text-opus-warm/45">{time.format(payment.createdAt)}</span>
                </div>
                {payment.failureReasonMasked ? (
                  <p className="mt-2 line-clamp-3 break-words text-xs leading-relaxed text-opus-warm/60">
                    {v.activityOrderFailureLabel}: {payment.failureReasonMasked}
                  </p>
                ) : null}
                <p className="mt-2 font-mono text-[0.7rem] text-opus-warm/35">{payment.id}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="mt-8">
        <Link
          href={withLocale(locale, "/vault/activity")}
          className="text-sm text-opus-gold/80 underline-offset-4 hover:text-opus-gold-light hover:underline"
        >
          {v.activityOrderBack}
        </Link>
      </div>
    </main>
  );
}
