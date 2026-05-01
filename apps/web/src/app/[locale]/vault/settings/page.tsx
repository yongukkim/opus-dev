import { auth } from "@/auth";
import { getDictionary } from "@/i18n/catalog";
import { normalizeLocale, withLocale } from "@/i18n/paths";
import { VaultAuthGate } from "@/components/vault/VaultAuthGate";
import { AccountSettingsPanel } from "@/components/account/AccountSettingsPanel";

type Props = { params: Promise<{ locale: string }> };

export default async function VaultSettingsPage({ params }: Props) {
  const { locale: raw } = await params;
  const locale = normalizeLocale(raw);
  const m = getDictionary(locale);
  const v = m.vault;

  const session = await auth();
  if (!session?.user) {
    return <VaultAuthGate locale={locale} m={m} returnTo={withLocale(locale, "/vault/settings")} />;
  }

  return (
    <main className="flex-1 p-6 pb-24 text-opus-warm/80 md:p-10">
      <h1 className="font-display text-2xl text-opus-warm">{v.settingsTitle}</h1>
      <p className="mt-3 font-sans text-sm text-opus-warm/55">{m.accountSettings.subtitle}</p>
      <div className="mt-10 max-w-3xl">
        <AccountSettingsPanel locale={locale} m={m} />
      </div>
    </main>
  );
}
