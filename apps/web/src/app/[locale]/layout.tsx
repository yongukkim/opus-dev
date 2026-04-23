import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Footer } from "@/components/layout/Footer";
import { OmniSearchModal } from "@/components/search/OmniSearchModal";
import { OmniSearchProvider } from "@/components/search/OmniSearchProvider";
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
    <OmniSearchProvider>
      <div className="opus-app-root flex min-h-screen flex-col bg-opus-charcoal">
        <SiteHeader locale={locale} m={m} />
        <TrustStrip locale={locale} m={m} />
        <div className="flex-1">{children}</div>
        <Footer locale={locale} m={m} />
      </div>
      {/*
        PR-8 ⌘K omni-search modal (spec §4). Mounted at the bottom so it
        portals over every page in this locale. Receives `locale`, the
        `search.*` strings, and the `badge.*` channel labels — keeps it
        purely presentation; data fetch + state live in the provider.
      */}
      <OmniSearchModal locale={locale} t={m.search} badge={m.badge} />
    </OmniSearchProvider>
  );
}
