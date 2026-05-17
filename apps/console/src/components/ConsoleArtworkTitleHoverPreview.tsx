"use client";

import { useCallback, useId, useState } from "react";

const PREVIEW_W = 160;
const PREVIEW_H = 200;
const OFFSET = 12;

export function ConsoleArtworkTitleHoverPreview({
  title,
  submissionId,
  previewMode,
}: {
  title: string;
  submissionId: string;
  /** Dev preview shell — no bridge image fetch. */
  previewMode: boolean;
}) {
  const tooltipId = useId();
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [failed, setFailed] = useState(false);

  const canPreview = !previewMode && submissionId.length > 0;
  const src = canPreview
    ? `/api/bridge/submissions/${encodeURIComponent(submissionId)}/preview`
    : null;
  const showTooltip = open && src != null && !failed;

  const onEnter = useCallback(
    (e: React.MouseEvent<HTMLSpanElement>) => {
      if (!canPreview) return;
      const rect = e.currentTarget.getBoundingClientRect();
      let x = rect.left;
      let y = rect.top - OFFSET;
      if (x + PREVIEW_W + 16 > window.innerWidth) {
        x = Math.max(8, window.innerWidth - PREVIEW_W - 16);
      }
      if (y - PREVIEW_H < 8) {
        y = rect.bottom + OFFSET;
      }
      setPos({ x, y });
      setOpen(true);
    },
    [canPreview],
  );

  const displayTitle = title || "—";

  return (
    <>
      <span
        className={
          canPreview
            ? "cursor-default underline decoration-neutral-300/80 decoration-dotted underline-offset-2"
            : undefined
        }
        onMouseEnter={onEnter}
        onMouseLeave={() => setOpen(false)}
      >
        {displayTitle}
      </span>
      {showTooltip ? (
        <ArtworkPreviewTooltip
          id={tooltipId}
          src={src}
          x={pos.x}
          y={pos.y}
          alt={displayTitle}
          onError={() => setFailed(true)}
        />
      ) : null}
    </>
  );
}

function ArtworkPreviewTooltip({
  id,
  src,
  x,
  y,
  alt,
  onError,
}: {
  id: string;
  src: string;
  x: number;
  y: number;
  alt: string;
  onError: () => void;
}) {
  return (
    <div
      id={id}
      role="tooltip"
      className="pointer-events-none fixed z-[100]"
      style={{ left: x, top: y, transform: "translateY(-100%)", width: PREVIEW_W }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        width={PREVIEW_W}
        height={PREVIEW_H}
        className="block h-auto max-h-[200px] w-[160px] rounded-md border border-neutral-200 bg-neutral-100 object-contain shadow-lg"
        onError={onError}
      />
    </div>
  );
}
