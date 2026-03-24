"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Account sidebar (pattern: Web_Template 2135_mini_finance dashboard nav).
 */
const links = [
  { href: "/vault", label: "Overview" },
  { href: "/vault/collection", label: "Collection" },
  { href: "/vault/activity", label: "Activity" },
  { href: "/vault/settings", label: "Settings" },
] as const;

function linkActive(pathname: string, href: string): boolean {
  if (href === "/vault") return pathname === "/vault";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function VaultSidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="shrink-0 border-b border-white/[0.08] bg-opus-slate/20 md:w-56 md:border-b-0 md:border-r"
      aria-label="Vault navigation"
    >
      <nav className="flex gap-1 overflow-x-auto p-3 md:flex-col md:overflow-visible md:p-4">
        {links.map(({ href, label }) => {
          const active = linkActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              className={`whitespace-nowrap rounded-md px-3 py-2 font-sans text-xs transition md:px-3 ${
                active
                  ? "bg-opus-gold/15 text-opus-gold"
                  : "text-opus-warm/55 hover:bg-white/[0.04] hover:text-opus-warm"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
