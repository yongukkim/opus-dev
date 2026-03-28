import type { ReactNode } from "react";
import { VaultSidebar } from "@/components/vault/VaultSidebar";
import { getDictionary } from "@/i18n/catalog";
import { normalizeLocale } from "@/i18n/paths";

type Props = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

/**
 * Vault shell: sidebar + main (pattern: Web_Template mini_finance).
 */
export default async function VaultLayout({ children, params }: Props) {
  const { locale: raw } = await params;
  const locale = normalizeLocale(raw);
  const m = getDictionary(locale);

  return (
    <div className="flex min-h-[50vh] flex-col bg-opus-charcoal pt-[6.5rem] md:min-h-[calc(100dvh-12rem)] md:flex-row">
      <VaultSidebar locale={locale} m={m} />
      <div className="flex min-w-0 flex-1 flex-col border-t border-white/[0.05] md:border-l md:border-t-0">
        {children}
      </div>
    </div>
  );
}
