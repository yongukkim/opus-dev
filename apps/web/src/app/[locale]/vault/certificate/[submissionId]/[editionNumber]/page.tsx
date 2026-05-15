import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getDictionary } from "@/i18n/catalog";
import { normalizeLocale, withLocale } from "@/i18n/paths";
import { opusArtworkGenreLabel } from "@/lib/artworkGenreDisplay";
import {
  canAccessSubmission,
  getCurrentOwner,
  getSubmissionById,
  type Actor,
  type OpusRole,
} from "@/lib/privateStorage";
import {
  ensureEditionCertificatesBackfill,
  getLatestEditionCertificate,
  verifyEditionCertificateRecord,
  verifyEditionCertificateTimeAnchor,
} from "@/lib/editionCertificate";
import { VaultCertificateScrollShell } from "@/components/vault/VaultCertificateScrollShell";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ locale: string; submissionId: string; editionNumber: string }>;
};

function formatLocaleDateTime(iso: string, locale: "en" | "ja" | "ko"): string {
  const tag = locale === "ja" ? "ja-JP" : locale === "ko" ? "ko-KR" : "en-US";
  try {
    return new Intl.DateTimeFormat(tag, { dateStyle: "long", timeStyle: "short" }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function sessionToActor(userId: string, role: string | undefined): Actor | null {
  const r = role === "artist" || role === "operator" || role === "collector" ? role : "collector";
  return { userId, role: r as OpusRole };
}

function digestShort(hex: string): string {
  if (hex.length <= 36) return hex;
  return `${hex.slice(0, 16)}…${hex.slice(-12)}`;
}

/**
 * ISO 27001 A.9.2.1 (§4) / A.12.4.1 (§5) / A.13.1.3 (§6)
 * KO: 인증서 화면은 소유자·해당 작가·운영자만 보며, 동일 규칙을 에디션 인증 JSON API와 맞춥니다.
 * JA: 認証書画面は所有者・当該作家・運営のみが閲覧でき、エディション認証JSON APIと同一の規則です。
 * EN: The certificate screen is visible only to the custodian, registering artist, or operators — same rule as the JSON API.
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale = normalizeLocale(raw);
  const d = getDictionary(locale);
  return { title: d.vault.certificateHeading };
}

export default async function VaultEditionCertificatePage({ params }: Props) {
  const { locale: raw, submissionId: rawSid, editionNumber: edRaw } = await params;
  const locale = normalizeLocale(raw);
  const v = getDictionary(locale).vault;
  const ct = getDictionary(locale).collectorTransfer;

  const submissionId = rawSid?.trim() ?? "";
  const editionNum = Number.parseInt(edRaw ?? "", 10);
  if (!submissionId || !Number.isFinite(editionNum) || editionNum < 1) {
    return (
      <VaultCertificateScrollShell>
        <CertificateNotice
          title={v.certificateNotFoundTitle}
          body={v.certificateNotFoundBody}
          backHref={withLocale(locale, "/vault/collection")}
          backLabel={v.certificateBackCollection}
        />
      </VaultCertificateScrollShell>
    );
  }

  const session = await auth();
  if (!session?.user?.id) {
    const returnTo = encodeURIComponent(
      withLocale(locale, `/vault/certificate/${encodeURIComponent(submissionId)}/${editionNum}`),
    );
    redirect(`${withLocale(locale, "/login")}?returnTo=${returnTo}`);
  }

  const actor = sessionToActor(session.user.id, session.user.role);
  if (!actor) {
    redirect(`${withLocale(locale, "/login")}`);
  }

  const submission = await getSubmissionById(submissionId);
  if (!submission) {
    return (
      <VaultCertificateScrollShell>
        <CertificateNotice
          title={v.certificateNotFoundTitle}
          body={v.certificateNotFoundBody}
          backHref={withLocale(locale, "/vault/collection")}
          backLabel={v.certificateBackCollection}
        />
      </VaultCertificateScrollShell>
    );
  }

  if ((submission.reviewStatus ?? "pending_review") === "withdrawn") {
    return (
      <VaultCertificateScrollShell>
        <CertificateNotice
          title={v.certificateNotFoundTitle}
          body={v.certificateNotFoundBody}
          backHref={withLocale(locale, "/vault/collection")}
          backLabel={v.certificateBackCollection}
        />
      </VaultCertificateScrollShell>
    );
  }

  const owner = await getCurrentOwner(submission.id, submission.artistId);
  if (!canAccessSubmission(actor, submission, owner)) {
    return (
      <VaultCertificateScrollShell>
        <CertificateNotice
          title={v.certificateForbiddenTitle}
          body={v.certificateForbiddenBody}
          backHref={withLocale(locale, "/vault/collection")}
          backLabel={v.certificateBackCollection}
        />
      </VaultCertificateScrollShell>
    );
  }

  let cert = await getLatestEditionCertificate(submissionId, editionNum);
  if (
    !cert &&
    submission.reviewStatus === "approved" &&
    editionNum >= 1 &&
    editionNum <= submission.initialMint
  ) {
    await ensureEditionCertificatesBackfill(submission);
    cert = await getLatestEditionCertificate(submissionId, editionNum);
  }
  if (!cert) {
    return (
      <VaultCertificateScrollShell>
        <CertificateNotice
          title={v.certificateNotFoundTitle}
          body={v.certificateNotFoundBody}
          backHref={withLocale(locale, "/vault/collection")}
          backLabel={v.certificateBackCollection}
        />
      </VaultCertificateScrollShell>
    );
  }

  const verified = verifyEditionCertificateRecord(cert);
  const timeAnchorVerify = verifyEditionCertificateTimeAnchor(cert);
  const workRegistered = formatLocaleDateTime(submission.createdAt, locale);
  const editionRegistered = formatLocaleDateTime(cert.approvedAtIso, locale);
  const issuedAt = formatLocaleDateTime(cert.issuedAtIso, locale);
  const editionLine =
    cert.editionMode === "unique"
      ? v.certificateEditionLineUnique
      : v.certificateEditionLineLimitedTpl.replace("{current}", String(cert.editionNumber)).replace(
          "{total}",
          String(cert.editionTotal),
        );
  const custodyLabel =
    cert.custodyOwnerType === "artist" ? v.certificateCustodyArtist : v.certificateCustodyCollector;
  const eventLabel = cert.event === "ISSUED" ? v.certificateEventIssued : v.certificateEventCustodyTransfer;
  const previewSrc = `/api/artwork-submissions/${encodeURIComponent(submission.id)}/public-preview`;

  return (
    <VaultCertificateScrollShell>
      <main className="px-4 py-8 md:px-8 md:py-12">
      <div className="mx-auto max-w-2xl">
        <div className="overflow-hidden rounded-2xl border border-white/[0.1] bg-[linear-gradient(165deg,rgba(30,30,30,0.95)_0%,rgba(14,14,14,0.98)_45%,#0e0e0e_100%)] shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
          <div className="border-b border-white/[0.06] px-6 py-5 md:px-10 md:py-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="font-mono text-[0.65rem] uppercase tracking-[0.28em] text-opus-warm/50">{v.certificateEyebrow}</p>
              <span className="rounded-full border border-opus-gold/25 bg-opus-gold/[0.07] px-3 py-1 font-mono text-[0.6rem] uppercase tracking-[0.14em] text-opus-gold-light">
                {eventLabel} · v{cert.version}
              </span>
            </div>
            <h1 className="mt-3 font-display text-2xl tracking-wide text-opus-warm md:text-3xl">{v.certificateHeading}</h1>
          </div>

          <div className="grid gap-8 px-6 py-8 md:grid-cols-[7.5rem_1fr] md:gap-10 md:px-10 md:py-10">
            <div className="mx-auto w-28 shrink-0 md:mx-0 md:w-[7.5rem]">
              <div className="relative aspect-square overflow-hidden rounded-lg border border-white/[0.12] bg-opus-slate/30 shadow-inner">
                {/* eslint-disable-next-line @next/next/no-img-element -- same-origin API preview; matches collection card */}
                <img
                  src={previewSrc}
                  alt={cert.artworkTitle}
                  className="h-full w-full object-cover opacity-95"
                />
              </div>
            </div>

            <dl className="grid gap-4 text-sm">
              <div className="grid gap-1 border-b border-white/[0.06] pb-3">
                <dt className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-opus-warm/45">{v.certificateArtistLabel}</dt>
                <dd className="font-display text-base text-opus-warm/95">{cert.artistDisplayName}</dd>
              </div>
              <div className="grid gap-1 border-b border-white/[0.06] pb-3">
                <dt className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-opus-warm/45">{v.certificateWorkTitleLabel}</dt>
                <dd className="text-base text-opus-warm/90">{cert.artworkTitle}</dd>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="grid gap-1">
                  <dt className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-opus-warm/45">
                    {v.certificateWorkRegisteredLabel}
                  </dt>
                  <dd className="text-opus-warm/80">{workRegistered}</dd>
                </div>
                <div className="grid gap-1">
                  <dt className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-opus-warm/45">
                    {v.certificateEditionRegisteredLabel}
                  </dt>
                  <dd className="text-opus-warm/80">{editionRegistered}</dd>
                </div>
              </div>
              <div className="grid gap-1 border-b border-white/[0.06] pb-3">
                <dt className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-opus-warm/45">{v.certificateEditionLabel}</dt>
                <dd className="font-mono text-[0.8rem] text-opus-gold-light/90">{editionLine}</dd>
              </div>
              <div className="grid gap-1 border-b border-white/[0.06] pb-3">
                <dt className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-opus-warm/45">{v.certificateOpusRecordLabel}</dt>
                <dd className="break-all font-mono text-[0.72rem] leading-relaxed text-opus-warm/70">{cert.bindingKey}</dd>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="grid gap-1">
                  <dt className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-opus-warm/45">{v.certificateCertificateIdLabel}</dt>
                  <dd className="break-all font-mono text-[0.72rem] text-opus-warm/75">{cert.id}</dd>
                </div>
                <div className="grid gap-1">
                  <dt className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-opus-warm/45">{v.certificateIssuedAtLabel}</dt>
                  <dd className="text-opus-warm/80">{issuedAt}</dd>
                </div>
              </div>
              <div className="grid gap-1 border-b border-white/[0.06] pb-3">
                <dt className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-opus-warm/45">{v.certificateChronicleLabel}</dt>
                <dd className="break-all font-mono text-[0.72rem] text-opus-warm/70">
                  {cert.chronicleIssuanceId?.trim() ? cert.chronicleIssuanceId : v.certificateChronicleNone}
                </dd>
              </div>
              <div className="grid gap-2 border-b border-white/[0.06] pb-3">
                {/* ISO 27001 A.12.4.1 (§5) — public commitment binds the signed digest; optional chain/TSA fields extend later without breaking HMAC payload. */}
                {/* KO: 타임 앵커는 서명 페이로드 밖의 보조 증빙으로 두어 기존 서명 검증과 호환됩니다. */}
                <dt className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-opus-warm/45">{v.certificateTimeAnchorTitle}</dt>
                <dd className="space-y-3 text-opus-warm/80">
                  <p className="text-xs leading-relaxed text-opus-warm/52">{v.certificateTimeAnchorBlurb}</p>
                  <div className="grid gap-1">
                    <span className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-opus-warm/45">
                      {v.certificateTimeAnchorCommitmentLabel}
                    </span>
                    <span className="break-all font-mono text-[0.72rem] text-opus-warm/70">
                      {digestShort(timeAnchorVerify.computedCommitmentHex)}
                    </span>
                  </div>
                  {cert.timeAnchor?.anchoredAtIso ? (
                    <div className="grid gap-1">
                      <span className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-opus-warm/45">
                        {v.certificateTimeAnchorAnchoredAtLabel}
                      </span>
                      <span className="text-sm">{formatLocaleDateTime(cert.timeAnchor.anchoredAtIso, locale)}</span>
                    </div>
                  ) : null}
                  {cert.timeAnchor?.chainId?.trim() ? (
                    <div className="grid gap-1">
                      <span className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-opus-warm/45">
                        {v.certificateTimeAnchorChainLabel}
                      </span>
                      <span className="break-all font-mono text-[0.72rem] text-opus-warm/70">{cert.timeAnchor.chainId}</span>
                    </div>
                  ) : null}
                  {cert.timeAnchor?.txHash?.trim() ? (
                    <div className="grid gap-1">
                      <span className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-opus-warm/45">
                        {v.certificateTimeAnchorTxLabel}
                      </span>
                      <span className="break-all font-mono text-[0.72rem] text-opus-warm/70">{cert.timeAnchor.txHash}</span>
                    </div>
                  ) : null}
                  {cert.timeAnchor?.externalAttestationRef?.trim() ? (
                    <div className="grid gap-1">
                      <span className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-opus-warm/45">
                        {v.certificateTimeAnchorExternalRefLabel}
                      </span>
                      <span className="break-all font-mono text-[0.72rem] text-opus-warm/70">
                        {cert.timeAnchor.externalAttestationRef}
                      </span>
                    </div>
                  ) : null}
                  <p
                    className={`font-mono text-[0.65rem] ${
                      timeAnchorVerify.status === "ok"
                        ? "text-emerald-400/90"
                        : timeAnchorVerify.status === "mismatch"
                          ? "text-amber-400/95"
                          : "text-opus-warm/55"
                    }`}
                    role="status"
                  >
                    {timeAnchorVerify.status === "ok"
                      ? v.certificateTimeAnchorVerifyOk
                      : timeAnchorVerify.status === "mismatch"
                        ? v.certificateTimeAnchorVerifyMismatch
                        : v.certificateTimeAnchorVerifyLegacy}
                  </p>
                </dd>
              </div>
              <div className="grid gap-1 border-b border-white/[0.06] pb-3">
                <dt className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-opus-warm/45">{v.certificateFormatLabel}</dt>
                <dd className="text-opus-warm/80">{opusArtworkGenreLabel(ct, submission.genre)}</dd>
              </div>
              <div className="grid gap-1">
                <dt className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-opus-warm/45">{v.certificateCustodyLabel}</dt>
                <dd className="text-opus-warm/80">{custodyLabel}</dd>
              </div>
            </dl>
          </div>

          <div className="flex flex-col items-center border-t border-white/[0.06] px-6 py-8 md:px-10">
            <div
              className="opus-surface-metallic flex h-24 w-24 flex-col items-center justify-center rounded-full border border-opus-gold/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]"
              aria-hidden
            >
              <span className="font-display text-lg tracking-[0.35em] text-opus-charcoal">OPUS</span>
            </div>
            <p className="mt-3 text-center font-mono text-[0.65rem] uppercase tracking-[0.22em] text-opus-gold-light/85">
              {v.certificateSealCaption}
            </p>
            <p className="mx-auto mt-6 max-w-md text-center text-xs leading-relaxed text-opus-warm/50">{v.certificateIntegrityBlurb}</p>
            <p
              className={`mt-3 font-mono text-[0.65rem] ${verified ? "text-emerald-400/90" : "text-amber-400/95"}`}
              role="status"
            >
              {verified ? v.certificateVerificationOk : v.certificateVerificationFail}
            </p>
            <p className="mt-4 font-mono text-[0.6rem] text-opus-warm/40">{v.certificateDigestLabel}</p>
            <p className="mt-1 max-w-full break-all px-2 text-center font-mono text-[0.65rem] text-opus-warm/55">{digestShort(cert.payloadDigest)}</p>
            <p className="mx-auto mt-8 max-w-lg text-center text-[0.65rem] leading-relaxed text-opus-warm/40">{v.certificateLegalFooter}</p>
          </div>

          <div className="border-t border-white/[0.06] bg-black/20 px-6 py-5 md:px-10">
            <Link
              href={withLocale(locale, "/vault/collection")}
              className="block text-center text-sm text-opus-warm/70 underline decoration-opus-gold/30 underline-offset-4 transition hover:text-opus-warm"
            >
              {v.certificateBackCollection}
            </Link>
          </div>
        </div>
      </div>
    </main>
    </VaultCertificateScrollShell>
  );
}

function CertificateNotice({
  title,
  body,
  backHref,
  backLabel,
}: {
  title: string;
  body: string;
  backHref: string;
  backLabel: string;
}) {
  return (
    <main className="flex min-h-[40vh] flex-col items-center justify-center px-6 py-16">
      <div className="max-w-md rounded-xl border border-white/[0.08] bg-opus-slate/20 p-8 text-center shadow-opus-card">
        <h1 className="font-display text-xl text-opus-warm">{title}</h1>
        <p className="mt-3 text-sm leading-relaxed text-opus-warm/55">{body}</p>
        <Link href={backHref} className="mt-6 inline-block text-sm text-opus-gold-light underline decoration-opus-gold/30 underline-offset-4">
          {backLabel}
        </Link>
      </div>
    </main>
  );
}
