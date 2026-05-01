"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import type { Locale } from "@/i18n/config";
import { withLocale } from "@/i18n/paths";

export type CheckoutPayCopy = {
  payCta: string;
  payStarting: string;
  demoPayCta: string;
  payError: string;
  payMustSignIn: string;
  payArtistWrongRole: string;
  payNotConfigured: string;
};

export function CheckoutPayButton({
  locale,
  artwork,
  priceJpy,
  returnTo,
  successHref,
  stripeEnabled,
  isSignedIn,
  isCollector,
  copy,
}: {
  locale: Locale;
  artwork: string;
  priceJpy: number;
  returnTo: string;
  successHref: string;
  stripeEnabled: boolean;
  isSignedIn: boolean;
  isCollector: boolean;
  copy: CheckoutPayCopy;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const cancelQs = new URLSearchParams({
    ...(artwork ? { artwork } : {}),
    priceJpy: String(priceJpy),
    returnTo,
  }).toString();
  const cancelPathWithSlash = `${withLocale(locale, "/checkout")}${cancelQs ? `?${cancelQs}` : ""}`;

  const startStripe = useCallback(async () => {
    setError("");
    setBusy(true);
    try {
      const idem = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
      const title = artwork ? `OPUS — ${artwork.slice(0, 200)}` : "OPUS edition";
      const orderRes = await fetch("/api/payments/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Idempotency-Key": idem,
        },
        credentials: "include",
        body: JSON.stringify({
          title,
          amountJpy: priceJpy,
        }),
      });
      if (!orderRes.ok) {
        setError(copy.payError);
        return;
      }
      const orderJson = (await orderRes.json()) as { ok?: boolean; order?: { id: string; provider?: string } };
      const orderId = orderJson.order?.id;
      if (!orderId) {
        setError(copy.payError);
        return;
      }

      const sessionRes = await fetch("/api/payments/stripe/checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          orderId,
          locale,
          cancelPath: cancelPathWithSlash,
          returnTo,
          artwork,
        }),
      });
      if (!sessionRes.ok) {
        if (sessionRes.status === 503) {
          setError(copy.payNotConfigured);
          return;
        }
        setError(copy.payError);
        return;
      }
      const sessionJson = (await sessionRes.json()) as { ok?: boolean; url?: string };
      if (!sessionJson.url) {
        setError(copy.payError);
        return;
      }
      window.location.href = sessionJson.url;
    } catch {
      setError(copy.payError);
    } finally {
      setBusy(false);
    }
  }, [artwork, cancelPathWithSlash, copy.payError, copy.payNotConfigured, locale, priceJpy, returnTo]);

  if (!isSignedIn) {
    const loginHref = `${withLocale(locale, "/login")}?returnTo=${encodeURIComponent(cancelPathWithSlash)}`;
    return (
      <div className="space-y-3">
        <Link
          href={loginHref}
          className="opus-surface-metallic inline-flex w-full items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold tracking-[0.12em] text-black transition hover:opacity-95"
        >
          {copy.payMustSignIn}
        </Link>
        {error ? <p className="text-center text-xs text-red-200/85">{error}</p> : null}
      </div>
    );
  }

  if (!isCollector) {
    return <p className="text-center text-sm text-opus-warm/55">{copy.payArtistWrongRole}</p>;
  }

  if (stripeEnabled) {
    return (
      <div className="space-y-3">
        <button
          type="button"
          disabled={busy}
          onClick={() => void startStripe()}
          className="opus-surface-metallic inline-flex w-full items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold tracking-[0.12em] text-black transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {busy ? copy.payStarting : copy.payCta}
        </button>
        {error ? <p className="text-center text-xs text-red-200/85">{error}</p> : null}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Link
        href={successHref}
        className="opus-surface-metallic inline-flex w-full items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold tracking-[0.12em] text-black transition hover:opacity-95"
      >
        {copy.demoPayCta}
      </Link>
      <p className="text-center text-xs text-opus-warm/45">{copy.payNotConfigured}</p>
    </div>
  );
}
