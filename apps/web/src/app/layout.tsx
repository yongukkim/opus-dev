import type { Metadata, Viewport } from "next";
import "@fontsource/cinzel/400.css";
import "@fontsource/cinzel/600.css";
import "@fontsource/cinzel/700.css";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/500.css";
import "@fontsource/noto-sans/300.css";
import "@fontsource/noto-sans/400.css";
import "@fontsource/noto-sans/500.css";
import "@fontsource/noto-sans/700.css";
import "@fontsource/noto-sans-kr/300.css";
import "@fontsource/noto-sans-kr/400.css";
import "@fontsource/noto-sans-kr/500.css";
import "@fontsource/noto-sans-kr/700.css";
import "@fontsource/noto-sans-jp/300.css";
import "@fontsource/noto-sans-jp/400.css";
import "@fontsource/noto-sans-jp/500.css";
import "@fontsource/noto-sans-jp/700.css";
import "@fontsource/zen-old-mincho/400.css";
import "@fontsource/zen-old-mincho/500.css";
import "@fontsource/zen-old-mincho/600.css";
import "@fontsource/zen-old-mincho/700.css";
import { headers } from "next/headers";
import type { ReactNode } from "react";
import { defaultLocale, locales, type Locale } from "@/i18n/config";
import { Providers } from "./providers";
import "./globals.css";

/**
 * ISO 27001 A.8.1.1 (§8) — supply chain: pinned npm font packages (SIL OFL), no runtime gstatic fetch.
 * KO: 폰트 바이너리는 `@fontsource/*`로 빌드 산출물에 포함되어 동일 출처로 제공되며, 런타임에 Google Fonts CDN을 치지 않습니다.
 * JA: フォントは `@fontsource/*` でビルド成果物に同梱され、ランタイムで Google Fonts CDN を参照しません。
 * EN: Font binaries ship inside the app bundle via `@fontsource/*`; no runtime fetch to Google Fonts CDN.
 * KO/EN/JA UI sans: Noto Sans / Noto Sans KR / Noto Sans JP (`globals.css` `--font-opus-ui-sans`)로 OS별 기본 서체 차이를 줄입니다.
 */

export const metadata: Metadata = {
  title: {
    default: "OPUS",
    template: "%s | OPUS",
  },
  description:
    "OPUS — authenticated non-fungible digital art editions and The Chronicle. Crafted for collecting and appreciation, not investment positioning.",
  applicationName: "OPUS",
  openGraph: {
    title: "OPUS",
    description:
      "Premium digital art archive for collectible ownership experiences — near-black charcoal, champagne brass, provenance and the vault. Not an investment product.",
    type: "website",
    locale: "ko_KR",
  },
};

export const viewport: Viewport = {
  themeColor: "#0E0E0E",
  colorScheme: "dark",
};

function headerLocale(value: string | null): Locale {
  if (value && (locales as readonly string[]).includes(value)) {
    return value as Locale;
  }
  return defaultLocale;
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const h = await headers();
  const lang = headerLocale(h.get("x-opus-locale"));

  return (
    <html lang={lang} data-opus-typography={lang}>
      <body className="font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
