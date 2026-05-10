"use client";

import type React from "react";
import { createPortal } from "react-dom";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { ProtectedArtworkSurface } from "@/components/viewer/ProtectedArtworkSurface";

function immersivePreviewUrl(submissionId: string, tier: "fit" | "zoom") {
  return `/api/artwork-submissions/${encodeURIComponent(submissionId)}/immersive-preview?tier=${tier}`;
}

function fitContain(nw: number, nh: number, vw: number, vh: number) {
  if (nw <= 0 || nh <= 0 || vw <= 0 || vh <= 0) return { w: 0, h: 0 };
  const k = Math.min(vw / nw, vh / nh);
  return { w: nw * k, h: nh * k };
}

function clampPan(
  px: number,
  py: number,
  baseW: number,
  baseH: number,
  scale: number,
  vw: number,
  vh: number,
) {
  const sw = baseW * scale;
  const sh = baseH * scale;
  const maxX = Math.max(0, (sw - vw) / 2);
  const maxY = Math.max(0, (sh - vh) / 2);
  return {
    x: Math.min(maxX, Math.max(-maxX, px)),
    y: Math.min(maxY, Math.max(-maxY, py)),
  };
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
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [imgErr, setImgErr] = useState(false);
  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number } | null>(null);
  const [viewportPx, setViewportPx] = useState({ w: 0, h: 0 });

  const overlayRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const pinchRef = useRef<{ dist0: number; scale0: number } | null>(null);
  const panGestureRef = useRef<{
    active: boolean;
    startX: number;
    startY: number;
    origPanX: number;
    origPanY: number;
  } | null>(null);

  const tierRef = useRef<"fit" | "zoom">("fit");
  const scaleRef = useRef(1);
  const panRef = useRef({ x: 0, y: 0 });
  const enteredFsRef = useRef(false);

  tierRef.current = displayTier;
  scaleRef.current = pinchScale;
  panRef.current = pan;

  const close = useCallback(async () => {
    enteredFsRef.current = false;
    await exitFullscreenDoc();
    setOpen(false);
    setDisplayTier("fit");
    setPinchScale(1);
    setPan({ x: 0, y: 0 });
    setImgErr(false);
    setNaturalSize(null);
    setViewportPx({ w: 0, h: 0 });
    pinchRef.current = null;
    panGestureRef.current = null;
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

  useLayoutEffect(() => {
    if (!open || !viewportRef.current) return;
    const el = viewportRef.current;
    const ro = new ResizeObserver(() => {
      setViewportPx({ w: el.clientWidth, h: el.clientHeight });
    });
    ro.observe(el);
    setViewportPx({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, [open]);

  const base = naturalSize && viewportPx.w > 0 ? fitContain(naturalSize.w, naturalSize.h, viewportPx.w, viewportPx.h) : { w: 0, h: 0 };

  useEffect(() => {
    if (base.w <= 0 || viewportPx.w <= 0) return;
    setPan((p) => clampPan(p.x, p.y, base.w, base.h, pinchScale, viewportPx.w, viewportPx.h));
  }, [base.w, base.h, pinchScale, viewportPx.w, viewportPx.h]);

  useEffect(() => {
    if (pinchScale <= 1) setPan({ x: 0, y: 0 });
  }, [pinchScale]);

  const touchDist = (t: React.TouchList) => {
    const a = t.item(0);
    const b = t.item(1);
    if (!a || !b) return 0;
    return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
  };

  const applyPan = useCallback(
    (nx: number, ny: number) => {
      if (base.w <= 0 || viewportPx.w <= 0) return;
      setPan(clampPan(nx, ny, base.w, base.h, scaleRef.current, viewportPx.w, viewportPx.h));
    },
    [base.w, base.h, viewportPx.w, viewportPx.h],
  );

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const shell = open ? (
    <div
      ref={overlayRef}
      aria-label={ctaLabel}
      className="fixed inset-0 z-[200] flex h-[100dvh] w-screen max-w-[100vw] flex-col bg-[#0E0E0E] select-none"
      onContextMenu={(e) => e.preventDefault()}
      style={{
        WebkitTouchCallout: "none",
        touchAction: "none",
      }}
    >
      <div
        className="pointer-events-none absolute left-0 right-0 top-0 z-30 flex justify-end px-[max(0.5rem,env(safe-area-inset-right))] pb-2 pt-[max(0.35rem,env(safe-area-inset-top))]"
        style={{ paddingLeft: "max(0.5rem, env(safe-area-inset-left))" }}
      >
        <button
          type="button"
          onClick={() => void close()}
          className="pointer-events-auto rounded-lg border border-white/[0.12] bg-black/55 px-4 py-2 text-sm text-opus-warm/90 backdrop-blur-sm hover:bg-black/70"
        >
          {closeLabel}
        </button>
      </div>

      <div
        ref={viewportRef}
        className="relative min-h-0 min-w-0 flex-1 touch-none"
        onWheel={(e) => {
          if (e.ctrlKey) {
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
            return;
          }
          if (scaleRef.current > 1.02 && base.w > 0 && viewportPx.w > 0) {
            e.preventDefault();
            setPan((p) =>
              clampPan(p.x - e.deltaX, p.y - e.deltaY, base.w, base.h, scaleRef.current, viewportPx.w, viewportPx.h),
            );
          }
        }}
        onTouchStart={(e) => {
          if (e.touches.length === 2) {
            panGestureRef.current = null;
            pinchRef.current = { dist0: touchDist(e.touches), scale0: scaleRef.current };
            return;
          }
          if (e.touches.length === 1 && scaleRef.current > 1.02) {
            const t = e.touches.item(0);
            if (!t) return;
            pinchRef.current = null;
            panGestureRef.current = {
              active: true,
              startX: t.clientX,
              startY: t.clientY,
              origPanX: panRef.current.x,
              origPanY: panRef.current.y,
            };
          }
        }}
        onTouchMove={(e) => {
          if (e.touches.length === 2 && pinchRef.current) {
            panGestureRef.current = null;
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
            return;
          }
          if (e.touches.length === 1 && panGestureRef.current?.active) {
            const t = e.touches.item(0);
            if (!t) return;
            e.preventDefault();
            const g = panGestureRef.current;
            const dx = t.clientX - g.startX;
            const dy = t.clientY - g.startY;
            applyPan(g.origPanX + dx, g.origPanY + dy);
          }
        }}
        onTouchEnd={(ev) => {
          if (ev.touches.length < 2) pinchRef.current = null;
          if (ev.touches.length === 0) panGestureRef.current = null;
        }}
        onTouchCancel={() => {
          pinchRef.current = null;
          panGestureRef.current = null;
        }}
      >
        <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
          {imgErr ? (
            <div className="flex max-h-full w-full max-w-full items-center justify-center px-4">
              <p className="max-w-sm text-center text-sm text-opus-warm/65">{loadErrorLabel}</p>
            </div>
          ) : base.w > 0 && base.h > 0 ? (
            <div className="will-change-transform" style={{ transform: `translate3d(${pan.x}px, ${pan.y}px, 0)` }}>
              <div
                className="will-change-transform"
                style={{
                  width: base.w,
                  height: base.h,
                  transform: `scale(${pinchScale})`,
                  transformOrigin: "center center",
                }}
              >
                <ProtectedArtworkSurface
                  key={displayTier}
                  src={immersivePreviewUrl(submissionId, displayTier)}
                  alt=""
                  wrapperClassName="h-full w-full"
                  imgClassName="block h-full w-full object-contain"
                  decoding="async"
                  onLoad={(ev) => {
                    const { naturalWidth, naturalHeight } = ev.currentTarget;
                    if (naturalWidth > 0 && naturalHeight > 0) {
                      setNaturalSize({ w: naturalWidth, h: naturalHeight });
                    }
                  }}
                  onError={() => setImgErr(true)}
                />
              </div>
            </div>
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <span className="text-[0.65rem] text-opus-warm/35">…</span>
            </div>
          )}
        </div>
      </div>

      <p
        className="pointer-events-none absolute bottom-0 left-0 right-0 z-20 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 text-center text-[0.65rem] leading-relaxed text-opus-warm/45"
        style={{ paddingLeft: "max(1rem, env(safe-area-inset-left))", paddingRight: "max(1rem, env(safe-area-inset-right))" }}
      >
        {pinchHint}
      </p>
    </div>
  ) : null;

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => {
          setImgErr(false);
          setDisplayTier("fit");
          setPinchScale(1);
          setPan({ x: 0, y: 0 });
          setNaturalSize(null);
          setOpen(true);
        }}
        className="opus-surface-metallic inline-flex w-full items-center justify-center rounded-lg px-5 py-3 text-sm font-semibold tracking-wide text-black transition hover:opacity-95"
      >
        {ctaLabel}
      </button>

      {typeof document !== "undefined" && shell ? createPortal(shell, document.body) : null}
    </div>
  );
}
