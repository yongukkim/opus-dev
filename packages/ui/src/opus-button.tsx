import type { ButtonHTMLAttributes } from "react";

export type OpusButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost";
};

/** Primary = bright brass pill (layered gradients in globals), label #000. */
export function OpusButton({
  variant = "primary",
  className = "",
  children,
  ...rest
}: OpusButtonProps) {
  const base =
    "inline-flex items-center justify-center rounded-sm px-5 py-2.5 text-sm font-medium transition focus-visible:outline-none disabled:opacity-50";
  const styles =
    variant === "primary"
      ? "opus-surface-metallic text-black focus-visible:ring-2 focus-visible:ring-opus-gold-light/60 focus-visible:ring-offset-2 focus-visible:ring-offset-opus-charcoal"
      : "border border-opus-slate bg-transparent text-opus-warm hover:border-opus-gold/50 focus-visible:ring-2 focus-visible:ring-opus-gold/35 focus-visible:ring-offset-2 focus-visible:ring-offset-opus-charcoal";

  return (
    <button type="button" className={`${base} ${styles} ${className}`.trim()} {...rest}>
      <span className="relative z-[1]">{children}</span>
    </button>
  );
}
