import { CollectorTransferRegisterForm } from "@/components/collector/CollectorTransferRegisterForm";
import { VaultAuthGate } from "@/components/vault/VaultAuthGate";
import { getDictionary } from "@/i18n/catalog";
import { normalizeLocale, withLocale } from "@/i18n/paths";
import { cookies, headers } from "next/headers";
import { hasDemoSessionFromCookies } from "@/lib/demoSession";
import { getVaultUiRoleFromCookies } from "@/lib/vaultRole";
import Link from "next/link";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ preview?: string | string[] }>;
};

function previewQueryOn(sp: { preview?: string | string[] }): boolean {
  const v = sp.preview;
  if (v === "1" || v === "true") return true;
  if (Array.isArray(v)) return v.includes("1") || v.includes("true");
  return false;
}

export default async function VaultTransferRegisterPage({ params, searchParams }: Props) {
  const { locale: raw } = await params;
  const locale = normalizeLocale(raw);
  const m = getDictionary(locale);
  const t = m.collectorTransfer;
  const returnTo = withLocale(locale, "/vault/transfer/register");
  const sp = await searchParams;
  const h = await headers();
  const previewFromMiddleware = h.get("x-opus-transfer-register-preview") === "1";
  const devPreviewActive =
    process.env.NODE_ENV !== "production" &&
    (previewFromMiddleware || previewQueryOn(sp));

  const cookieStore = await cookies();
  const hasSession = hasDemoSessionFromCookies(cookieStore);

  if (!devPreviewActive && !hasSession) {
    return (
      <VaultAuthGate
        locale={locale}
        m={m}
        returnTo={returnTo}
        developmentPreview={{
          href: `${returnTo}?preview=1`,
          label: t.devPreviewLink,
        }}
      />
    );
  }

  const vaultRole = getVaultUiRoleFromCookies(cookieStore);

  return (
    <main className="flex-1 p-6 pb-24 text-opus-warm/80 md:p-10">
      {devPreviewActive ? (
        <div
          className="mb-6 rounded-lg border border-amber-400/25 bg-amber-500/[0.12] px-4 py-3 text-sm leading-relaxed text-amber-100/90"
          role="status"
        >
          {t.devPreviewBanner}
        </div>
      ) : null}
      <p className="opus-text-metallic-soft font-mono text-[0.65rem] uppercase tracking-[0.28em]">{t.registerKicker}</p>
      <h1 className="mt-3 font-display text-2xl text-opus-warm md:text-3xl">{t.registerTitle}</h1>
      <p className="mt-4 max-w-2xl text-sm leading-relaxed text-opus-warm/55">{t.registerSubtitle}</p>
      <CollectorTransferRegisterForm locale={locale} m={m} vaultRole={vaultRole} />
      <div className="mt-10 flex flex-wrap gap-4 text-sm">
        <Link
          href={withLocale(locale, "/listings/collector-transfers")}
          className="text-opus-gold underline-offset-4 hover:text-opus-gold-light hover:underline"
        >
          {m.nav.collectorTransfers}
        </Link>
        <Link href={withLocale(locale, "/vault")} className="text-opus-warm/45 hover:text-opus-warm/70">
          ← Vault
        </Link>
      </div>
    </main>
  );
}
