/**
 * Trust strip (pattern: Web_Template finance-business trust / stats bands).
 * Values become live once Chronicle API wiring is complete.
 */
const stats = [
  { value: "Live soon", label: "Authenticated works", labelJa: "認定作品" },
  { value: "Live soon", label: "Edition records", labelJa: "エディション記録" },
  { value: "Live soon", label: "Collectors", labelJa: "コレクター" },
] as const;

export function StatsTrustRow() {
  return (
    <section
      className="border-y border-white/[0.08] bg-opus-slate/30 py-12 md:py-14"
      aria-labelledby="opus-stats-heading"
    >
      <h2 id="opus-stats-heading" className="sr-only">
        Trust metrics
      </h2>
      <div className="mx-auto grid max-w-6xl gap-10 px-6 md:grid-cols-3 md:gap-6 md:px-10">
        {stats.map((s) => (
          <div
            key={s.label}
            className="text-center md:border-r md:border-white/[0.06] md:pr-6 last:md:border-r-0 last:md:pr-0"
          >
            <p className="opus-text-metallic font-display text-3xl font-semibold tabular-nums md:text-4xl">
              {s.value}
            </p>
            <p className="mt-2 font-sans text-xs text-opus-warm/55">{s.label}</p>
            <p className="mt-0.5 font-sans text-[0.7rem] text-opus-warm/35">{s.labelJa}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
