import Link from "next/link";
import { getOpusAppLinksFromEnv } from "@/lib/appLinks";
import type { Messages } from "@/i18n/types";

function AppleMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M16.4 12.7c0-2 1.6-3 1.7-3.1-1-1.4-2.5-1.6-3-1.6-1.3-.1-2.5.8-3.2.8-.6 0-1.6-.8-2.7-.8-1.4 0-2.7.8-3.4 2-1.5 2.5-.4 6.2 1.1 8.3.7 1 1.6 2.1 2.8 2.1 1.1 0 1.6-.7 3-.7 1.4 0 1.8.7 3 .7 1.2 0 2-.9 2.7-1.9.8-1.1 1.1-2.2 1.1-2.2-.1-.1-2.1-.8-2.1-3.6Z"
        fill="currentColor"
        fillOpacity="0.9"
      />
      <path
        d="M14.8 5.5c.6-.7 1-1.7.9-2.7-.9.1-2 .6-2.6 1.4-.6.7-1.1 1.7-.9 2.7 1 .1 2-.5 2.6-1.4Z"
        fill="currentColor"
        fillOpacity="0.55"
      />
    </svg>
  );
}

function AndroidMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M7.2 9.2 5.8 6.6a.7.7 0 0 1 1.2-.6l1.5 2.7a7.4 7.4 0 0 1 7 0L17 6a.7.7 0 1 1 1.2.6l-1.4 2.6c1.4 1.1 2.3 2.7 2.3 4.6v4.4c0 .6-.5 1.1-1.1 1.1H6.1c-.6 0-1.1-.5-1.1-1.1v-4.4c0-1.9.9-3.5 2.2-4.6Z"
        fill="currentColor"
        fillOpacity="0.9"
      />
      <path d="M9 14.2a.9.9 0 1 0 0-1.8.9.9 0 0 0 0 1.8Z" fill="#0E0E0E" fillOpacity="0.9" />
      <path d="M15 14.2a.9.9 0 1 0 0-1.8.9.9 0 0 0 0 1.8Z" fill="#0E0E0E" fillOpacity="0.9" />
    </svg>
  );
}

export function AppInstallCallout({
  m,
  title,
  body,
  iosLabel,
  androidLabel,
  comingSoonLabel,
  className,
}: {
  m: Messages;
  title: string;
  body: string;
  iosLabel: string;
  androidLabel: string;
  comingSoonLabel: string;
  className?: string;
}) {
  void m;
  const links = getOpusAppLinksFromEnv();

  const btnClass =
    "inline-flex items-center justify-center gap-2 rounded-full border border-white/[0.12] bg-white/[0.04] px-4 py-3 text-[0.7rem] font-semibold tracking-[0.1em] text-opus-warm/80 transition hover:border-white/[0.18] hover:bg-white/[0.06]";
  const disabledClass =
    "inline-flex items-center justify-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.02] px-4 py-3 text-[0.7rem] font-semibold tracking-[0.1em] text-opus-warm/35";

  return (
    <div className={className ?? "rounded-xl border border-white/[0.08] bg-opus-charcoal/30 px-5 py-5"}>
      <p className="font-mono text-[0.65rem] uppercase tracking-[0.22em] text-opus-warm/45">{title}</p>
      <p className="mt-2 text-xs leading-relaxed text-opus-warm/55">{body}</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {links.ios ? (
          <Link href={links.ios} className={btnClass}>
            <AppleMark className="h-4 w-4 text-opus-gold/80" />
            <span>{iosLabel}</span>
          </Link>
        ) : (
          <div className={disabledClass}>
            <AppleMark className="h-4 w-4 text-opus-gold/35" />
            <span>
              {iosLabel} · {comingSoonLabel}
            </span>
          </div>
        )}
        {links.android ? (
          <Link href={links.android} className={btnClass}>
            <AndroidMark className="h-4 w-4 text-opus-gold/80" />
            <span>{androidLabel}</span>
          </Link>
        ) : (
          <div className={disabledClass}>
            <AndroidMark className="h-4 w-4 text-opus-gold/35" />
            <span>
              {androidLabel} · {comingSoonLabel}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

