import Link from "next/link";

/** Archive landing route — curated digital artwork entries. */
export default function ArtworksPage() {
  return (
    <main className="min-h-screen bg-opus-charcoal px-6 pb-24 pt-[calc(6.5rem+4rem)] text-center text-opus-warm/80">
      <p className="opus-text-metallic-soft text-sm uppercase tracking-[0.35em]">Archive</p>
      <h1 className="mt-4 font-display text-2xl text-opus-warm">Artworks</h1>
      <p className="mx-auto mt-4 max-w-md font-sans text-sm text-opus-warm/60">
        認定済みデジタルアートの一覧をここから閲覧できます。各作品ページで来歴・エディション情報を確認してください。
      </p>
      <Link
        href="/"
        className="mt-10 inline-block text-sm text-opus-gold underline-offset-4 hover:text-opus-gold-light hover:underline"
      >
        ← Back home
      </Link>
    </main>
  );
}
