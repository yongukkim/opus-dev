"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * 404 for `/[locale]/provenance/[id]` (PR-18). Mirrors the artist /
 * curation not-found pattern: client-side, infers the locale from the
 * URL, and links back to the provenance index — its closest sibling
 * on the home IA and the place a visitor most likely meant to reach.
 */
export default function ProvenanceListingNotFound() {
  const pathname = usePathname() ?? "";
  const seg = pathname.split("/").filter(Boolean)[0];
  const locale = seg === "ja" || seg === "en" ? seg : "ko";
  const indexHref = `/${locale}/provenance`;

  const title =
    locale === "ja"
      ? "出品が見つかりません"
      : locale === "en"
        ? "Listing not found"
        : "리스팅을 찾을 수 없습니다";

  const body =
    locale === "ja"
      ? "ご指定の来歴出品は取引を終了したか、URLが変更された可能性があります。"
      : locale === "en"
        ? "This custody-transfer listing may have been closed, or the URL has changed."
        : "요청하신 来歴 리스팅은 거래가 종료되었거나 URL이 변경되었을 수 있습니다.";

  const cta =
    locale === "ja"
      ? "← 来歴一覧を見る"
      : locale === "en"
        ? "← Browse provenance listings"
        : "← 来歴 목록 다시 보기";

  return (
    <main className="min-h-screen bg-opus-charcoal px-6 pb-24 pt-[calc(6.5rem+4rem)] text-opus-warm/80">
      <div className="mx-auto max-w-md text-center">
        <p className="opus-text-metallic-soft text-xs uppercase tracking-[0.35em]">OPUS</p>
        <h1 className="mt-6 font-display text-2xl text-opus-warm">404</h1>
        <p className="mt-4 font-display text-base text-opus-warm/85">{title}</p>
        <p className="mt-3 text-sm text-opus-warm/55">{body}</p>
        <Link
          href={indexHref}
          className="mt-10 inline-block text-sm text-opus-gold underline-offset-4 hover:text-opus-gold-light hover:underline"
        >
          {cta}
        </Link>
      </div>
    </main>
  );
}
