import { getDictionary } from "@/i18n/catalog";
import type { Messages } from "@/i18n/types";
import { normalizeLocale, withLocale } from "@/i18n/paths";
import { listOpenCollectorTransferListings, maskSellerId } from "@/lib/collectorTransferListings";
import Link from "next/link";

type Props = { params: Promise<{ locale: string }> };

function dateLabel(iso: string, locale: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const loc = locale === "ja" ? "ja-JP" : locale === "ko" ? "ko-KR" : "en-US";
  return d.toLocaleString(loc, { dateStyle: "medium", timeStyle: "short" });
}

function transferGenreLabel(ct: Messages["collectorTransfer"], key: string): string {
  const map: Record<string, string> = {
    "digital-painting": ct.genreOptDigitalPainting,
    illustration: ct.genreOptIllustration,
    photography: ct.genreOptPhotography,
    "3d": ct.genreOpt3d,
    generative: ct.genreOptGenerative,
    video: ct.genreOptVideo,
    "mixed-media": ct.genreOptMixedMedia,
    other: ct.genreOptOther,
  };
  return map[key] || key || "—";
}

export default async function CollectorTransferListingsPage({ params }: Props) {
  const { locale: raw } = await params;
  const locale = normalizeLocale(raw);
  const m = getDictionary(locale);
  const t = m.collectorTransfer;
  const rows = await listOpenCollectorTransferListings();

  return (
    <main className="min-h-screen px-6 pb-24 pt-[calc(6.5rem+4rem)] text-opus-warm/80">
      <div className="mx-auto max-w-3xl">
        <p className="opus-text-metallic-soft text-center text-xs uppercase tracking-[0.35em]">OPUS</p>
        <h1 className="mt-4 text-center font-display text-2xl text-opus-warm md:text-3xl">{t.listingsTitle}</h1>
        <p className="mx-auto mt-4 max-w-xl text-center text-sm text-opus-warm/55">{t.listingsSubtitle}</p>

        {rows.length === 0 ? (
          <p className="mt-14 text-center text-sm text-opus-warm/45">{t.listingsEmpty}</p>
        ) : (
          <ul className="mt-12 space-y-4">
            {rows.map((r) => {
              const tagList = (r.tags ?? "")
                .split(",")
                .map((x) => x.trim())
                .filter(Boolean)
                .slice(0, 12);
              return (
                <li
                  key={r.id}
                  className="rounded-xl border border-white/[0.08] bg-opus-slate/20 px-5 py-4 shadow-opus-card"
                >
                  <p className="font-display text-lg text-opus-warm">{r.artworkTitle}</p>
                  <p className="mt-1 text-sm text-opus-gold/90">
                    <span className="font-mono text-[0.65rem] uppercase tracking-[0.14em] text-opus-warm/35">
                      {t.listingsArtistPublic}
                    </span>{" "}
                    {r.artistPenName}
                  </p>
                  {r.editionRef ? (
                    <p className="mt-1 font-mono text-[0.7rem] text-opus-warm/45">{r.editionRef}</p>
                  ) : null}
                  <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm">
                    {r.genre ? (
                      <span className="text-opus-warm/55">
                        <span className="font-mono text-[0.65rem] uppercase tracking-[0.14em] text-opus-warm/35">
                          {t.listingsGenre}
                        </span>{" "}
                        {transferGenreLabel(t, r.genre)}
                      </span>
                    ) : null}
                    {r.year ? (
                      <span className="text-opus-warm/55">
                        <span className="font-mono text-[0.65rem] uppercase tracking-[0.14em] text-opus-warm/35">
                          {t.listingsYear}
                        </span>{" "}
                        {r.year}
                      </span>
                    ) : null}
                    <span className="text-opus-warm/55">
                      <span className="font-mono text-[0.65rem] uppercase tracking-[0.14em] text-opus-warm/35">
                        {t.listingsPrice}
                      </span>{" "}
                      <span className="text-opus-gold-light">¥{r.priceJpy.toLocaleString("ja-JP")}</span>
                    </span>
                    <span className="text-opus-warm/50">
                      <span className="font-mono text-[0.65rem] uppercase tracking-[0.14em] text-opus-warm/35">
                        {t.listingsSellerRef}
                      </span>{" "}
                      {maskSellerId(r.sellerId)} · {r.sellerRole}
                    </span>
                    <span className="text-opus-warm/45">
                      <span className="font-mono text-[0.65rem] uppercase tracking-[0.14em] text-opus-warm/35">
                        {t.listingsListedAt}
                      </span>{" "}
                      {dateLabel(r.createdAt, locale)}
                    </span>
                  </div>
                  {r.description ? (
                    <p className="mt-3 text-sm leading-relaxed text-opus-warm/55">{r.description}</p>
                  ) : null}
                  {tagList.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {tagList.map((tag) => (
                        <span
                          key={tag}
                          className="rounded border border-white/[0.08] bg-black/10 px-2 py-1 text-[0.7rem] text-opus-warm/60"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  ) : null}
                  {r.note ? <p className="mt-3 text-sm leading-relaxed text-opus-warm/50">{r.note}</p> : null}
                </li>
              );
            })}
          </ul>
        )}

        <p className="mx-auto mt-10 max-w-xl text-center text-xs leading-relaxed text-opus-warm/40">{t.listingsDemoNote}</p>

        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            href={withLocale(locale, "/vault/transfer/register")}
            className="opus-surface-metallic inline-flex items-center justify-center rounded-full px-6 py-2.5 text-sm font-semibold text-black transition hover:opacity-95"
          >
            {t.listingsRegisterCta}
          </Link>
          <Link
            href={withLocale(locale, "/")}
            className="text-sm text-opus-gold/80 underline-offset-4 hover:text-opus-gold-light hover:underline"
          >
            {t.listingsBackHome}
          </Link>
        </div>
      </div>
    </main>
  );
}
