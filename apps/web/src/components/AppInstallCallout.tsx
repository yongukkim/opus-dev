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

  const badgeClass =
    "inline-flex items-center gap-3 rounded-xl border border-white/[0.10] bg-[#0B0B0B] px-4 py-3 shadow-[0_18px_50px_rgba(0,0,0,0.45)] transition hover:border-opus-gold/25 hover:bg-[#0A0A0A] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-opus-gold/35";
  const badgeDisabledClass =
    "inline-flex items-center gap-3 rounded-xl border border-white/[0.06] bg-[#090909] px-4 py-3 text-opus-warm/30";

  const micro = "text-[0.58rem] font-mono uppercase tracking-[0.28em] text-opus-warm/40";
  const store = "text-sm font-display tracking-[0.02em] text-opus-warm/85 leading-tight";

  return (
    <div className={className ?? "rounded-xl border border-white/[0.08] bg-opus-charcoal/30 px-5 py-5"}>
      <p className="font-mono text-[0.65rem] uppercase tracking-[0.22em] text-opus-warm/45">{title}</p>
      <p className="mt-2 text-xs leading-relaxed text-opus-warm/55">{body}</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {links.ios ? (
          <Link href={links.ios} className={badgeClass} aria-label={iosLabel}>
            <AppleMark className="h-6 w-6 text-opus-gold/80" />
            <span className="min-w-0">
              <span className={micro}>Download on the</span>
              <span className={`block ${store}`}>App Store</span>
            </span>
          </Link>
        ) : (
          <div className={badgeDisabledClass} aria-disabled>
            <AppleMark className="h-6 w-6 text-opus-gold/30" />
            <span className="min-w-0">
              <span className={micro}>Download on the</span>
              <span className={`block ${store} text-opus-warm/40`}>
                App Store · {comingSoonLabel}
              </span>
            </span>
          </div>
        )}
        {links.android ? (
          <Link href={links.android} className={badgeClass} aria-label={androidLabel}>
            <AndroidMark className="h-6 w-6 text-opus-gold/80" />
            <span className="min-w-0">
              <span className={micro}>GET IT ON</span>
              <span className={`block ${store}`}>Google Play</span>
            </span>
          </Link>
        ) : (
          <div className={badgeDisabledClass} aria-disabled>
            <AndroidMark className="h-6 w-6 text-opus-gold/30" />
            <span className="min-w-0">
              <span className={micro}>GET IT ON</span>
              <span className={`block ${store} text-opus-warm/40`}>
                Google Play · {comingSoonLabel}
              </span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

