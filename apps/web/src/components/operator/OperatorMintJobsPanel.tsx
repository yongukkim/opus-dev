"use client";

/**
 * ISO 27001 A.9.2.1 (§4), A.12.4.1 (§5)
 * KO: 민팅 큐 UI는 운영자 전용 API만 호출하며, 실패 시에도 내부 스택을 노출하지 않는 일반 문구만 표시합니다.
 * JA: ミントキューUIは運営者専用APIのみを呼び、失敗時も内部スタックを露出しない汎用文言のみ表示します。
 * EN: Mint queue UI calls operator-only APIs and shows generic copy on failure without leaking stack traces.
 */

import { useCallback, useEffect, useState } from "react";
import type { Locale } from "@/i18n/config";
import type { Messages } from "@/i18n/types";

type MintJobApiRow = {
  submissionId: string;
  status: string;
  attemptCount: number;
  nextAttemptAt: string;
  txHash?: string;
  network: string;
  mintMode: string;
  updatedAt: string;
  lastError?: string;
};

type ProcessStats = {
  scanned: number;
  processed: number;
  confirmed: number;
  failed: number;
};

function shortTx(hash: string | undefined): string {
  if (!hash) return "—";
  if (hash.length <= 18) return hash;
  return `${hash.slice(0, 10)}…${hash.slice(-6)}`;
}

function localeTag(locale: Locale): string {
  if (locale === "ja") return "ja-JP";
  if (locale === "ko") return "ko-KR";
  return "en-US";
}

function formatIso(locale: Locale, iso: string): string {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return iso;
  return new Date(t).toLocaleString(localeTag(locale), {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function statusLabel(m: Messages, status: string): string {
  const s = m.operatorMintQueue;
  if (status === "queued") return s.statusQueued;
  if (status === "submitted") return s.statusSubmitted;
  if (status === "confirmed") return s.statusConfirmed;
  if (status === "failed") return s.statusFailed;
  return status;
}

export function OperatorMintJobsPanel({ locale, m }: { locale: Locale; m: Messages }) {
  const s = m.operatorMintQueue;
  const [jobs, setJobs] = useState<MintJobApiRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [processError, setProcessError] = useState<string | null>(null);
  const [lastStats, setLastStats] = useState<ProcessStats | null>(null);

  const loadJobs = useCallback(async () => {
    setLoadError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/operator/onchain-mint/jobs?limit=50", { method: "GET" });
      const data = (await res.json()) as { ok?: boolean; jobs?: MintJobApiRow[] };
      if (!res.ok || !data.ok || !Array.isArray(data.jobs)) {
        setLoadError(s.loadFail);
        setJobs([]);
        return;
      }
      setJobs(data.jobs);
    } catch {
      setLoadError(s.loadFail);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, [s.loadFail]);

  useEffect(() => {
    void loadJobs();
  }, [loadJobs]);

  async function runProcess() {
    setProcessError(null);
    setLastStats(null);
    setProcessing(true);
    try {
      const res = await fetch("/api/operator/onchain-mint/process?limit=3", { method: "POST" });
      const data = (await res.json()) as { ok?: boolean; scanned?: number; processed?: number; confirmed?: number; failed?: number };
      if (!res.ok || !data.ok) {
        setProcessError(s.processFail);
        return;
      }
      setLastStats({
        scanned: data.scanned ?? 0,
        processed: data.processed ?? 0,
        confirmed: data.confirmed ?? 0,
        failed: data.failed ?? 0,
      });
      await loadJobs();
    } catch {
      setProcessError(s.processFail);
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="mt-10 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={loading}
            onClick={() => void loadJobs()}
            className="rounded-md border border-white/[0.12] bg-white/[0.04] px-4 py-2 text-xs text-opus-warm/80 transition hover:border-opus-gold/35 hover:bg-white/[0.06] disabled:opacity-50"
          >
            {s.refresh}
          </button>
          <button
            type="button"
            disabled={processing || loading}
            onClick={() => void runProcess()}
            className="rounded-md border border-opus-gold/35 bg-opus-gold/10 px-4 py-2 text-xs text-opus-gold-light transition hover:border-opus-gold/50 hover:bg-opus-gold/15 disabled:opacity-50"
          >
            {processing ? s.processing : s.processCta}
          </button>
        </div>
      </div>

      {loadError ? <p className="text-sm text-rose-200/80">{loadError}</p> : null}
      {processError ? <p className="text-sm text-rose-200/80">{processError}</p> : null}

      {lastStats ? (
        <div className="rounded-lg border border-white/[0.08] bg-black/25 p-4 text-sm text-opus-warm/70">
          <p className="font-mono text-[0.65rem] uppercase tracking-[0.24em] text-opus-warm/45">{s.lastRun}</p>
          <ul className="mt-2 space-y-1 font-mono text-xs text-opus-warm/60">
            <li>
              {s.statsScanned}: {lastStats.scanned}
            </li>
            <li>
              {s.statsProcessed}: {lastStats.processed}
            </li>
            <li>
              {s.statsConfirmed}: {lastStats.confirmed}
            </li>
            <li>
              {s.statsFailed}: {lastStats.failed}
            </li>
          </ul>
        </div>
      ) : null}

      {loading ? (
        <p className="text-sm text-opus-warm/50">{s.loadingJobs}</p>
      ) : jobs.length === 0 ? (
        <p className="text-sm text-opus-warm/55">{s.empty}</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-white/[0.08] bg-opus-slate/20 shadow-opus-card">
          <table className="min-w-[56rem] w-full border-collapse text-left text-xs text-opus-warm/75">
            <thead>
              <tr className="border-b border-white/[0.06] text-opus-warm/50">
                <th className="px-4 py-3 font-normal">{s.colSubmission}</th>
                <th className="px-4 py-3 font-normal">{s.colStatus}</th>
                <th className="px-4 py-3 font-normal">{s.colAttempts}</th>
                <th className="px-4 py-3 font-normal">{s.colNextAttempt}</th>
                <th className="px-4 py-3 font-normal">{s.colTx}</th>
                <th className="px-4 py-3 font-normal">{s.colNetwork}</th>
                <th className="px-4 py-3 font-normal">{s.colMode}</th>
                <th className="px-4 py-3 font-normal">{s.colUpdated}</th>
                <th className="px-4 py-3 font-normal">{s.colError}</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((j) => (
                <tr key={j.submissionId} className="border-b border-white/[0.04]">
                  <td className="max-w-[10rem] truncate px-4 py-3 font-mono text-[0.65rem] text-opus-warm/60">{j.submissionId}</td>
                  <td className="whitespace-nowrap px-4 py-3">{statusLabel(m, j.status)}</td>
                  <td className="px-4 py-3 font-mono text-[0.65rem]">{j.attemptCount}</td>
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-[0.65rem] text-opus-warm/55">
                    {formatIso(locale, j.nextAttemptAt)}
                  </td>
                  <td className="max-w-[8rem] truncate px-4 py-3 font-mono text-[0.65rem] text-opus-warm/55">{shortTx(j.txHash)}</td>
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-[0.65rem]">{j.network}</td>
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-[0.65rem]">{j.mintMode}</td>
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-[0.65rem] text-opus-warm/55">{formatIso(locale, j.updatedAt)}</td>
                  <td className="max-w-[12rem] truncate px-4 py-3 font-mono text-[0.65rem] text-rose-200/60" title={j.lastError}>
                    {j.lastError ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
