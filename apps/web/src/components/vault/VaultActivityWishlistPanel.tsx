"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Locale } from "@/i18n/config";
import { withLocale } from "@/i18n/paths";
import { readDemoList, resolveDemoLineThumbnail, type DemoListLine } from "@/lib/demoLists";

type Props = {
  locale: Locale;
  listKey: string;
  labels: {
    empty: string;
    openWork: string;
  };
};

export function VaultActivityWishlistPanel({ locale, listKey, labels }: Props) {
  const [lines, setLines] = useState<DemoListLine[]>([]);

  useEffect(() => {
    const next = readDemoList(listKey);
    next.sort((a, b) => Date.parse(b.addedAt) - Date.parse(a.addedAt));
    setLines(next);
  }, [listKey]);

  const hasItems = lines.length > 0;
  const money = useMemo(() => new Intl.NumberFormat(locale === "ja" ? "ja-JP" : "ko-KR"), [locale]);

  function workHref(slug: string): string {
    if (slug.startsWith("submission-")) {
      return withLocale(locale, `/releases/submission/${encodeURIComponent(slug.slice("submission-".length))}`);
    }
    return withLocale(locale, `/releases/${encodeURIComponent(slug)}`);
  }

  if (!hasItems) {
    return <p className="text-sm text-opus-warm/50">{labels.empty}</p>;
  }

  return (
    <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {lines.map((line) => {
        const thumb = resolveDemoLineThumbnail(line);
        return (
          <li
            key={line.slug}
            className="overflow-hidden rounded-xl border border-white/[0.08] bg-opus-slate/20 shadow-opus-card"
          >
            <div className="flex gap-3 p-3 sm:gap-4 sm:p-4">
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg border border-white/[0.08] bg-gradient-to-b from-[#1f1f1f] to-opus-charcoal sm:h-28 sm:w-28">
                {thumb ? (
                  // eslint-disable-next-line @next/next/no-img-element -- same-origin API raster; matches vault collection pattern
                  <img
                    src={thumb}
                    alt={`${line.title} — ${line.artist}`}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover opacity-95"
                  />
                ) : (
                  <div
                    className="h-full w-full bg-[radial-gradient(ellipse_at_30%_20%,rgba(222,184,146,0.12),transparent_55%)]"
                    aria-hidden
                  />
                )}
              </div>
              <div className="flex min-w-0 flex-1 flex-col justify-between gap-2">
                <div>
                  <p className="line-clamp-2 font-display text-base text-opus-warm">{line.title}</p>
                  <p className="mt-1 text-xs text-opus-warm/55">{line.artist}</p>
                  <p className="mt-2 font-mono text-xs text-opus-warm/65">JPY {money.format(line.priceJpy)}</p>
                  <p className="mt-1 text-[0.7rem] text-opus-warm/45">
                    {new Date(line.addedAt).toLocaleString(locale)}
                  </p>
                </div>
                <div>
                  <Link
                    href={workHref(line.slug)}
                    className="inline-flex rounded-md border border-opus-gold/25 bg-opus-gold/10 px-3 py-1.5 text-xs font-semibold text-opus-gold-light transition hover:border-opus-gold/40 hover:bg-opus-gold/[0.14]"
                  >
                    {labels.openWork}
                  </Link>
                </div>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
