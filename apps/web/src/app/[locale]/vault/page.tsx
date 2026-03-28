import { getDictionary } from "@/i18n/catalog";
import { normalizeLocale } from "@/i18n/paths";

type Props = { params: Promise<{ locale: string }> };

export default async function VaultOverviewPage({ params }: Props) {
  const { locale: raw } = await params;
  const m = getDictionary(normalizeLocale(raw));
  const v = m.vault;

  return (
    <main className="p-6 md:p-10">
      <p className="opus-text-metallic-soft font-mono text-[0.65rem] uppercase tracking-[0.28em]">{v.overviewKicker}</p>
      <h1 className="mt-3 font-display text-2xl text-opus-warm md:text-3xl">{v.overviewTitle}</h1>
      <p className="mt-4 max-w-xl font-sans text-sm leading-relaxed text-opus-warm/55">{v.overviewBody}</p>
      <div className="mt-10 grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-white/[0.08] bg-opus-slate/25 p-6">
          <p className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-opus-warm/40">{v.balance}</p>
          <p className="opus-text-metallic mt-2 font-display text-xl">—</p>
        </div>
        <div className="rounded-xl border border-white/[0.08] bg-opus-slate/25 p-6">
          <p className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-opus-warm/40">{v.activeBids}</p>
          <p className="opus-text-metallic mt-2 font-display text-xl">—</p>
        </div>
      </div>
    </main>
  );
}
