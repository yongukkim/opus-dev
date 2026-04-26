import { CollectorTransferRegisterFormClient } from "@/components/collector/CollectorTransferRegisterFormClient";
import { VaultAuthGate } from "@/components/vault/VaultAuthGate";
import { getDictionary } from "@/i18n/catalog";
import { normalizeLocale, withLocale } from "@/i18n/paths";
import { auth } from "@/auth";
import { cookies, headers } from "next/headers";
import { getVaultUiRoleFromCookies, type VaultUiRole } from "@/lib/vaultRole";
import { resolveTransferRegisterLockedWork } from "@/lib/transferRegisterLockedWork";
import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ preview?: string | string[]; submissionId?: string | string[] }>;
};

function firstQuery(v: string | string[] | undefined): string {
  if (v == null) return "";
  return (Array.isArray(v) ? (v[0] ?? "") : v).trim();
}

function previewQueryOn(sp: { preview?: string | string[] }): boolean {
  const v = sp.preview;
  if (v === "1" || v === "true") return true;
  if (Array.isArray(v)) return v.includes("1") || v.includes("true");
  return false;
}

export default async function VaultTransferRegisterPage({ params, searchParams }: Props) {
  noStore();
  const { locale: raw } = await params;
  const locale = normalizeLocale(raw);
  const m = getDictionary(locale);
  const t = m.collectorTransfer;
  const returnTo = withLocale(locale, "/vault/transfer/register");
  const sp = await searchParams;
  const submissionIdParam = firstQuery(sp.submissionId);
  const h = await headers();
  const previewFromMiddleware = h.get("x-opus-transfer-register-preview") === "1";
  const devPreviewActive =
    process.env.NODE_ENV !== "production" &&
    (previewFromMiddleware || previewQueryOn(sp));

  const session = await auth();
  const hasSession = Boolean(session?.user);

  let vaultRole: VaultUiRole = session?.user?.role === "artist" ? "artist" : "collector";
  if (devPreviewActive && !hasSession) {
    const cookieStore = await cookies();
    vaultRole = getVaultUiRoleFromCookies(cookieStore);
  }

  type Gate = "missing_submission" | "invalid_submission" | null;
  let submissionGate: Gate = null;
  let lockedWork: Awaited<ReturnType<typeof resolveTransferRegisterLockedWork>> = null;

  if (hasSession && session?.user?.id) {
    const uid = session.user.id;
    const role = session.user.role;
    if (role === "collector") {
      if (!submissionIdParam) {
        if (process.env.NODE_ENV === "production") {
          submissionGate = "missing_submission";
        }
      } else {
        lockedWork = await resolveTransferRegisterLockedWork(submissionIdParam, uid);
        if (!lockedWork) submissionGate = "invalid_submission";
      }
    } else if (role === "artist" && submissionIdParam) {
      lockedWork = await resolveTransferRegisterLockedWork(submissionIdParam, uid);
      if (!lockedWork) submissionGate = "invalid_submission";
    }
  }

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
      {submissionGate === "missing_submission" ? (
        <div className="mt-10 max-w-xl rounded-xl border border-opus-gold/20 bg-opus-gold/[0.06] p-6 text-sm leading-relaxed text-opus-warm/80">
          <p>{t.transferRegisterMissingSubmission}</p>
          <p className="mt-3 text-xs text-opus-warm/50">{t.transferRegisterMissingSubmissionHint}</p>
          <div className="mt-6 flex flex-wrap gap-4">
            <Link
              href={withLocale(locale, "/vault")}
              className="text-opus-gold underline-offset-4 hover:text-opus-gold-light hover:underline"
            >
              {m.nav.vault}
            </Link>
            <Link
              href={withLocale(locale, "/releases")}
              className="text-opus-warm/50 underline-offset-4 hover:text-opus-warm/75 hover:underline"
            >
              {m.nav.releases}
            </Link>
          </div>
        </div>
      ) : submissionGate === "invalid_submission" ? (
        <div className="mt-10 max-w-xl rounded-xl border border-red-400/25 bg-red-500/10 p-6 text-sm text-red-100/90">
          <p>{t.transferRegisterInvalidSubmission}</p>
          <Link
            href={withLocale(locale, "/vault")}
            className="mt-4 inline-block text-opus-gold underline-offset-4 hover:underline"
          >
            ← {m.nav.vault}
          </Link>
        </div>
      ) : (
        <CollectorTransferRegisterFormClient
          locale={locale}
          m={m}
          vaultRole={vaultRole}
          lockedWork={lockedWork}
          sessionUserId={session?.user?.id}
        />
      )}
      <div className="mt-10 flex flex-wrap gap-4 text-sm">
        <Link
          href={withLocale(locale, "/provenance")}
          className="text-opus-gold underline-offset-4 hover:text-opus-gold-light hover:underline"
        >
          {m.nav.provenance}
        </Link>
        <Link href={withLocale(locale, "/vault")} className="text-opus-warm/45 hover:text-opus-warm/70">
          ← {m.nav.vault}
        </Link>
      </div>
    </main>
  );
}
