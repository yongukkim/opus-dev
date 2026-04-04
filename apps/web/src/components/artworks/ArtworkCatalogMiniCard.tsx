import { catalogImageSrcFromFile } from "@/lib/catalogImageUrl";
import { demoListPriceJpy, encodeArtworkSlug, parseTitleArtist } from "@/lib/artworksCatalog";
import type { Locale } from "@/i18n/config";
import { withLocale } from "@/i18n/paths";
import Image from "next/image";
import Link from "next/link";

export function ArtworkCatalogMiniCard({
  locale,
  file,
  globalIndex,
}: {
  locale: Locale;
  file: string;
  globalIndex: number;
}) {
  const { title, artist } = parseTitleArtist(file, globalIndex);
  const href = withLocale(locale, `/artworks/${encodeArtworkSlug(file)}`);
  const priceFmt = `¥${demoListPriceJpy(globalIndex).toLocaleString("ja-JP")}`;

  return (
    <Link
      href={href}
      className="group block w-[8.75rem] shrink-0 snap-start rounded-lg border border-white/[0.08] bg-opus-slate/15 p-2 transition hover:border-opus-gold/25 hover:bg-opus-slate/25"
    >
      <div className="relative aspect-[4/5] overflow-hidden rounded-md border border-white/[0.06] bg-gradient-to-b from-[#1f1f1f] to-opus-charcoal">
        <Image
          src={catalogImageSrcFromFile(file, "thumb")}
          alt={`${title} — ${artist}`}
          fill
          sizes="140px"
          unoptimized
          className="object-cover opacity-90 transition group-hover:opacity-100"
        />
      </div>
      <p className="mt-2 line-clamp-2 min-h-[2.5rem] font-display text-[0.7rem] leading-snug tracking-wide text-opus-warm/85">
        {title}
      </p>
      <p className="mt-0.5 line-clamp-1 text-[0.6rem] text-opus-warm/45">{artist}</p>
      <p className="mt-1 font-mono text-[0.65rem] text-opus-gold/85">{priceFmt}</p>
    </Link>
  );
}
