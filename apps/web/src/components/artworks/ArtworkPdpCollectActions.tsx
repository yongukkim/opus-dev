"use client";

import { useCallback, useState } from "react";
import {
  OPUS_DEMO_CART_KEY,
  OPUS_DEMO_WISHLIST_KEY,
  readDemoList,
  upsertDemoLine,
  writeDemoList,
  type DemoListLine,
} from "@/lib/demoLists";

export function ArtworkPdpCollectActions({
  slug,
  title,
  artist,
  priceJpy,
  addToCartLabel,
  addToWishlistLabel,
  addedToCartMessage,
  addedToWishlistMessage,
  demoNote,
}: {
  slug: string;
  title: string;
  artist: string;
  priceJpy: number;
  addToCartLabel: string;
  addToWishlistLabel: string;
  addedToCartMessage: string;
  addedToWishlistMessage: string;
  demoNote: string;
}) {
  const [banner, setBanner] = useState<string | null>(null);

  const flash = useCallback((msg: string) => {
    setBanner(msg);
    window.setTimeout(() => setBanner(null), 2400);
  }, []);

  const addLine = useCallback(
    (key: string, message: string) => {
      const line: DemoListLine = {
        slug,
        title: title.slice(0, 200),
        artist: artist.slice(0, 160),
        priceJpy,
        addedAt: new Date().toISOString(),
      };
      const prev = readDemoList(key);
      writeDemoList(key, upsertDemoLine(prev, line));
      flash(message);
    },
    [slug, title, artist, priceJpy, flash],
  );

  const btnClass =
    "rounded-lg border border-white/[0.14] bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-opus-warm/85 transition hover:border-opus-gold/40 hover:bg-white/[0.07] hover:text-opus-warm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-opus-gold/35";

  return (
    <div className="mt-4 max-w-sm">
      {banner ? (
        <p
          className="mb-3 rounded-lg border border-opus-gold/20 bg-opus-gold/10 px-3 py-2 text-xs text-opus-warm/80"
          role="status"
        >
          {banner}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <button type="button" className={btnClass} onClick={() => addLine(OPUS_DEMO_CART_KEY, addedToCartMessage)}>
          {addToCartLabel}
        </button>
        <button
          type="button"
          className={btnClass}
          onClick={() => addLine(OPUS_DEMO_WISHLIST_KEY, addedToWishlistMessage)}
        >
          {addToWishlistLabel}
        </button>
      </div>
      <p className="mt-3 text-[0.7rem] leading-relaxed text-opus-warm/40">{demoNote}</p>
    </div>
  );
}
