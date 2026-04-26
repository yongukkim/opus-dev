import Image from "next/image";
import type { Messages } from "@/i18n/types";
import { listLocalArtworks } from "@/lib/artworksCatalog";
import { catalogImageSrcFromFile } from "@/lib/catalogImageUrl";
import { listApprovedArtistSubmissions } from "@/lib/privateStorage";

const TAGS = ["WEEK", "MON", "YEAR"] as const;

/**
 * Featured picks band — images must not fall back to removed demo catalog files.
 * Priority: operator-approved submissions → optional local `public/local-artworks`
 * (dev) → empty copy when neither has enough material.
 */
export async function StatsTrustRow({ m }: { m: Messages }) {
  const s = m.stats;
  const approved = await listApprovedArtistSubmissions(3);
  const local = await listLocalArtworks();

  type Pick = { label: string; tag: string; imageSrc: string };

  let picks: Pick[] = [];

  if (approved.length > 0) {
    picks = approved.slice(0, 3).map((rec, i) => ({
      label: [s.weekBest, s.monthBest, s.yearBest][i]!,
      tag: TAGS[i]!,
      imageSrc: `/api/artwork-submissions/${rec.id}/public-preview`,
    }));
  } else if (local.length >= 3) {
    picks = [local[0]!, local[1]!, local[2]!].map((file, i) => ({
      label: [s.weekBest, s.monthBest, s.yearBest][i]!,
      tag: TAGS[i]!,
      imageSrc: catalogImageSrcFromFile(file, "thumb"),
    }));
  }

  if (picks.length === 0) {
    return (
      <section
        className="border-y border-white/[0.08] bg-opus-slate/30 py-12 md:py-14"
        aria-labelledby="opus-stats-heading"
      >
        <h2 id="opus-stats-heading" className="sr-only">
          {m.a11y.stats}
        </h2>
        <p className="mx-auto max-w-xl px-6 text-center text-sm leading-relaxed text-opus-warm/50 md:px-10">
          {s.empty}
        </p>
      </section>
    );
  }

  const gridCols =
    picks.length === 1
      ? "grid grid-cols-1 md:mx-auto md:max-w-md"
      : picks.length === 2
        ? "grid grid-cols-1 sm:grid-cols-2"
        : "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3";

  return (
    <section
      className="border-y border-white/[0.08] bg-opus-slate/30 py-12 md:py-14"
      aria-labelledby="opus-stats-heading"
    >
      <h2 id="opus-stats-heading" className="sr-only">
        {m.a11y.stats}
      </h2>
      <div className={`mx-auto max-w-6xl gap-6 px-6 md:px-10 ${gridCols}`}>
        {picks.map((pick) => (
          <div
            key={pick.tag}
            className="group overflow-hidden rounded-xl border border-white/[0.08] bg-opus-charcoal/35 shadow-opus-card transition hover:border-opus-gold/25"
          >
            <div className="relative aspect-[16/10] overflow-hidden">
              <Image
                src={pick.imageSrc}
                alt={pick.label}
                fill
                sizes="(min-width: 1024px) 320px, 90vw"
                unoptimized
                className="object-cover opacity-95 transition duration-700 group-hover:scale-[1.02] group-hover:opacity-100"
              />
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(222,184,146,0.16),transparent_60%)] opacity-70" />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/80 via-black/35 to-transparent" />
              <div className="absolute left-4 top-4 rounded-full border border-opus-gold/35 bg-black/35 px-3 py-1 font-mono text-[0.6rem] uppercase tracking-[0.28em] text-opus-warm/80 backdrop-blur">
                {pick.tag}
              </div>
            </div>
            <div className="px-5 py-5">
              <p className="opus-text-metallic font-display text-lg tracking-[0.08em]">{pick.label}</p>
              <p className="mt-1 text-xs text-opus-warm/45">{s.caption}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
