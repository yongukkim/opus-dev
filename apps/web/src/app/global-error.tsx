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
    <html lang="ko">
      <body className="flex min-h-screen flex-col items-center justify-center bg-black px-6 text-center text-neutral-200">
        <h1 className="text-lg font-medium">문제가 발생했습니다</h1>
        <p className="mt-2 max-w-md text-sm text-neutral-400">
          잠시 후 다시 시도해 주세요. 서비스 개선을 위해 기록됩니다.
        </p>
        <p className="mt-3 max-w-md text-xs text-neutral-500" lang="ja">
          問題が発生しました。しばらくしてから再度お試しください。
        </p>
        <button
          type="button"
          onClick={() => reset()}
          className="mt-6 rounded-sm border border-neutral-600 px-4 py-2 text-sm text-white hover:border-neutral-400"
        >
          다시 시도
        </button>
      </body>
    </html>
  );
}
