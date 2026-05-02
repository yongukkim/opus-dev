import type { Metadata } from "next";
import { headers } from "next/headers";
import { defaultLocale, isSupportedLocale } from "@/i18n/config";
import "./globals.css";

export const metadata: Metadata = {
  title: "OPUS Console",
  description: "Operator tools",
  robots: { index: false, follow: false },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const h = await headers();
  const raw = h.get("x-opus-console-locale");
  const lang = isSupportedLocale(raw ?? undefined) ? raw! : defaultLocale;

  return (
    <html lang={lang} suppressHydrationWarning>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
