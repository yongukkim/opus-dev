"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function ArtworkCatalogNotFound() {
  const pathname = usePathname() ?? "";
  const seg = pathname.split("/").filter(Boolean)[0];
  const locale = seg === "ja" || seg === "en" ? seg : "ko";
  const archive = `/${locale}/artworks`;

  return (
    <main className="min-h-screen bg-opus-charcoal px-6 pb-24 pt-[calc(6.5rem+4rem)] text-opus-warm/80">
      <div className="mx-auto max-w-md text-center">
        <p className="opus-text-metallic-soft text-xs uppercase tracking-[0.35em]">OPUS</p>
        <h1 className="mt-6 font-display text-2xl text-opus-warm">404</h1>
        <p className="mt-4 text-sm text-opus-warm/55">
          {locale === "ja"
            ? "このカタログ項目は見つかりませんでした。"
            : locale === "en"
              ? "This catalog entry could not be found."
              : "카탈로그에서 해당 작품을 찾을 수 없습니다."}
        </p>
        <Link
          href={archive}
          className="mt-10 inline-block text-sm text-opus-gold underline-offset-4 hover:text-opus-gold-light hover:underline"
        >
          {locale === "ja"
            ? "← アーカイブへ"
            : locale === "en"
              ? "← Back to Archive"
              : "← 아카이브로"}
        </Link>
      </div>
    </main>
  );
}
