"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";

export type SiteHeaderNavLink = {
  href: string;
  label: string;
};

/**
 * Mobile primary navigation — hamburger opens a right-hand drawer (Classic Luxury chrome).
 */
export function SiteHeaderMobileNav({
  links,
  menuLabel,
  openLabel,
  closeLabel,
  ja,
}: {
  links: SiteHeaderNavLink[];
  menuLabel: string;
  openLabel: string;
  closeLabel: string;
  ja: boolean;
}) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  const linkClass = ja
    ? "block py-3.5 text-base font-medium tracking-tight break-keep text-opus-warm/88 transition hover:text-opus-gold"
    : "block py-3.5 text-sm font-medium uppercase tracking-[0.22em] text-opus-warm/88 transition hover:text-opus-gold";

  return (
    <>
      <button
        type="button"
        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-white/10 text-opus-warm/75 transition hover:border-opus-gold/35 hover:text-opus-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-opus-gold/50 md:hidden"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? closeLabel : openLabel}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="sr-only">{open ? closeLabel : openLabel}</span>
        {open ? (
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden className="stroke-current">
            <path d="M4 4l10 10M14 4L4 14" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden className="stroke-current fill-none">
            <path d="M2.5 5h13M2.5 9h13M2.5 13h13" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        )}
      </button>

      {open ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[60] bg-black/65 backdrop-blur-[1px] md:hidden"
            aria-label={closeLabel}
            onClick={() => setOpen(false)}
          />
          <nav
            id={panelId}
            className="fixed inset-y-0 right-0 z-[61] flex w-[min(100%,18.5rem)] flex-col border-l border-white/[0.1] bg-opus-charcoal/96 px-5 pb-8 pt-[calc(var(--opus-site-header-height)+0.5rem)] shadow-2xl backdrop-blur-xl md:hidden"
            aria-label={menuLabel}
          >
            <ul className="divide-y divide-white/[0.07]">
              {links.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className={linkClass} onClick={() => setOpen(false)}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </>
      ) : null}
    </>
  );
}
