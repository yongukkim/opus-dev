"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";

export type SiteHeaderNavLink = {
  href: string;
  label: string;
};

/** Flat link or expandable My Page block (AhnLab CloudMate–style nested mobile nav). */
export type SiteHeaderNavItem =
  | { kind: "link"; href: string; label: string }
  | {
      kind: "vault";
      label: string;
      expandAria: string;
      subNavAria: string;
      children: SiteHeaderNavLink[];
    };

/**
 * Mobile primary navigation — hamburger opens a right-hand drawer on solid black (no page bleed-through).
 */
export function SiteHeaderMobileNav({
  items,
  menuLabel,
  openLabel,
  closeLabel,
  ja,
}: {
  items: SiteHeaderNavItem[];
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

  const subLinkClass = ja
    ? "block border-l border-opus-gold/25 py-2.5 pl-4 text-sm font-medium tracking-tight break-keep text-opus-warm/72 transition hover:text-opus-gold"
    : "block border-l border-opus-gold/25 py-2.5 pl-4 text-xs font-medium uppercase tracking-[0.18em] text-opus-warm/72 transition hover:text-opus-gold";

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
            className="fixed inset-0 z-[60] bg-black md:hidden"
            aria-label={closeLabel}
            onClick={() => setOpen(false)}
          />
          <nav
            id={panelId}
            className="fixed inset-y-0 right-0 z-[61] flex w-[min(100%,18.5rem)] flex-col border-l border-white/[0.12] bg-black px-5 pb-8 pt-[calc(var(--opus-site-header-height)+0.5rem)] shadow-2xl md:hidden"
            aria-label={menuLabel}
          >
            <ul className="divide-y divide-white/[0.07]">
              {items.map((item) =>
                item.kind === "link" ? (
                  <li key={item.href}>
                    <Link href={item.href} className={linkClass} onClick={() => setOpen(false)}>
                      {item.label}
                    </Link>
                  </li>
                ) : (
                  <li key="vault-group">
                    <details className="group">
                      <summary
                        className={`${linkClass} flex cursor-pointer list-none items-center justify-between gap-2 [&::-webkit-details-marker]:hidden`}
                        aria-label={item.expandAria}
                      >
                        <span>{item.label}</span>
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 14 14"
                          aria-hidden
                          className="shrink-0 stroke-opus-warm/45 transition group-open:rotate-180 group-open:stroke-opus-gold/70"
                        >
                          <path d="M3.5 5.25L7 8.75l3.5-3.5" fill="none" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </summary>
                      <ul className="space-y-0.5 pb-2 pt-1" aria-label={item.subNavAria}>
                        {item.children.map((child) => (
                          <li key={child.href}>
                            <Link href={child.href} className={subLinkClass} onClick={() => setOpen(false)}>
                              {child.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </details>
                  </li>
                ),
              )}
            </ul>
          </nav>
        </>
      ) : null}
    </>
  );
}
