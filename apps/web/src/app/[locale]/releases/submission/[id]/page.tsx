import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AppInstallCallout } from "@/components/AppInstallCallout";
import { ArtworkPdpCollectActions } from "@/components/artworks/ArtworkPdpCollectActions";
import { getDictionary } from "@/i18n/catalog";
import { normalizeLocale, withLocale } from "@/i18n/paths";
import { getSubmissionById } from "@/lib/privateStorage";

type Props = { params: Promise<{ locale: string; id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: raw, id } = await params;
  const locale = normalizeLocale(raw);
  const d = getDictionary(locale);
  const submission = await getSubmissionById(id);
  if (!submission || (submission.reviewStatus ?? "pending_review") !== "approved") {
    return {
      title: d.meta.releasesIndexTitle,
      description: d.meta.releasesIndexDescription,
    };
  }
  return {
    title: d.meta.releaseTitleTpl
      .replace("{title}", submission.artworkTitle)
      .replace("{artist}", submission.nickname || submission.artistName),
    description: d.meta.releaseDescriptionTpl
      .replace("{title}", submission.artworkTitle)
      .replace("{artist}", submission.nickname || submission.artistName),
  };
}

export default async function SubmissionReleaseDetailPage({ params }: Props) {
  const { locale: raw, id } = await params;
  const locale = normalizeLocale(raw);
  const m = getDictionary(locale);
  const a = m.artworks;

  const submission = await getSubmissionById(id);
  if (!submission || (submission.reviewStatus ?? "pending_review") !== "approved") {
    notFound();
  }

  const title = submission.artworkTitle;
  const artist = submission.nickname || submission.artistName;
  const priceJpy = submission.priceJpy ?? 0;
  const priceFmt = `¥${priceJpy.toLocaleString("ja-JP")}`;
  const editionLine = `${a.editionLabel} 1/${submission.editionTotal}`;

  const homeHref = withLocale(locale, "/");
  const archiveHref = withLocale(locale, "/releases");
  const vaultReturn = withLocale(locale, "/vault");
  const checkoutPath = `${withLocale(locale, "/checkout")}?artwork=${encodeURIComponent(title)}&priceJpy=${String(priceJpy)}&returnTo=${encodeURIComponent(vaultReturn)}`;
  const loginPath = `${withLocale(locale, "/login")}?returnTo=${encodeURIComponent(checkoutPath)}`;

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
          <div className="w-full max-w-[18.75rem] shrink-0">
            <div className="relative mx-auto aspect-[4/5] w-full overflow-hidden rounded-lg border border-white/[0.08] bg-gradient-to-b from-[#1f1f1f] to-opus-charcoal shadow-opus-card">
              <img
                src={`/api/artwork-submissions/${id}/public-preview`}
                alt={`${title} — ${artist}`}
                className="h-full w-full object-cover opacity-95"
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
                slug={`submission-${id}`}
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
          </div>
        </div>

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
