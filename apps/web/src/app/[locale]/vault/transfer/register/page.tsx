import { CollectorTransferRegisterFormClient } from "@/components/collector/CollectorTransferRegisterFormClient";
import { VaultAuthGate } from "@/components/vault/VaultAuthGate";
import { getDictionary } from "@/i18n/catalog";
import { normalizeLocale, withLocale } from "@/i18n/paths";
import { auth } from "@/auth";
import { cookies, headers } from "next/headers";
import { getVaultUiRoleFromCookies, type VaultUiRole } from "@/lib/vaultRole";
import { resolveTransferRegisterLockedWork } from "@/lib/transferRegisterLockedWork";
import { listSubmissionsHeldByUser } from "@/lib/privateStorage";
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
  const heldApprovedForTransfer =
    hasSession && session?.user?.id
      ? (await listSubmissionsHeldByUser(session.user.id)).filter(
          ({ submission }) =>
            (submission.reviewStatus ?? "pending_review") === "approved" &&
            submission.artistId !== session.user.id,
        )
      : [];

  let vaultRole: VaultUiRole = session?.user?.role === "artist" ? "artist" : "collector";
  if (devPreviewActive && !hasSession) {
    const cookieStore = await cookies();
    vaultRole = getVaultUiRoleFromCookies(cookieStore);
  }

  type Gate = "invalid_submission" | null;
  let submissionGate: Gate = null;
  let lockedWork: Awaited<ReturnType<typeof resolveTransferRegisterLockedWork>> = null;

  if (hasSession && session?.user?.id && submissionIdParam) {
    lockedWork = await resolveTransferRegisterLockedWork(submissionIdParam, session.user.id);
    if (!lockedWork) submissionGate = "invalid_submission";
  }

  const artistPrimaryInventory = Boolean(
    lockedWork && session?.user?.id && lockedWork.registeringArtistId === session.user.id,
  );

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
      {hasSession && !lockedWork ? (
        <section className="mt-10">
          <p className="font-display text-xl text-opus-warm">{t.registerSelectFromVaultTitle}</p>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-opus-warm/55">{t.registerSelectFromVaultBody}</p>
          {heldApprovedForTransfer.length === 0 ? (
            <div className="mt-6 max-w-xl rounded-xl border border-opus-gold/20 bg-opus-gold/[0.06] p-6 text-sm leading-relaxed text-opus-warm/80">
              <p>{t.registerSelectFromVaultEmpty}</p>
              <div className="mt-5">
                <Link
                  href={withLocale(locale, "/vault/collection")}
                  className="text-opus-gold underline-offset-4 hover:text-opus-gold-light hover:underline"
                >
                  {m.vault.collectionTitle}
                </Link>
              </div>
            </div>
          ) : (
            <ul className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {heldApprovedForTransfer.map(({ submission: rec }) => {
                const pen = rec.nickname?.trim() || "—";
                const href = withLocale(
                  locale,
                  `/vault/transfer/register?submissionId=${encodeURIComponent(rec.id)}`,
                );
                return (
                  <li
                    key={rec.id}
                    className="overflow-hidden rounded-xl border border-white/[0.08] bg-opus-slate/20 shadow-opus-card"
                  >
                    <div className="relative aspect-[4/3] bg-gradient-to-b from-[#1f1f1f] to-opus-charcoal">
                      {/* eslint-disable-next-line @next/next/no-img-element -- dynamic same-origin API WebP */}
                      <img
                        src={`/api/artwork-submissions/${encodeURIComponent(rec.id)}/public-preview`}
                        alt={rec.artworkTitle}
                        sizes="(min-width: 1280px) 320px, (min-width: 640px) 45vw, 90vw"
                        loading="lazy"
                        decoding="async"
                        className="absolute inset-0 h-full w-full object-cover opacity-95"
                      />
                    </div>
                    <div className="space-y-2 p-4">
                      <p className="line-clamp-2 font-display text-base text-opus-warm">{rec.artworkTitle}</p>
                      <p className="text-xs text-opus-warm/55">{pen}</p>
                      <Link
                        href={href}
                        className="opus-surface-metallic mt-2 inline-flex w-full items-center justify-center rounded-md px-3 py-2 text-center text-xs font-semibold text-opus-charcoal transition hover:opacity-95"
                      >
                        {t.registerSelectFromVaultCta}
                      </Link>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      ) : null}
      {submissionGate === "invalid_submission" ? (
        <div className="mt-10 max-w-xl rounded-xl border border-red-400/25 bg-red-500/10 p-6 text-sm text-red-100/90">
          <p>{t.transferRegisterInvalidSubmission}</p>
          <Link
            href={withLocale(locale, "/vault/collection")}
            className="mt-4 inline-block text-opus-gold underline-offset-4 hover:underline"
          >
            ← {m.nav.vault}
          </Link>
        </div>
      ) : lockedWork ? (
        <CollectorTransferRegisterFormClient
          locale={locale}
          m={m}
          vaultRole={vaultRole}
          lockedWork={lockedWork}
          sessionUserId={session?.user?.id}
          artistPrimaryInventory={artistPrimaryInventory}
        />
      ) : null}
      <div className="mt-10 flex flex-wrap gap-4 text-sm">
        <Link
          href={withLocale(locale, "/provenance")}
          className="text-opus-gold underline-offset-4 hover:text-opus-gold-light hover:underline"
        >
          {m.nav.provenance}
        </Link>
        <Link href={withLocale(locale, "/vault/collection")} className="text-opus-warm/45 hover:text-opus-warm/70">
          ← {m.nav.vault}
        </Link>
      </div>
    </main>
  );
}
