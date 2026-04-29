"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * 404 for `/[locale]/artist/[slug]` (PR-10). Mirrors the releases
 * not-found pattern: client-side, infers the locale from the URL so we
 * don't have to thread params through, and links back to the home
 * Featured Artists rail (its closest sibling on the home IA).
 */
export default function ArtistNotFound() {
  const pathname = usePathname() ?? "";
  const seg = pathname.split("/").filter(Boolean)[0];
  const locale = seg === "ja" || seg === "en" ? seg : "ko";
  const home = `/${locale}`;

  const title =
    locale === "ja"
      ? "作家が見つかりません"
      : locale === "en"
        ? "Artist not found"
        : "작가를 찾을 수 없습니다";

  const body =
    locale === "ja"
      ? "ご指定の作家は公開を終了したか、URL が変更された可能性があります。"
      : locale === "en"
        ? "This artist may have been retired from public surfaces, or the URL has changed."
        : "요청하신 작가는 더 이상 공개되지 않았거나 주소가 변경되었습니다.";

  const cta =
    locale === "ja"
      ? "← 作家一覧へ"
      : locale === "en"
        ? "← Browse artist list"
        : "← 작가목록 다시 보기";

  return (
    <main className="min-h-screen bg-opus-charcoal px-6 pb-24 pt-[calc(var(--opus-header-plus-trust)+4rem)] text-opus-warm/80">
      <div className="mx-auto max-w-md text-center">
        <p className="opus-text-metallic-soft text-xs uppercase tracking-[0.35em]">OPUS</p>
        <h1 className="mt-6 font-display text-2xl text-opus-warm">404</h1>
        <p className="mt-4 font-display text-base text-opus-warm/85">{title}</p>
        <p className="mt-3 text-sm text-opus-warm/55">{body}</p>
        <Link
          href={home}
          className="mt-10 inline-block text-sm text-opus-gold underline-offset-4 hover:text-opus-gold-light hover:underline"
        >
          {cta}
        </Link>
      </div>
    </main>
  );
}
