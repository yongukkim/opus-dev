import type { Locale } from "@/i18n/config";
import type { ChroniclePreviewPublicRow } from "@/lib/chronicleLedger";
import type { Messages } from "@/i18n/types";

function tpl(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => vars[key] ?? "");
}

function localeTag(locale: Locale): string {
  if (locale === "ja") return "ja-JP";
  if (locale === "ko") return "ko-KR";
  return "en-US";
}

/** Masked issuance lines — shared by home `ChroniclePreview` and `/chronicle`. */
export function ChroniclePublicList({
  locale,
  m,
  rows,
  ulClassName,
}: {
  locale: Locale;
  m: Messages;
  rows: ChroniclePreviewPublicRow[];
  /** Override outer `<ul>` layout (e.g. full Chronicle index page). */
  ulClassName?: string;
}) {
  const c = m.home.chroniclePreview;
  const listWrap = ulClassName ?? "mx-auto mt-10 max-w-lg space-y-4 text-left";

  return (
    <ul className={listWrap}>
      {rows.map((r) => {
        const when = new Date(r.occurredAt);
        const dateStr = Number.isFinite(when.getTime())
          ? when.toLocaleString(localeTag(locale), { dateStyle: "medium", timeStyle: "short" })
          : r.occurredAt;
        const chip = r.eventType === "ISSUED" ? c.eventPrimary : r.eventType;
        return (
          <li
            key={r.id}
            className="rounded-xl border border-white/[0.08] bg-opus-slate/25 px-5 py-4 shadow-opus-card"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="rounded-full border border-opus-gold/35 px-2.5 py-0.5 font-mono text-[0.62rem] uppercase tracking-[0.18em] text-opus-gold/85">
                {chip}
              </span>
              <time className="font-mono text-[0.65rem] text-opus-warm/45" dateTime={r.occurredAt}>
                {dateStr}
              </time>
            </div>
            <p className="mt-2 font-display text-sm text-opus-warm/90">{r.artworkTitle}</p>
            <p className="mt-1 font-mono text-[0.68rem] text-opus-warm/55">
              {tpl(c.custodyTpl, { masked: r.custodyToMasked })}
            </p>
            <p className="mt-2 text-xs leading-relaxed text-opus-warm/50">{r.note}</p>
          </li>
        );
      })}
    </ul>
  );
}
