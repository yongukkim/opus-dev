import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { auth } from "@/auth";
import { VaultDevSessionUserIdPanel } from "@/components/vault/VaultDevSessionUserIdPanel";
import { VaultSidebar } from "@/components/vault/VaultSidebar";
import { getDictionary } from "@/i18n/catalog";
import { countArtistOperatorReviewNotices } from "@/lib/privateStorage";
import { getVaultUiRoleFromCookies } from "@/lib/vaultRole";
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
  const session = await auth();
  const vaultRole = getVaultUiRoleFromCookies(await cookies());
  const isOperator = session?.user?.role === "operator";
  const sessionIsArtist = session?.user?.role === "artist";

  let activityOperatorReviewNoticeCount = 0;
  if (sessionIsArtist && session?.user?.id) {
    activityOperatorReviewNoticeCount = await countArtistOperatorReviewNotices(session.user.id);
  }

  const devPanelUserId = session?.user?.id;
  const showDevUserIdPanel =
    Boolean(devPanelUserId) &&
    (process.env.NODE_ENV !== "production" || process.env["OPUS_SHOW_DEV_USER_ID_PANEL"] === "true");

  return (
    <div className="flex min-h-[50vh] flex-col bg-opus-charcoal pt-[var(--opus-header-plus-trust)] md:min-h-[calc(100dvh-12rem)] md:flex-row">
      <VaultSidebar
        locale={locale}
        m={m}
        vaultRole={vaultRole}
        sessionIsArtist={sessionIsArtist}
        isOperator={isOperator}
        activityOperatorReviewNoticeCount={activityOperatorReviewNoticeCount}
      />
      <div className="flex min-w-0 flex-1 flex-col border-t border-white/[0.05] md:border-l md:border-t-0">
        {showDevUserIdPanel && devPanelUserId ? (
          <VaultDevSessionUserIdPanel
            userId={devPanelUserId}
            labels={{
              kicker: m.vault.devSessionUserIdKicker,
              title: m.vault.devSessionUserIdTitle,
              body: m.vault.devSessionUserIdBody,
              copy: m.vault.devSessionUserIdCopy,
              copied: m.vault.devSessionUserIdCopied,
              copyFailed: m.vault.devSessionUserIdCopyFailed,
            }}
          />
        ) : null}
        {children}
      </div>
    </div>
  );
}
