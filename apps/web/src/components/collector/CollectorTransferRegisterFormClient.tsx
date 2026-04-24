"use client";

import dynamic from "next/dynamic";
import type { Locale } from "@/i18n/config";
import type { Messages } from "@/i18n/types";
import type { VaultUiRole } from "@/lib/vaultRole";

/**
 * `next/dynamic` with `ssr: false` must live in a Client Component (Next 16+).
 * Mounting the form only on the client avoids stale RSC / Turbopack HMR
 * desync (hydration mismatch) on this route.
 */
const Inner = dynamic(
  () =>
    import("@/components/collector/CollectorTransferRegisterForm").then(
      (mod) => mod.CollectorTransferRegisterForm,
    ),
  {
    ssr: false,
    loading: () => (
      <div
        className="mt-10 rounded-xl border border-white/[0.08] bg-opus-slate/15 p-6 shadow-opus-card md:p-8"
        aria-busy="true"
      >
        <div className="space-y-4">
          <div className="h-3 w-36 animate-pulse rounded bg-white/[0.08]" />
          <div className="h-10 max-w-md animate-pulse rounded-md bg-white/[0.06]" />
          <div className="h-24 max-w-2xl animate-pulse rounded-md bg-white/[0.05]" />
        </div>
      </div>
    ),
  },
);

export function CollectorTransferRegisterFormClient(props: {
  locale: Locale;
  m: Messages;
  vaultRole: VaultUiRole;
}) {
  return <Inner {...props} />;
}
