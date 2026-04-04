"use client";

import { useEffect } from "react";

/**
 * OPUS — viewport friction (not DRM).
 * KO: 우클릭·일반 인쇄 단축키만 완화합니다. OS/브라우저 스크린샷·화면 녹화·PDF·개발자도구로는 우회되며 무결한 콘텐츠 보호를 제공하지 않습니다.
 * JA: 右クリックや一般的な印刷ショートカットを抑止します。OS/ブラウザのスクリーンショット・録画・PDF・開発者ツールでは回避され、完全な保護にはなりません。
 * EN: Deters context menu and common print shortcuts only; OS screenshots, recording, PDF, and devtools can bypass—this is not content DRM.
 */
function isCommonPrintShortcut(e: KeyboardEvent): boolean {
  const byCode = e.code === "KeyP";
  const byKey = e.key?.toLowerCase() === "p";
  if (!byCode && !byKey) return false;
  return e.ctrlKey || e.metaKey;
}

export function ViewportContentFriction() {
  useEffect(() => {
    const onContextMenu = (ev: MouseEvent) => {
      ev.preventDefault();
    };

    const onKeyDown = (ev: KeyboardEvent) => {
      if (isCommonPrintShortcut(ev)) {
        ev.preventDefault();
        ev.stopPropagation();
      }
    };

    document.addEventListener("contextmenu", onContextMenu);
    document.addEventListener("keydown", onKeyDown, true);

    return () => {
      document.removeEventListener("contextmenu", onContextMenu);
      document.removeEventListener("keydown", onKeyDown, true);
    };
  }, []);

  return null;
}
