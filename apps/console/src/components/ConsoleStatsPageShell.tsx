import Link from "next/link";
import type { ReactNode } from "react";

export function ConsoleStatsPageShell({
  locale,
  backLabel,
  title,
  subtitle,
  totalLine,
  loadError,
  children,
}: {
  locale: string;
  backLabel: string;
  title: string;
  subtitle: string;
  totalLine: string | null;
  loadError: string | null;
  children: ReactNode;
}) {
  return (
    <div className="min-h-full bg-white text-neutral-900">
      <div className="border-b border-neutral-200 px-6 py-6">
        <Link
          href={`/${locale}/home`}
          className="text-sm font-medium text-neutral-500 transition hover:text-neutral-800"
        >
          ← {backLabel}
        </Link>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-neutral-900">{title}</h1>
        <p className="mt-1 max-w-3xl text-sm text-neutral-600">{subtitle}</p>
        {totalLine ? (
          <p className="mt-3 font-mono text-xs uppercase tracking-[0.2em] text-neutral-500">{totalLine}</p>
        ) : null}
      </div>

      <div className="px-6 py-8">
        {loadError ? (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{loadError}</div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
