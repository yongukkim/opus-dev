"use client";

import { useLayoutEffect, type ReactNode } from "react";
import { usePathname } from "next/navigation";

/**
 * ISO 27001 A.18.1.4 (§7) — UX only; no PII.
 * KO: 인증서 전용 라우트 진입·에디션 전환 시 뷰포트를 맨 위로 고정해 모바일 브라우저의 스크롤 복원 오류를 줄입니다.
 * JA: 認証書ルート表示・エディション切替時にビューポートを先頭へ固定し、モバイルのスクロール復元ずれを抑えます。
 * EN: Pin the viewport to the top on this route (including client navigations) to reduce mobile scroll-restoration jumps.
 */
export function VaultCertificateScrollShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [pathname]);

  return <>{children}</>;
}
