"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Locale } from "@/i18n/config";
import type { ConsoleMessages } from "@/i18n/types";

function navClass(active: boolean) {
  if (active) {
    return "block rounded-md border border-[#DEB892]/40 bg-[#DEB892]/10 px-3 py-2 text-sm font-medium text-[#F6F4F0]";
  }
  return "block rounded-md px-3 py-2 text-sm font-medium text-[#F6F4F0]/70 transition hover:bg-white/5 hover:text-[#F6F4F0]";
}

/**
 * ISO 27001 A.9.2.1 (CLAUDE.md §4)
 * KO: 운영자 영역 내비게이션을 경로 기반으로만 강조해 잘못된 섹션 혼동을 줄인다.
 * JA: 運用者領域のナビをパス基準で強調し、誤ったセクションの混同を減らす。
 * EN: Highlight operator nav by pathname to reduce mistaken section context.
 */
export function ConsoleSidebarNav({
  locale,
  labels,
}: {
  locale: Locale;
  labels: ConsoleMessages["chrome"];
}) {
  const pathname = usePathname() ?? "";
  const home = `/${locale}/home`;
  const review = `/${locale}/review`;
  const payments = `/${locale}/payments`;

  return (
    <nav className="flex flex-1 flex-col gap-1 p-3 text-sm" aria-label="Console">
      <Link href={home} className={navClass(pathname === home)}>
        {labels.navHome}
      </Link>
      <Link href={review} className={navClass(pathname.startsWith(review))}>
        {labels.navReview}
      </Link>
      <Link href={payments} className={navClass(pathname.startsWith(payments))}>
        {labels.navPayments}
      </Link>
    </nav>
  );
}
