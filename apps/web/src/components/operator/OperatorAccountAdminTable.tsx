"use client";

import { useMemo, useState } from "react";
import type { Messages } from "@/i18n/types";

type Row = {
  id: string;
  name: string;
  email: string;
  role: "collector" | "artist" | "operator";
  createdAt: string;
};

function roleLabel(m: Messages, role: Row["role"]): string {
  if (role === "artist") return m.operatorAdmin.roleArtist;
  if (role === "operator") return m.operatorAdmin.roleOperator;
  return m.operatorAdmin.roleCollector;
}

export function OperatorAccountAdminTable({
  rows,
  sessionUserId,
  m,
}: {
  rows: Row[];
  sessionUserId: string;
  m: Messages;
}) {
  const [q, setQ] = useState("");
  const [pending, setPending] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((r) =>
      [r.id, r.name, r.email, r.role].some((x) => x.toLowerCase().includes(needle)),
    );
  }, [q, rows]);

  async function setRole(userId: string, role: Row["role"]) {
    if (pending) return;
    setPending(userId);
    try {
      const res = await fetch(`/api/operator/users/${encodeURIComponent(userId)}/role`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        window.alert(json.error === "self_guard" ? m.operatorAdmin.selfGuard : m.operatorAdmin.updateFail);
        return;
      }
      window.alert(m.operatorAdmin.updateSuccess);
      window.location.reload();
    } catch {
      window.alert(m.operatorAdmin.updateFail);
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="mt-10 space-y-4">
      <div className="rounded-xl border border-white/[0.08] bg-opus-slate/20 p-4">
        <p className="font-mono text-[0.65rem] uppercase tracking-[0.22em] text-opus-warm/45">
          {m.operatorAdmin.searchLabel}
        </p>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={m.operatorAdmin.searchPlaceholder}
          className="mt-3 w-full rounded-md border border-white/[0.12] bg-black/25 px-3 py-2 text-sm text-opus-warm/80 outline-none transition focus:border-opus-gold/45"
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-opus-slate/20 shadow-opus-card">
        <div className="grid grid-cols-[1fr,1.1fr,0.8fr,0.8fr,1.4fr] gap-3 border-b border-white/[0.06] px-5 py-4 text-xs text-opus-warm/55">
          <span>{m.operatorAdmin.colName}</span>
          <span>{m.operatorAdmin.colEmail}</span>
          <span>{m.operatorAdmin.colRole}</span>
          <span>{m.operatorAdmin.colCreated}</span>
          <span>{m.operatorAdmin.colActions}</span>
        </div>

        {filtered.length === 0 ? (
          <p className="px-5 py-8 text-sm text-opus-warm/55">{m.operatorAdmin.empty}</p>
        ) : (
          <ul className="divide-y divide-white/[0.06]">
            {filtered.map((row) => {
              const busy = pending === row.id;
              const self = row.id === sessionUserId;
              return (
                <li key={row.id} className="grid grid-cols-[1fr,1.1fr,0.8fr,0.8fr,1.4fr] gap-3 px-5 py-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm text-opus-warm/85">{row.name || "—"}</p>
                    <p className="mt-1 truncate font-mono text-[0.65rem] text-opus-warm/35">{row.id}</p>
                  </div>
                  <p className="truncate text-sm text-opus-warm/70">{row.email || "—"}</p>
                  <p className="text-sm text-opus-warm/70">{roleLabel(m, row.role)}</p>
                  <p className="text-xs text-opus-warm/50">{new Date(row.createdAt).toLocaleDateString()}</p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => setRole(row.id, "collector")}
                      className="rounded border border-white/[0.12] px-2 py-1 text-xs text-opus-warm/75 transition hover:border-opus-gold/40 disabled:opacity-45"
                    >
                      {m.operatorAdmin.roleCollector}
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => setRole(row.id, "artist")}
                      className="rounded border border-white/[0.12] px-2 py-1 text-xs text-opus-warm/75 transition hover:border-opus-gold/40 disabled:opacity-45"
                    >
                      {m.operatorAdmin.roleArtist}
                    </button>
                    <button
                      type="button"
                      disabled={busy || self}
                      onClick={() => setRole(row.id, "operator")}
                      className="rounded border border-opus-gold/35 px-2 py-1 text-xs text-opus-gold transition hover:border-opus-gold/55 disabled:opacity-45"
                    >
                      {m.operatorAdmin.roleOperator}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
