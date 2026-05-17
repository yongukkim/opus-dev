"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Locale } from "@/i18n/config";
import type { ConsoleMessages } from "@/i18n/types";
import type { ConsoleStatsNavItem } from "@/lib/consoleStatsNav";

function navClass(active: boolean) {
  if (active) {
    return "block rounded-md border border-[#DEB892]/40 bg-[#DEB892]/10 px-3 py-2 text-sm font-medium text-[#F6F4F0]";
  }
  return "block rounded-md px-3 py-2 text-sm font-medium text-[#F6F4F0]/70 transition hover:bg-white/5 hover:text-[#F6F4F0]";
}

function statsNavClass(active: boolean) {
  if (active) {
    return "block rounded-md border border-[#DEB892]/30 bg-[#DEB892]/8 py-1.5 pl-3 pr-2 text-xs font-medium text-[#F6F4F0]";
  }
  return "block rounded-md py-1.5 pl-3 pr-2 text-xs font-medium text-[#F6F4F0]/60 transition hover:bg-white/5 hover:text-[#F6F4F0]";
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
  statsNav,
}: {
  locale: Locale;
  labels: ConsoleMessages["chrome"];
  statsNav: { sectionHeading: string; items: ConsoleStatsNavItem[] };
}) {
  const pathname = usePathname() ?? "";
  const home = `/${locale}/home`;
  const review = `/${locale}/review`;
  const payments = `/${locale}/payments`;
  const onHome = pathname === home || pathname === `${home}/`;

  return (
    <nav className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto p-3 text-sm" aria-label="Console">
      <Link href={home} className={navClass(onHome)}>
        {labels.navHome}
      </Link>
      <Link href={review} className={navClass(pathname.startsWith(review))}>
        {labels.navReview}
      </Link>
      <Link href={payments} className={navClass(pathname.startsWith(payments))}>
        {labels.navPayments}
      </Link>

      <p className="mt-4 px-3 pb-1 font-mono text-[0.6rem] font-medium uppercase tracking-[0.28em] text-[#F6F4F0]/40">
        {statsNav.sectionHeading}
      </p>
      <ul className="flex flex-col gap-0.5" aria-label={statsNav.sectionHeading}>
        {statsNav.items.map((item) => {
          const active = pathname === item.href || pathname === `${item.href}/`;
          return (
            <li key={item.id}>
              <Link href={item.href} className={statsNavClass(active)}>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
