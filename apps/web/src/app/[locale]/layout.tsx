import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Footer } from "@/components/layout/Footer";
import { SiteHeader } from "@/components/SiteHeader";
import { TrustStrip } from "@/components/TrustStrip";
import { ogLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/catalog";
import { normalizeLocale } from "@/i18n/paths";

type Props = { children: ReactNode; params: Promise<{ locale: string }> };

export function generateStaticParams() {
  return [{ locale: "ja" }, { locale: "ko" }, { locale: "en" }];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale = normalizeLocale(raw);
  const d = getDictionary(locale);
  return {
    description: d.meta.siteDescription,
    openGraph: {
      description: d.meta.ogDescription,
      locale: ogLocale[locale],
    },
  };
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale: raw } = await params;
  const locale = normalizeLocale(raw);
  const m = getDictionary(locale);

  return (
    <div className="opus-app-root flex min-h-screen flex-col bg-opus-charcoal">
      <SiteHeader locale={locale} m={m} />
      <TrustStrip locale={locale} m={m} />
      <div className="flex-1">{children}</div>
      <Footer locale={locale} m={m} />
    </div>
  );
}
