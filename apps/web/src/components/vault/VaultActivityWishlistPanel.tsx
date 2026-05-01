"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Locale } from "@/i18n/config";
import { withLocale } from "@/i18n/paths";
import { readDemoList, type DemoListLine } from "@/lib/demoLists";

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
      {lines.map((line) => (
        <li
          key={line.slug}
          className="rounded-xl border border-white/[0.08] bg-opus-slate/20 p-4 shadow-opus-card"
        >
          <p className="line-clamp-2 font-display text-base text-opus-warm">{line.title}</p>
          <p className="mt-1 text-xs text-opus-warm/55">{line.artist}</p>
          <p className="mt-2 font-mono text-xs text-opus-warm/65">JPY {money.format(line.priceJpy)}</p>
          <p className="mt-1 text-[0.7rem] text-opus-warm/45">{new Date(line.addedAt).toLocaleString(locale)}</p>
          <div className="mt-3">
            <Link
              href={workHref(line.slug)}
              className="inline-flex rounded-md border border-opus-gold/25 bg-opus-gold/10 px-3 py-1.5 text-xs font-semibold text-opus-gold-light transition hover:border-opus-gold/40 hover:bg-opus-gold/[0.14]"
            >
              {labels.openWork}
            </Link>
          </div>
        </li>
      ))}
    </ul>
  );
}
