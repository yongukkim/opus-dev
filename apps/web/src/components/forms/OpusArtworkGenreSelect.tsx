"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { OpusArtworkGenreKey } from "@/lib/opusArtworkGenres";

type GenreValue = "" | OpusArtworkGenreKey;

/**
 * Custom genre picker — native `<select>` dropdown lists are painted by the OS
 * (Windows often ignores dark form styling for the open list; macOS may follow the page).
 * This listbox keeps OPUS charcoal / warm-white chrome on every platform.
 */
export function OpusArtworkGenreSelect({
  value,
  onChange,
  onBlur,
  invalid,
  disabled,
  placeholder,
  options,
  triggerClassName,
  ariaLabel,
}: {
  value: GenreValue;
  onChange: (next: GenreValue) => void;
  onBlur?: () => void;
  invalid: boolean;
  disabled?: boolean;
  placeholder: string;
  options: { key: OpusArtworkGenreKey; label: string }[];
  triggerClassName: string;
  /** Visible label text for the field (used in aria-labelledby with the value). */
  ariaLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const display =
    value === "" ? placeholder : (options.find((o) => o.key === value)?.label ?? placeholder);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
        onBlur?.();
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open, onBlur]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
        onBlur?.();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onBlur]);

  function pick(next: GenreValue) {
    onChange(next);
    setOpen(false);
    onBlur?.();
  }

  const optionRow =
    "flex w-full items-center px-3 py-2.5 text-left text-sm text-opus-warm/88 transition hover:bg-white/[0.06] focus-visible:bg-white/[0.08] focus-visible:outline-none";

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-invalid={invalid}
        aria-label={`${ariaLabel}: ${display}`}
        className={`${triggerClassName} flex items-center justify-between gap-2 text-left ${
          disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
        }`}
        onClick={() => {
          if (disabled) return;
          setOpen((o) => !o);
        }}
      >
        <span className={value === "" ? "truncate text-opus-warm/45" : "truncate"}>{display}</span>
        <span className="shrink-0 text-opus-warm/40" aria-hidden>
          <svg width="14" height="14" viewBox="0 0 14 14" className="stroke-current" fill="none">
            <path d="M3.5 5.25L7 8.75l3.5-3.5" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </button>

      {open && !disabled ? (
        <ul
          id={listId}
          role="listbox"
          aria-label={ariaLabel}
          className="absolute left-0 right-0 z-[80] mt-1 max-h-64 overflow-auto rounded-md border border-white/[0.12] bg-opus-charcoal py-1 shadow-[0_12px_40px_rgba(0,0,0,0.55)] backdrop-blur-md"
        >
          <li role="none">
            <button
              type="button"
              role="option"
              aria-selected={value === ""}
              className={`${optionRow} ${value === "" ? "bg-opus-gold/10 text-opus-gold" : ""}`}
              onClick={() => pick("")}
            >
              {placeholder}
            </button>
          </li>
          {options.map(({ key, label }) => (
            <li key={key} role="none">
              <button
                type="button"
                role="option"
                aria-selected={value === key}
                className={`${optionRow} ${value === key ? "bg-opus-gold/10 text-opus-gold" : ""}`}
                onClick={() => pick(key)}
              >
                {label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
