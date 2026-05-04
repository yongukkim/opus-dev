import type { Metadata } from "next";
import { headers } from "next/headers";
import { Cinzel, JetBrains_Mono, Noto_Sans_JP, Zen_Old_Mincho } from "next/font/google";
import { defaultLocale, isSupportedLocale } from "@/i18n/config";
import "./globals.css";

const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  display: "swap",
  variable: "--font-cinzel",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
  variable: "--font-mono-jb",
});

const notoSansJp = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  display: "swap",
  variable: "--font-noto-sans-jp",
  adjustFontFallback: true,
});

const zenOldMincho = Zen_Old_Mincho({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-zen-old-mincho",
  adjustFontFallback: true,
});

export const metadata: Metadata = {
  title: "OPUS Console",
  description: "Operator tools",
  robots: { index: false, follow: false },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const h = await headers();
  const raw = h.get("x-opus-console-locale");
  const lang = isSupportedLocale(raw ?? undefined) ? raw! : defaultLocale;
  const isJa = lang === "ja";

  const fontVars = [
    cinzel.variable,
    jetbrainsMono.variable,
    isJa ? notoSansJp.variable : "",
    isJa ? zenOldMincho.variable : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <html lang={lang} data-opus-typography={isJa ? "ja" : undefined} className={fontVars} suppressHydrationWarning>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
