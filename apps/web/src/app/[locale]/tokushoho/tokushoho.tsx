import type { Messages } from "@/i18n/types";

/**
 * Japan Specified Commercial Transaction Act — draft placeholders; legal/tax review before launch.
 * ISO 27001 A.18.1.4 / APPI: public commercial disclosures; KO/JA/EN for UI only.
 */
export function TokushohoContent({ legal }: { legal: Messages["tokushoho"] }) {
  const s = legal.sections;
  const blocks = [
    s.sellerName,
    s.operator,
    s.address,
    s.phone,
    s.email,
    s.extraFees,
    s.payment,
    s.delivery,
    s.returns,
    s.env,
  ];

  return (
    <article className="max-w-none">
      <h1 className="font-display text-3xl text-opus-warm">{legal.h1}</h1>
      <p className="mt-1 text-sm text-opus-warm/50">{legal.statutory}</p>
      <p className="mt-4 text-sm text-opus-warm/70">{legal.intro}</p>
      <p className="mt-4 border-l border-opus-gold/35 pl-3 text-xs leading-relaxed text-opus-warm/55">
        {legal.nftNote}
      </p>

      <section className="mt-10 space-y-8">
        {blocks.map((block) => (
          <div key={block.title}>
            <h2 className="font-display text-xl text-opus-warm">{block.title}</h2>
            <p className="mt-2 text-opus-warm/75">{block.hint}</p>
          </div>
        ))}
      </section>
    </article>
  );
}
