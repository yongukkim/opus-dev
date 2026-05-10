"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import {
  OPUS_DEMO_CART_KEY,
  OPUS_DEMO_WISHLIST_KEY,
  isSafeDemoThumbnailSrc,
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
  afterWishlistHref,
  thumbnailSrc,
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
  /** Same-origin preview URL for activity list cards (catalog or submission API path). */
  thumbnailSrc: string;
  afterWishlistHref?: string;
}) {
  const [banner, setBanner] = useState<string | null>(null);
  const router = useRouter();

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
        ...(isSafeDemoThumbnailSrc(thumbnailSrc) ? { thumbnailSrc: thumbnailSrc.trim() } : {}),
      };
      const prev = readDemoList(key);
      writeDemoList(key, upsertDemoLine(prev, line));
      flash(message);
    },
    [slug, title, artist, priceJpy, thumbnailSrc, flash],
  );

  const btnClass =
    "rounded-lg border border-white/[0.14] bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-opus-warm/85 transition hover:border-opus-gold/40 hover:bg-white/[0.07] hover:text-opus-warm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-opus-gold/35";

  return (
    <div className="mt-4 max-w-sm">
      {banner ? (
        <p
          className="mb-3 rounded-lg border border-opus-gold/20 bg-opus-gold/10 px-3 py-2 text-sm text-opus-warm/85"
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
          onClick={() => {
            addLine(OPUS_DEMO_WISHLIST_KEY, addedToWishlistMessage);
            if (afterWishlistHref) {
              window.setTimeout(() => router.push(afterWishlistHref), 160);
            }
          }}
        >
          {addToWishlistLabel}
        </button>
      </div>
      <p className="opus-pdp-caption mt-3">{demoNote}</p>
    </div>
  );
}
