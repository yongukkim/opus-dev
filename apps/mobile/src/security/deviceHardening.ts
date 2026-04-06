import { Platform } from "react-native";

/**
 * Device hardening utilities (best-effort).
 *
 * KO: 탈옥/루팅을 100% 정확히 탐지하는 것은 어렵습니다. 이 파일은 운영 단계에서 네이티브 탐지/앱 무결성/Attestation으로 확장하기 위한 자리표시자입니다.
 * JA: 脱獄/ルート化の100%正確な検知は困難です。本ファイルは本番でネイティブ検知・整合性・Attestationへ拡張するためのプレースホルダーです。
 * EN: Jailbreak/root detection is not perfectly reliable. This is a placeholder to extend with native detection and device attestation in production.
 *
 * ISO 27001 A.9.4.2 (§2)
 * KO: 민감 자산(고화질 감상)은 신뢰 가능한 단말/세션에 한정하는 방향으로 설계합니다.
 * JA: 機微資産（高画質鑑賞）は信頼できる端末/セッションに限定する方針で設計します。
 * EN: High-fidelity viewing should be limited to trusted devices/sessions (policy + controls).
 */
export async function getDeviceTrustSignals(): Promise<{
  platform: string;
  isEmulatorLikely: boolean;
  isRootedLikely: boolean;
}> {
  // TODO: integrate real checks:
  // - Android Play Integrity API
  // - iOS DeviceCheck/App Attest
  // - Native jailbreak/root heuristics (with caution; avoid false positives)
  return {
    platform: Platform.OS,
    isEmulatorLikely: false,
    isRootedLikely: false,
  };
}

