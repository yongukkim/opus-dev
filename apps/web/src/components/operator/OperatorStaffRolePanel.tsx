"use client";

import { useState } from "react";
import type { Messages } from "@/i18n/types";

type StaffRow = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  role: "collector" | "artist" | "operator";
};

export function OperatorStaffRolePanel({
  rows,
  m,
}: {
  rows: StaffRow[];
  m: Messages;
}) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<StaffRow["role"]>("operator");
  const [pending, setPending] = useState(false);

  async function submit() {
    if (pending) return;
    setPending(true);
    try {
      const res = await fetch("/api/operator/staff-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role }),
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
      setPending(false);
    }
  }

  return (
    <div className="mt-6 space-y-4">
      <div className="rounded-xl border border-white/[0.08] bg-opus-slate/20 p-4">
        <p className="font-mono text-[0.65rem] uppercase tracking-[0.22em] text-opus-warm/45">
          {m.operatorAdmin.searchLabel}
        </p>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={m.operatorAdmin.searchPlaceholder}
          className="mt-3 w-full rounded-md border border-white/[0.12] bg-black/25 px-3 py-2 text-sm text-opus-warm/80 outline-none transition focus:border-opus-gold/45"
        />
        <div className="mt-3 flex flex-wrap gap-2">
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as StaffRow["role"])}
            className="rounded border border-white/[0.12] bg-black/25 px-3 py-2 text-sm text-opus-warm/80"
          >
            <option value="collector">{m.operatorAdmin.roleCollector}</option>
            <option value="artist">{m.operatorAdmin.roleArtist}</option>
            <option value="operator">{m.operatorAdmin.roleOperator}</option>
          </select>
          <button
            type="button"
            onClick={submit}
            disabled={pending || !email.trim()}
            className="rounded border border-opus-gold/35 px-3 py-2 text-sm text-opus-gold transition hover:border-opus-gold/55 disabled:opacity-45"
          >
            {m.operatorAdmin.colActions}
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-opus-slate/20 shadow-opus-card">
        <div className="grid grid-cols-[1fr,1.2fr,0.8fr] gap-3 border-b border-white/[0.06] px-5 py-4 text-xs text-opus-warm/55">
          <span>{m.operatorAdmin.colName}</span>
          <span>{m.operatorAdmin.colEmail}</span>
          <span>{m.operatorAdmin.colRole}</span>
        </div>
        {rows.length === 0 ? (
          <p className="px-5 py-8 text-sm text-opus-warm/55">{m.operatorAdmin.empty}</p>
        ) : (
          <ul className="divide-y divide-white/[0.06]">
            {rows.map((row) => (
              <li key={row.id} className="grid grid-cols-[1fr,1.2fr,0.8fr] gap-3 px-5 py-4">
                <p className="truncate text-sm text-opus-warm/85">{row.name || "—"}</p>
                <p className="truncate text-sm text-opus-warm/70">{row.email || "—"}</p>
                <p className="text-sm text-opus-warm/70">
                  {row.role === "artist"
                    ? m.operatorAdmin.roleArtist
                    : row.role === "operator"
                      ? m.operatorAdmin.roleOperator
                      : m.operatorAdmin.roleCollector}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
