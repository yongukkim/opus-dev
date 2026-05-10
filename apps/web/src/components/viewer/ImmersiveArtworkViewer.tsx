"use client";

import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";

function immersivePreviewUrl(submissionId: string, tier: "fit" | "zoom") {
  return `/api/artwork-submissions/${encodeURIComponent(submissionId)}/immersive-preview?tier=${tier}`;
}

async function requestFullscreenEl(el: HTMLElement) {
  try {
    const anyEl = el as HTMLElement & {
      webkitRequestFullscreen?: () => Promise<void>;
    };
    if (el.requestFullscreen) await el.requestFullscreen();
    else if (anyEl.webkitRequestFullscreen) await anyEl.webkitRequestFullscreen();
  } catch {
    /* Fullscreen is optional; fixed overlay still covers the viewport. */
  }
}

async function exitFullscreenDoc() {
  const doc = document as Document & { webkitExitFullscreen?: () => Promise<void> };
  try {
    if (document.fullscreenElement) {
      if (document.exitFullscreen) await document.exitFullscreen();
    } else if (doc.webkitExitFullscreen) {
      await doc.webkitExitFullscreen();
    }
  } catch {
    /* noop */
  }
}

export function ImmersiveArtworkViewer({
  submissionId,
  ctaLabel,
  closeLabel,
  pinchHint,
  loadErrorLabel,
}: {
  submissionId: string;
  ctaLabel: string;
  closeLabel: string;
  pinchHint: string;
  loadErrorLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const [displayTier, setDisplayTier] = useState<"fit" | "zoom">("fit");
  const [pinchScale, setPinchScale] = useState(1);
  const [imgErr, setImgErr] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const pinchRef = useRef<{ dist0: number; scale0: number } | null>(null);
  const tierRef = useRef<"fit" | "zoom">("fit");
  const scaleRef = useRef(1);
  const enteredFsRef = useRef(false);
  tierRef.current = displayTier;
  scaleRef.current = pinchScale;

  const close = useCallback(async () => {
    enteredFsRef.current = false;
    await exitFullscreenDoc();
    setOpen(false);
    setDisplayTier("fit");
    setPinchScale(1);
    setImgErr(false);
    pinchRef.current = null;
  }, []);

  useEffect(() => {
    if (!open) {
      enteredFsRef.current = false;
      return;
    }
    const onFs = () => {
      const fs =
        document.fullscreenElement ??
        (document as Document & { webkitFullscreenElement?: Element | null }).webkitFullscreenElement ??
        null;
      if (fs) enteredFsRef.current = true;
      else if (enteredFsRef.current) void close();
    };
    document.addEventListener("fullscreenchange", onFs);
    document.addEventListener("webkitfullscreenchange", onFs as EventListener);
    return () => {
      document.removeEventListener("fullscreenchange", onFs);
      document.removeEventListener("webkitfullscreenchange", onFs as EventListener);
    };
  }, [open, close]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") void close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  useEffect(() => {
    if (!open) return;
    const id = requestAnimationFrame(() => {
      const el = overlayRef.current;
      if (el) void requestFullscreenEl(el);
    });
    return () => cancelAnimationFrame(id);
  }, [open]);

  const touchDist = (t: React.TouchList) => {
    const a = t.item(0);
    const b = t.item(1);
    if (!a || !b) return 0;
    return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
  };

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => {
          setImgErr(false);
          setDisplayTier("fit");
          setPinchScale(1);
          setOpen(true);
        }}
        className="opus-surface-metallic inline-flex w-full items-center justify-center rounded-lg px-5 py-3 text-sm font-semibold tracking-wide text-black transition hover:opacity-95"
      >
        {ctaLabel}
      </button>

      {open ? (
        <div
          ref={overlayRef}
          role="dialog"
          aria-modal="true"
          aria-label={ctaLabel}
          className="fixed inset-0 z-[200] flex flex-col bg-[#0E0E0E]"
          style={{
            paddingTop: "max(0.75rem, env(safe-area-inset-top))",
            paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))",
            paddingLeft: "max(0.75rem, env(safe-area-inset-left))",
            paddingRight: "max(0.75rem, env(safe-area-inset-right))",
          }}
        >
          <div className="flex shrink-0 justify-end pb-2">
            <button
              type="button"
              onClick={() => void close()}
              className="rounded-lg border border-white/[0.12] bg-black/40 px-4 py-2 text-sm text-opus-warm/85 hover:bg-black/55"
            >
              {closeLabel}
            </button>
          </div>

          <p className="shrink-0 px-1 pb-2 text-center text-[0.7rem] leading-relaxed text-opus-warm/50">{pinchHint}</p>

          <div
            className="relative min-h-0 flex-1 touch-none"
            onWheel={(e) => {
              if (!e.ctrlKey) return;
              e.preventDefault();
              setPinchScale((prev) => {
                const factor = e.deltaY < 0 ? 1.07 : 0.93;
                const next = Math.min(4, Math.max(0.85, prev * factor));
                if (tierRef.current === "fit" && next >= 1.34) {
                  setDisplayTier("zoom");
                  return 1;
                }
                return next;
              });
            }}
            onTouchStart={(e) => {
              if (e.touches.length === 2) {
                pinchRef.current = { dist0: touchDist(e.touches), scale0: scaleRef.current };
              }
            }}
            onTouchMove={(e) => {
              if (e.touches.length !== 2 || !pinchRef.current) return;
              e.preventDefault();
              const d = touchDist(e.touches);
              const ratio = d / pinchRef.current.dist0;
              const next = Math.min(4, Math.max(0.85, pinchRef.current.scale0 * ratio));
              setPinchScale(next);
              if (tierRef.current === "fit" && next >= 1.34) {
                setDisplayTier("zoom");
                setPinchScale(1);
                pinchRef.current = null;
              }
            }}
            onTouchEnd={() => {
              if (pinchRef.current) pinchRef.current = null;
            }}
          >
            <div className="flex h-full w-full items-center justify-center overflow-hidden">
              <div
                className="flex max-h-full max-w-full items-center justify-center will-change-transform"
                style={{ transform: `scale(${pinchScale})` }}
              >
                {imgErr ? (
                  <p className="max-w-sm px-4 text-center text-sm text-opus-warm/65">{loadErrorLabel}</p>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element -- authenticated same-origin tiered WebP
                  <img
                    key={displayTier}
                    src={immersivePreviewUrl(submissionId, displayTier)}
                    alt=""
                    className="max-h-[100dvh] max-w-[100dvw] object-contain"
                    draggable={false}
                    decoding="async"
                    onError={() => setImgErr(true)}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
