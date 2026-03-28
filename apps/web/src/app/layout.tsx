import type { Metadata, Viewport } from "next";
import { Cinzel, JetBrains_Mono } from "next/font/google";
import { headers } from "next/headers";
import type { ReactNode } from "react";
import { defaultLocale, locales, type Locale } from "@/i18n/config";
import { Providers } from "./providers";
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
    <html lang={lang} className={`${cinzel.variable} ${jetbrainsMono.variable}`}>
      <body className="font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
