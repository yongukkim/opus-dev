import type { Messages } from "@/i18n/types";

/**
 * High-fidelity policy callout — PWA / Add to Home Screen (no native store emphasis).
 * ISO 27001 A.18.1.4 (§7) — copy avoids investment framing; see CLAUDE.md product positioning.
 */
export function AppInstallCallout({
  m,
  title,
  body,
  pwaStepSafari,
  pwaStepChrome,
  className,
}: {
  m: Messages;
  title: string;
  body: string;
  pwaStepSafari: string;
  pwaStepChrome: string;
  className?: string;
}) {
  void m;
  const stepClass =
    "rounded-xl border border-white/[0.08] bg-[#0B0B0B] px-4 py-3 text-sm leading-relaxed text-opus-warm/80 shadow-[0_12px_40px_rgba(0,0,0,0.35)]";

  return (
    <div className={className ?? "rounded-xl border border-white/[0.08] bg-opus-charcoal/30 px-5 py-5"}>
      <p className="font-mono text-[0.72rem] uppercase tracking-[0.2em] text-opus-warm/55">{title}</p>
      <p className="mt-2 text-sm leading-relaxed text-opus-warm/70">{body}</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className={stepClass}>
          <p className="font-mono text-[0.68rem] uppercase tracking-[0.18em] text-opus-warm/50">Safari</p>
          <p className="mt-1.5 text-sm leading-relaxed text-opus-warm/80">{pwaStepSafari}</p>
        </div>
        <div className={stepClass}>
          <p className="font-mono text-[0.68rem] uppercase tracking-[0.18em] text-opus-warm/50">Chrome</p>
          <p className="mt-1.5 text-sm leading-relaxed text-opus-warm/80">{pwaStepChrome}</p>
        </div>
      </div>
    </div>
  );
}
