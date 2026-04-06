import * as ScreenCapture from "expo-screen-capture";

/**
 * Best-effort screen capture blocking.
 * KO: iOS/Android에서 스크린샷/화면녹화를 최대한 차단합니다. 탈옥/루팅·외부 카메라 촬영 등은 100% 방지 불가입니다.
 * JA: iOS/Androidでスクリーンショット/録画を可能な限りブロックします。脱獄/ルート化や外部カメラ撮影は100%防止できません。
 * EN: Best-effort blocking for screenshots/screen recording; cannot fully prevent on jailbroken/rooted devices or external cameras.
 *
 * ISO 27001 A.9.4.2 (§2)
 * KO: 감상 화면은 캡처 방지 플래그를 적용해 세션 보호 범위를 강화합니다.
 * JA: 鑑賞画面にキャプチャ防止を適用し、セッション保護を強化します。
 * EN: Apply capture prevention on viewing surfaces to strengthen session protection.
 */
export async function preventScreenCaptureAsync(): Promise<void> {
  try {
    await ScreenCapture.preventScreenCaptureAsync();
  } catch {
    // ignore (platform may not support)
  }
}

export async function allowScreenCaptureAsync(): Promise<void> {
  try {
    await ScreenCapture.allowScreenCaptureAsync();
  } catch {
    // ignore
  }
}

export function onScreenshot(callback: () => void): () => void {
  const sub = ScreenCapture.addScreenshotListener(() => callback());
  return () => sub.remove();
}

