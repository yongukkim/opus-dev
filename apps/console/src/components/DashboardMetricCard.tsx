/**
 * Operator dashboard KPI tile — two columns with a large tabular count (same rhythm as the pending-review card).
 * ISO 27001 A.18.1.4 — aggregate display only; no per-user listings on this surface.
 * KO: 지표 타일은 집계 수치만 표시하고 개인별 목록은 노출하지 않는다.
 * JA: 指標タイルは集計のみを表示し、個人別一覧は出さない。
 * EN: KPI tiles show aggregates only, not per-user listings.
 */
export function DashboardMetricCard({
  id,
  title,
  body,
  value,
  suffix,
  unavailableLabel,
}: {
  id?: string;
  title: string;
  body: string;
  value: number | null;
  suffix: string;
  unavailableLabel: string;
}) {
  return (
    <div
      id={id}
      className="scroll-mt-6 grid grid-cols-1 gap-4 rounded-lg border border-white/10 bg-[#161616] p-5 shadow-sm md:grid-cols-[minmax(0,1fr)_minmax(5.5rem,32%)] md:items-stretch md:gap-6 md:p-6"
      role="group"
      aria-label={value !== null ? `${title}. ${value} ${suffix}` : unavailableLabel}
    >
      <div className="flex min-h-0 min-w-0 flex-col">
        <h2 className="text-sm font-semibold text-[#F6F4F0]">{title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-[#F6F4F0]/65">{body}</p>
      </div>
      <div className="flex min-h-0 w-full flex-col items-center justify-center border-t border-white/10 pt-4 md:border-l md:border-t-0 md:pl-6 md:pt-0">
        {value !== null ? (
          <div className="flex w-full flex-col items-center justify-center">
            <span
              className="block text-center font-display text-[clamp(2.25rem,8vw,3.75rem)] font-semibold leading-none tracking-tight text-[#DEB892] tabular-nums md:text-[clamp(2.5rem,3.5vw,3.5rem)]"
              aria-hidden
            >
              {value}
            </span>
            <span
              className="mt-2 block text-center font-mono text-[0.65rem] font-medium uppercase tracking-[0.28em] text-[#F6F4F0]/40"
              aria-hidden
            >
              {suffix}
            </span>
          </div>
        ) : (
          <span
            className="block text-center font-mono text-3xl font-semibold text-[#F6F4F0]/35"
            title={unavailableLabel}
          >
            —
          </span>
        )}
      </div>
    </div>
  );
}
