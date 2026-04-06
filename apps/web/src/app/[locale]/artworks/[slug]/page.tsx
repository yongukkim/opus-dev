import { ArtworkCatalogMiniCard } from "@/components/artworks/ArtworkCatalogMiniCard";
import { ArtworkPdpCollectActions } from "@/components/artworks/ArtworkPdpCollectActions";
import { getDictionary } from "@/i18n/catalog";
import { normalizeLocale, withLocale } from "@/i18n/paths";
import { AppInstallCallout } from "@/components/AppInstallCallout";
import { catalogImageSrcFromFile, type CatalogImageVariant } from "@/lib/catalogImageUrl";
import { hasDemoSessionFromCookies } from "@/lib/demoSession";
import {
  demoListPriceJpy,
  loadCatalogFiles,
  parseTitleArtist,
  pickRelatedCatalogEntries,
  pickSameArtistCatalogEntries,
  resolveArtworkBySlug,
  TOTAL_EDITIONS,
} from "@/lib/artworksCatalog";
import Image from "next/image";
import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ locale: string; slug: string }> };

/** Cover column width ≈ 2/3 of previous max-w-md (28rem). */
const COVER_MAX = "max-w-[18.75rem]";

export default async function ArtworkDetailPage({ params }: Props) {
  const { locale: raw, slug } = await params;
  const locale = normalizeLocale(raw);
  const resolved = await resolveArtworkBySlug(slug);
  if (!resolved) notFound();

  const cookieStore = await cookies();
  const hasSession = hasDemoSessionFromCookies(cookieStore);
  const coverVariant: CatalogImageVariant = hasSession ? "vault" : "preview";

  const { files } = await loadCatalogFiles();
  const m = getDictionary(locale);
  const a = m.artworks;
  const { title, artist } = parseTitleArtist(resolved.file, resolved.globalIndex);
  const editionFraction = `${resolved.globalIndex + 1}/${TOTAL_EDITIONS}`;
  const editionLine = `${a.editionLabel} ${editionFraction}`;
  const priceJpy = demoListPriceJpy(resolved.globalIndex);
  const priceFmt = `¥${priceJpy.toLocaleString("ja-JP")}`;

  const sameArtistEntries = pickSameArtistCatalogEntries(files, resolved.file, artist, 8);
  const sameFileSet = new Set(sameArtistEntries.map((e) => e.file));
  const relatedEntries = pickRelatedCatalogEntries(files, resolved.file, resolved.globalIndex, 14)
    .filter((e) => !sameFileSet.has(e.file))
    .slice(0, 6);

  const vaultReturn = withLocale(locale, "/vault");
  const checkoutPath = `${withLocale(locale, "/checkout")}?artwork=${encodeURIComponent(title)}&priceJpy=${String(priceJpy)}&returnTo=${encodeURIComponent(vaultReturn)}`;
  const loginPath = `${withLocale(locale, "/login")}?returnTo=${encodeURIComponent(checkoutPath)}`;

  const homeHref = withLocale(locale, "/");
  const archiveHref = withLocale(locale, "/artworks");

  const specRowClass =
    "border-b border-white/[0.06] align-top [&_th]:py-3 [&_th]:pr-4 [&_th]:text-left [&_td]:py-3";

  const railClass = "-mx-6 overflow-x-auto overflow-y-hidden px-6 pb-1 md:mx-0 md:px-0 [scrollbar-width:thin]";

  return (
    <main className="min-h-screen bg-opus-charcoal px-6 pb-24 pt-[calc(6.5rem+4rem)] text-opus-warm/80">
      <div className="mx-auto max-w-4xl">
        <p className="font-mono text-[0.65rem] uppercase tracking-[0.28em] text-opus-warm/40">{a.kicker}</p>

        <nav className="mt-4" aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-opus-warm/50">
            <li>
              <Link href={homeHref} className="transition hover:text-opus-gold-light">
                {a.detailBreadcrumbHome}
              </Link>
            </li>
            <li className="text-opus-warm/25" aria-hidden>
              /
            </li>
            <li>
              <Link href={archiveHref} className="transition hover:text-opus-gold-light">
                {a.detailBreadcrumbArchive}
              </Link>
            </li>
            <li className="text-opus-warm/25" aria-hidden>
              /
            </li>
            <li className="max-w-[min(100%,14rem)] truncate text-opus-warm/65 sm:max-w-md">{title}</li>
          </ol>
        </nav>

        <div className="mt-8 flex flex-col gap-8 border-t border-white/[0.06] pt-8 lg:flex-row lg:items-start lg:gap-10">
          <div className={`shrink-0 ${COVER_MAX} w-full lg:mx-0`}>
            <div
              className={`relative mx-auto aspect-[4/5] w-full ${COVER_MAX} overflow-hidden rounded-lg border border-white/[0.08] bg-gradient-to-b from-[#1f1f1f] to-opus-charcoal shadow-opus-card`}
            >
              <Image
                src={catalogImageSrcFromFile(resolved.file, coverVariant)}
                alt={`${title} — ${artist}`}
                fill
                priority
                sizes="(min-width: 1024px) 300px, (min-width: 640px) 40vw, 85vw"
                unoptimized
                className="object-cover opacity-95"
              />
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <h1 className="font-display text-xl leading-snug tracking-wide text-opus-warm md:text-2xl">{title}</h1>
            <p className="mt-2 text-sm text-opus-warm/60">
              <span className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-opus-warm/40">
                {a.detailArtistLabel}
              </span>{" "}
              <span className="text-opus-warm/75">{artist}</span>
            </p>

            <ul className="mt-5 space-y-2 border-b border-white/[0.06] pb-5">
              <li className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <span className="font-display text-2xl text-opus-gold-light md:text-[1.65rem]">{priceFmt}</span>
                <span className="text-[0.7rem] text-opus-warm/45">{a.detailPriceTaxNote}</span>
              </li>
              <li className="font-mono text-[0.7rem] text-opus-warm/50">{a.detailStockNote}</li>
              <li className="font-mono text-[0.7rem] uppercase tracking-[0.16em] text-opus-warm/45">{editionLine}</li>
            </ul>

            <div className="mt-6">
              <Link
                href={loginPath}
                className="opus-surface-metallic inline-flex w-full max-w-sm items-center justify-center rounded-lg px-6 py-3 text-sm font-semibold tracking-[0.12em] text-black transition hover:opacity-95"
              >
                {a.detailBuyCta}
              </Link>
              <p className="mt-2 font-mono text-[0.65rem] uppercase tracking-[0.16em] text-opus-warm/35">{a.buyHint}</p>
              <p className="mt-3 text-xs leading-relaxed text-opus-warm/45">{a.detailDemoNote}</p>
              <AppInstallCallout
                m={m}
                title={a.detailAppRequiredTitle}
                body={a.detailAppRequiredBody}
                iosLabel={a.detailAppRequiredIos}
                androidLabel={a.detailAppRequiredAndroid}
                comingSoonLabel={a.detailAppRequiredComingSoon}
                className="mt-5 max-w-sm rounded-xl border border-white/[0.08] bg-opus-charcoal/30 px-5 py-5"
              />

              <ArtworkPdpCollectActions
                slug={slug}
                title={title}
                artist={artist}
                priceJpy={priceJpy}
                addToCartLabel={a.detailAddToCart}
                addToWishlistLabel={a.detailAddToWishlist}
                addedToCartMessage={a.detailAddedToCart}
                addedToWishlistMessage={a.detailAddedToWishlist}
                demoNote={a.detailCollectDemoNote}
              />
            </div>

            <table className="mt-8 w-full border-t border-white/[0.08] text-sm">
              <tbody>
                <tr className={specRowClass}>
                  <th scope="row" className="w-[7.5rem] font-mono text-[0.65rem] uppercase tracking-[0.14em] text-opus-warm/45">
                    {a.detailSpecArtist}
                  </th>
                  <td className="text-opus-warm/80">{artist}</td>
                </tr>
                <tr className={specRowClass}>
                  <th scope="row" className="font-mono text-[0.65rem] uppercase tracking-[0.14em] text-opus-warm/45">
                    {a.detailSpecEdition}
                  </th>
                  <td className="font-mono text-[0.7rem] text-opus-warm/75">{editionLine}</td>
                </tr>
                <tr className={specRowClass}>
                  <th scope="row" className="font-mono text-[0.65rem] uppercase tracking-[0.14em] text-opus-warm/45">
                    {a.detailSpecFormat}
                  </th>
                  <td className="text-opus-warm/75">{a.detailFormatValue}</td>
                </tr>
              </tbody>
            </table>

            <section className="mt-8 border-t border-white/[0.06] pt-6">
              <h2 className="font-mono text-[0.65rem] uppercase tracking-[0.22em] text-opus-warm/45">{a.detailAboutHeading}</h2>
              <p className="mt-3 text-sm leading-relaxed text-opus-warm/60">{a.detailAboutBody}</p>
            </section>
          </div>
        </div>

        <section className="mt-16 border-t border-white/[0.08] pt-10">
          <h2 className="font-mono text-[0.65rem] uppercase tracking-[0.24em] text-opus-warm/45">{a.detailPrecautionsHeading}</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed text-opus-warm/55 marker:text-opus-gold/40">
            {a.detailPrecautionBullets.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        </section>

        {relatedEntries.length > 0 ? (
          <section className="mt-12 border-t border-white/[0.06] pt-10" aria-labelledby="related-heading">
            <h2 id="related-heading" className="font-mono text-[0.65rem] uppercase tracking-[0.24em] text-opus-warm/45">
              {a.detailRelatedHeading}
            </h2>
            <p className="mt-2 max-w-xl text-sm text-opus-warm/50">{a.detailRelatedLead}</p>
            <div className={railClass}>
              <div className="flex w-max snap-x snap-mandatory gap-3 pt-4">
                {relatedEntries.map((e) => (
                  <ArtworkCatalogMiniCard
                    key={e.file}
                    locale={locale}
                    file={e.file}
                    globalIndex={e.globalIndex}
                  />
                ))}
              </div>
            </div>
          </section>
        ) : null}

        <section className="mt-12 border-t border-white/[0.06] pt-10" aria-labelledby="same-artist-heading">
          <h2 id="same-artist-heading" className="font-mono text-[0.65rem] uppercase tracking-[0.24em] text-opus-warm/45">
            {a.detailSameArtistHeading}
          </h2>
          <p className="mt-2 max-w-xl text-sm text-opus-warm/50">{a.detailSameArtistLead}</p>
          {sameArtistEntries.length > 0 ? (
            <div className={railClass}>
              <div className="flex w-max snap-x snap-mandatory gap-3 pt-4">
                {sameArtistEntries.map((e) => (
                  <ArtworkCatalogMiniCard
                    key={e.file}
                    locale={locale}
                    file={e.file}
                    globalIndex={e.globalIndex}
                  />
                ))}
              </div>
            </div>
          ) : (
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-opus-warm/45">{a.detailSameArtistEmpty}</p>
          )}
          <div className="mt-6">
            <Link
              href={archiveHref}
              className="inline-flex text-sm font-medium text-opus-gold underline-offset-4 hover:text-opus-gold-light hover:underline"
            >
              {a.detailMoreInArchive}
            </Link>
          </div>
        </section>

        <div className="mt-12 border-t border-white/[0.06] pt-8">
          <Link
            href={archiveHref}
            className="text-sm text-opus-gold/80 underline-offset-4 hover:text-opus-gold-light hover:underline"
          >
            {a.detailBackArchive}
          </Link>
        </div>
      </div>
    </main>
  );
}
