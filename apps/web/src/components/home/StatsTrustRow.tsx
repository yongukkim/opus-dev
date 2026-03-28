import Image from "next/image";
import type { Messages } from "@/i18n/types";
import { readdir } from "node:fs/promises";
import path from "node:path";

const FALLBACK = [
  "unsplash_01_HzI3vf8wUwE.jpg",
  "unsplash_02_H2Z8A4af4Zo.jpg",
  "unsplash_03_4MksxMVbRrA.jpg",
] as const;

async function listLocalArtworks(): Promise<string[]> {
  const dir = path.join(process.cwd(), "public", "local-artworks");
  try {
    const files = await readdir(dir);
    return files
      .filter((f) => /\.(png|jpe?g|webp)$/i.test(f))
      .sort((a, b) => a.localeCompare(b, "en", { numeric: true, sensitivity: "base" }));
  } catch {
    return [];
  }
}

/**
 * Featured picks band (replaces "Live soon" stats):
 * week best / month best / year best.
 */
export async function StatsTrustRow({ m }: { m: Messages }) {
  const s = m.stats;
  const local = await listLocalArtworks();
  const useLocal = local.length >= 3;
  const base = useLocal ? "/local-artworks" : "/sample-artworks";
  const files = useLocal ? local.slice(0, 3) : [...FALLBACK];

  const picks = [
    { label: s.weekBest, file: files[0], tag: "WEEK" },
    { label: s.monthBest, file: files[1], tag: "MONTH" },
    { label: s.yearBest, file: files[2], tag: "YEAR" },
  ] as const;

  return (
    <section
      className="border-y border-white/[0.08] bg-opus-slate/30 py-12 md:py-14"
      aria-labelledby="opus-stats-heading"
    >
      <h2 id="opus-stats-heading" className="sr-only">
        {m.a11y.stats}
      </h2>
      <div className="mx-auto grid max-w-6xl gap-6 px-6 md:grid-cols-3 md:px-10">
        {picks.map((pick) => (
          <div
            key={pick.tag}
            className="group overflow-hidden rounded-xl border border-white/[0.08] bg-opus-charcoal/35 shadow-opus-card transition hover:border-opus-gold/25"
          >
            <div className="relative aspect-[16/10] overflow-hidden">
              <Image
                src={`${base}/${pick.file}`}
                alt={pick.label}
                fill
                sizes="(min-width: 1024px) 320px, 90vw"
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
