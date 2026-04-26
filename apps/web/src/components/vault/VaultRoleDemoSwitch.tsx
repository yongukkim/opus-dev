"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import type { VaultUiRole } from "@/lib/vaultRole";

type Labels = { toArtist: string; toCollector: string };

export function VaultRoleDemoSwitch({
  currentRole,
  labels,
  sectionTitle,
  layout = "standalone",
}: {
  currentRole: VaultUiRole;
  labels: Labels;
  /** When set, shown above buttons (e.g. My Page mode switch). Omit on compact embeds. */
  sectionTitle?: string;
  /** `embedded`: sidebar strip without extra top offset (parent provides separation). */
  layout?: "standalone" | "embedded";
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const setRole = useCallback(
    async (role: VaultUiRole) => {
      if (role === currentRole || pending) return;
      setPending(true);
      try {
        const res = await fetch("/api/vault/role", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role }),
        });
        if (!res.ok) return;
        router.refresh();
      } finally {
        setPending(false);
      }
    },
    [currentRole, pending, router],
  );

  const shell =
    layout === "embedded"
      ? "flex flex-wrap gap-3 pt-2"
      : "mt-8 flex flex-wrap gap-3 border-t border-white/[0.08] pt-8";

  return (
    <div className={shell}>
      {sectionTitle ? (
        <p className="w-full font-mono text-[0.6rem] uppercase tracking-[0.2em] text-opus-warm/45">
          {sectionTitle}
        </p>
      ) : null}
      <button
        type="button"
        disabled={pending || currentRole === "artist"}
        onClick={() => setRole("artist")}
        className="rounded-lg border border-opus-gold/35 bg-opus-slate/40 px-4 py-2 text-xs font-medium text-opus-gold transition hover:border-opus-gold/55 hover:bg-opus-gold/10 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {labels.toArtist}
      </button>
      <button
        type="button"
        disabled={pending || currentRole === "collector"}
        onClick={() => setRole("collector")}
        className="rounded-lg border border-white/[0.12] bg-transparent px-4 py-2 text-xs font-medium text-opus-warm/65 transition hover:border-opus-gold/30 hover:text-opus-warm disabled:cursor-not-allowed disabled:opacity-40"
      >
        {labels.toCollector}
      </button>
    </div>
  );
}
