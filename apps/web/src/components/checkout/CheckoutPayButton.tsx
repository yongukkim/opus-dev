"use client";

import Link from "next/link";
import type { Locale } from "@/i18n/config";
import { withLocale } from "@/i18n/paths";

export type CheckoutPayCopy = {
  payError: string;
  demoPayCta: string;
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
  isSignedIn,
  isCollector,
  copy,
}: {
  locale: Locale;
  artwork: string;
  priceJpy: number;
  returnTo: string;
  successHref: string;
  isSignedIn: boolean;
  isCollector: boolean;
  copy: CheckoutPayCopy;
}) {
  const cancelQs = new URLSearchParams({
    ...(artwork ? { artwork } : {}),
    priceJpy: String(priceJpy),
    returnTo,
  }).toString();
  const cancelPathWithSlash = `${withLocale(locale, "/checkout")}${cancelQs ? `?${cancelQs}` : ""}`;

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
      </div>
    );
  }

  if (!isCollector) {
    return <p className="text-center text-sm text-opus-warm/55">{copy.payArtistWrongRole}</p>;
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
