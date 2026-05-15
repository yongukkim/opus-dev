"use client";

/**
 * ISO 27001 A.9.4.2 / A.12.4.1 (CLAUDE.md §2, §5)
 * KO: 필수 입력 누락 등은 브라우저 alert 대신 모달로만 안내해 메시지 노출을 통제한다.
 * JA: 必須入力の欠落などはブラウザ alert ではなくモーダルのみで案内し、メッセージ露出を制御する。
 * EN: Missing required fields are communicated via this modal instead of `alert`, keeping messaging controlled.
 */

export type FormMessageModalVariant = "neutral" | "error";

export function FormMessageModal({
  open,
  title,
  message,
  confirmLabel,
  variant = "neutral",
  onClose,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  variant?: FormMessageModalVariant;
  onClose: () => void;
}) {
  if (!open) return null;

  const border =
    variant === "error"
      ? "border-red-400/30"
      : "border-opus-gold/28";
  const eyebrow =
    variant === "error" ? "text-red-200/75" : "text-opus-gold/80";

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 px-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="opus-form-msg-title"
    >
      <div
        className={`w-full max-w-lg rounded-xl border ${border} bg-opus-charcoal p-6 shadow-opus-card`}
      >
        <p id="opus-form-msg-title" className={`font-mono text-[0.62rem] uppercase tracking-[0.2em] ${eyebrow}`}>
          {title}
        </p>
        <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-opus-warm/88">{message}</p>
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="opus-surface-metallic rounded-lg px-5 py-2.5 text-sm font-semibold tracking-wide text-opus-charcoal transition hover:opacity-95"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
