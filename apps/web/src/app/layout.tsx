import type { Metadata, Viewport } from "next";
import { Cinzel, JetBrains_Mono, Noto_Sans_JP } from "next/font/google";
import type { ReactNode } from "react";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { TrustStrip } from "@/components/TrustStrip";
import { Providers } from "./providers";
import "./globals.css";

const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  display: "swap",
  variable: "--font-cinzel",
});

const notoSansJp = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--font-noto",
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
    locale: "ja_JP",
  },
};

export const viewport: Viewport = {
  themeColor: "#0E0E0E",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="ja"
      className={`${cinzel.variable} ${notoSansJp.variable} ${jetbrainsMono.variable}`}
    >
      <body className="font-sans">
        <Providers>
          <div className="flex min-h-screen flex-col bg-opus-charcoal">
            <SiteHeader />
            <TrustStrip />
            <div className="flex-1">{children}</div>
            <SiteFooter />
          </div>
        </Providers>
      </body>
    </html>
  );
}
