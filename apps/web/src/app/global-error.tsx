"use client";

/**
 * Global error boundary — SECURITY_GOVERNANCE.md: do not expose stack traces to clients.
 * Log server-side / observability separately with PII masking.
 */
export default function GlobalError({
  error: _error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ja">
      <body className="flex min-h-screen flex-col items-center justify-center bg-black px-6 text-center text-neutral-200">
        <h1 className="text-lg font-medium">問題が発生しました</h1>
        <p className="mt-2 max-w-md text-sm text-neutral-400">
          しばらくしてから再度お試しください。改善のため記録されています。
        </p>
        <button
          type="button"
          onClick={() => reset()}
          className="mt-6 rounded-sm border border-neutral-600 px-4 py-2 text-sm text-white hover:border-neutral-400"
        >
          再試行
        </button>
      </body>
    </html>
  );
}
