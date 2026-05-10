"use client";

import type React from "react";

/**
 * ISO 27001 A.13.1.3 (§6) — client-side friction only (not DRM)
 * KO: 웹에서 이미지 저장·콜아웃을 어렵게 하는 UX 보조층이며, 네트워크·스크린샷 공격을 막지는 못합니다.
 * JA: Web上の保存・コールアウトを難しくするUX補助であり、通信・スクリーンショットは防げません。
 * EN: UX friction against casual save/callout; does not resist network capture or screenshots.
 */
export function ProtectedArtworkSurface({
  src,
  alt = "",
  imgClassName = "",
  wrapperClassName = "",
  shieldClassName = "",
  loading,
  decoding,
  onLoad,
  onError,
}: {
  src: string;
  alt?: string;
  imgClassName?: string;
  wrapperClassName?: string;
  shieldClassName?: string;
  loading?: React.ImgHTMLAttributes<HTMLImageElement>["loading"];
  decoding?: React.ImgHTMLAttributes<HTMLImageElement>["decoding"];
  onLoad?: React.ReactEventHandler<HTMLImageElement>;
  onError?: React.ReactEventHandler<HTMLImageElement>;
}) {
  const noSaveStyle: React.CSSProperties = {
    WebkitTouchCallout: "none",
    WebkitUserSelect: "none",
    userSelect: "none",
  };

  return (
    <div className={`relative max-w-full ${wrapperClassName}`}>
      {/* eslint-disable-next-line @next/next/no-img-element -- API WebP / same-origin */}
      <img
        src={src}
        alt={alt}
        className={`pointer-events-none select-none ${imgClassName}`}
        style={noSaveStyle}
        draggable={false}
        onDragStart={(e) => e.preventDefault()}
        onContextMenu={(e) => e.preventDefault()}
        loading={loading}
        decoding={decoding}
        onLoad={onLoad}
        onError={onError}
      />
      <div
        className={`absolute inset-0 z-[1] ${shieldClassName}`}
        aria-hidden
        style={noSaveStyle}
        onContextMenu={(e) => e.preventDefault()}
        onDragStart={(e) => e.preventDefault()}
      />
    </div>
  );
}
