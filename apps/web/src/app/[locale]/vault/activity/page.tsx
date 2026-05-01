import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { VaultActivityWishlistPanel } from "@/components/vault/VaultActivityWishlistPanel";
import { getDictionary } from "@/i18n/catalog";
import { normalizeLocale, withLocale } from "@/i18n/paths";
import { OPUS_DEMO_CART_KEY, OPUS_DEMO_WISHLIST_KEY } from "@/lib/demoLists";
import { prisma } from "@/lib/prisma";

type Props = { params: Promise<{ locale: string }> };

export default async function VaultActivityPage({ params }: Props) {
  const { locale: raw } = await params;
  const locale = normalizeLocale(raw);
  const m = getDictionary(locale);
  const v = m.vault;
  const session = await auth();

  if (!session?.user?.id) {
    const returnTo = encodeURIComponent(withLocale(locale, "/vault/activity"));
    redirect(`${withLocale(locale, "/login")}?returnTo=${returnTo}`);
  }

  const orders = await prisma.order.findMany({
    where: { buyerUserId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 40,
    select: {
      id: true,
      title: true,
      amountJpy: true,
      status: true,
      createdAt: true,
    },
  });

  const money = new Intl.NumberFormat(locale === "ja" ? "ja-JP" : "ko-KR");
  const time = new Intl.DateTimeFormat(locale === "ja" ? "ja-JP" : "ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  const statusLabel: Record<(typeof orders)[number]["status"], string> = {
    PENDING: v.activityPurchaseStatusPending,
    PAID: v.activityPurchaseStatusPaid,
    FAILED: v.activityPurchaseStatusFailed,
    CANCELLED: v.activityPurchaseStatusCancelled,
    REFUNDED: v.activityPurchaseStatusRefunded,
  };

  return (
    <main className="p-6 md:p-10">
      <h1 className="font-display text-2xl text-opus-warm md:text-3xl">{v.activityTitle}</h1>
      <p className="mt-3 max-w-2xl font-sans text-sm text-opus-warm/55">{v.activityBody}</p>

      <section className="mt-10 border-t border-white/[0.06] pt-7">
        <h2 className="font-display text-xl text-opus-warm">{v.activityWishlistHeading}</h2>
        <p className="mt-2 text-sm text-opus-warm/55">{v.activityWishlistBody}</p>
        <div className="mt-5">
          <VaultActivityWishlistPanel
            locale={locale}
            listKey={OPUS_DEMO_WISHLIST_KEY}
            labels={{ empty: v.activityWishlistEmpty, openWork: v.activityOpenWork }}
          />
        </div>
      </section>

      <section className="mt-10 border-t border-white/[0.06] pt-7">
        <h2 className="font-display text-xl text-opus-warm">{v.activityCartHeading}</h2>
        <p className="mt-2 text-sm text-opus-warm/55">{v.activityCartBody}</p>
        <div className="mt-5">
          <VaultActivityWishlistPanel
            locale={locale}
            listKey={OPUS_DEMO_CART_KEY}
            labels={{ empty: v.activityCartEmpty, openWork: v.activityOpenWork }}
          />
        </div>
      </section>

      <section className="mt-10 border-t border-white/[0.06] pt-7">
        <h2 className="font-display text-xl text-opus-warm">{v.activityPurchaseHeading}</h2>
        <p className="mt-2 text-sm text-opus-warm/55">{v.activityPurchaseBody}</p>

        {orders.length === 0 ? (
          <p className="mt-5 text-sm text-opus-warm/50">{v.activityPurchaseEmpty}</p>
        ) : (
          <ul className="mt-5 space-y-3">
            {orders.map((order) => (
              <li
                key={order.id}
                className="rounded-xl border border-white/[0.08] bg-opus-slate/20 px-4 py-3 shadow-opus-card"
              >
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <p className="line-clamp-2 text-sm text-opus-warm/85">{order.title}</p>
                  <span className="font-mono text-xs text-opus-warm/60">JPY {money.format(order.amountJpy)}</span>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                  <span className="rounded-full border border-white/[0.12] bg-black/20 px-2 py-0.5 text-opus-warm/70">
                    {statusLabel[order.status]}
                  </span>
                  <span className="text-opus-warm/45">{time.format(order.createdAt)}</span>
                  <span className="font-mono text-opus-warm/35">{order.id}</span>
                  <Link
                    href={withLocale(locale, `/vault/activity/orders/${encodeURIComponent(order.id)}`)}
                    className="text-opus-gold/80 underline-offset-4 transition hover:text-opus-gold-light hover:underline"
                  >
                    {v.activityOrderDetailCta}
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
