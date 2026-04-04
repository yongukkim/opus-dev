import Link from "next/link";
import Image from "next/image";
import type { Locale } from "@/i18n/config";
import type { Messages } from "@/i18n/types";
import { catalogImageSrcFromFile } from "@/lib/catalogImageUrl";
import { withLocale } from "@/i18n/paths";
import { readdir } from "node:fs/promises";
import path from "node:path";

const samples = [
  { id: "01", file: "unsplash_01_HzI3vf8wUwE.jpg", title: "Premiere I", meta: "Edition 1 / 42" },
  { id: "02", file: "unsplash_02_H2Z8A4af4Zo.jpg", title: "Premiere II", meta: "Edition 2 / 42" },
  { id: "03", file: "unsplash_03_4MksxMVbRrA.jpg", title: "Premiere III", meta: "Edition 3 / 42" },
  { id: "04", file: "unsplash_04_h7EvXCadies.jpg", title: "Premiere IV", meta: "Edition 4 / 42" },
  { id: "05", file: "unsplash_05_HI0GShPQegc.jpg", title: "Premiere V", meta: "Edition 5 / 42" },
  { id: "06", file: "unsplash_06_a5RK_uk5Ej0.jpg", title: "Premiere VI", meta: "Edition 6 / 42" },
  { id: "07", file: "unsplash_07_RBqC7kQoMIg.jpg", title: "Premiere VII", meta: "Edition 7 / 42" },
  { id: "08", file: "unsplash_08__sZ7R0C_xKY.jpg", title: "Premiere VIII", meta: "Edition 8 / 42" },
  { id: "09", file: "unsplash_09_QVRHf8Gc9Pk.jpg", title: "Premiere IX", meta: "Edition 9 / 42" },
  { id: "10", file: "unsplash_10_zl8hQxXZCeI.jpg", title: "Premiere X", meta: "Edition 10 / 42" },
  { id: "11", file: "unsplash_11_aVFTleL-L0g.jpg", title: "Premiere XI", meta: "Edition 11 / 42" },
  { id: "12", file: "unsplash_12_dPn-PAuwYss.jpg", title: "Premiere XII", meta: "Edition 12 / 42" },
  { id: "13", file: "unsplash_13_dKB6EJFLUaA.jpg", title: "Premiere XIII", meta: "Edition 13 / 42" },
  { id: "14", file: "unsplash_14_UG2Vqz5Q000.jpg", title: "Premiere XIV", meta: "Edition 14 / 42" },
  { id: "15", file: "unsplash_15_nuRF1oaw-Pg.jpg", title: "Premiere XV", meta: "Edition 15 / 42" },
  { id: "16", file: "unsplash_16_GB1sPyY2YpQ.jpg", title: "Premiere XVI", meta: "Edition 16 / 42" },
  { id: "17", file: "unsplash_17_Bqrr9yrKD1o.jpg", title: "Premiere XVII", meta: "Edition 17 / 42" },
  { id: "18", file: "unsplash_18_KC5btjnw0_s.jpg", title: "Premiere XVIII", meta: "Edition 18 / 42" },
  { id: "19", file: "unsplash_19_DQpHtE5WY-U.jpg", title: "Premiere XIX", meta: "Edition 19 / 42" },
  { id: "20", file: "unsplash_20_4hYSTQkZMNQ.jpg", title: "Premiere XX", meta: "Edition 20 / 42" },
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

export async function ArchivePreviewGrid({ locale, m }: { locale: Locale; m: Messages }) {
  const g = m.archiveGrid;
  const local = await listLocalArtworks();
  const useLocal = local.length > 0;
  const items = useLocal
    ? local.slice(0, 8).map((file, idx) => ({
        id: `local-${idx + 1}`,
        file,
        title: `Premiere ${idx + 1}`,
        meta: `Edition ${idx + 1} / 42`,
      }))
    : samples.slice(0, 8);

  return (
    <section className="py-20 md:py-28" aria-labelledby="opus-archive-preview-heading" aria-label={m.a11y.archivePreview}>
      <div className="mx-auto max-w-6xl px-6 md:px-10">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="opus-text-metallic-soft font-mono text-[0.65rem] uppercase tracking-[0.3em]">
              {g.kicker}
            </p>
            <h2
              id="opus-archive-preview-heading"
              className="opus-text-metallic mt-3 font-display text-2xl tracking-wide md:text-3xl"
            >
              {g.heading}
            </h2>
            <p className="mt-3 max-w-lg font-sans text-sm text-opus-warm/55">{g.body}</p>
          </div>
          <Link
            href={withLocale(locale, "/artworks")}
            className="shrink-0 border border-opus-gold/42 px-5 py-2.5 font-mono text-[0.65rem] uppercase tracking-[0.22em] text-opus-gold transition hover:border-opus-gold-light/55 hover:bg-opus-gold/10"
          >
            {g.viewAll}
          </Link>
        </div>

        <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                href={withLocale(locale, "/artworks")}
                className="group block overflow-hidden rounded-lg border border-white/[0.08] bg-opus-slate/30 shadow-opus-card transition hover:border-opus-gold/38"
              >
                <div className="relative aspect-[4/5] overflow-hidden bg-gradient-to-b from-[#1f1f1f] to-opus-charcoal">
                  <Image
                    src={catalogImageSrcFromFile(item.file, "thumb")}
                    alt={g.artwork}
                    fill
                    sizes="(min-width: 1024px) 220px, (min-width: 640px) 45vw, 90vw"
                    unoptimized
                    className="object-cover opacity-95 transition duration-700 group-hover:scale-[1.02] group-hover:opacity-100"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(222,184,146,0.18),transparent_60%)] opacity-70" />
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/75 via-black/35 to-transparent" />
                </div>
                <div className="border-t border-white/[0.06] px-4 py-4">
                  <p className="opus-text-metallic font-display text-sm tracking-wide">{item.title}</p>
                  <p className="mt-1 font-mono text-[0.65rem] text-opus-warm/45">{item.meta}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
