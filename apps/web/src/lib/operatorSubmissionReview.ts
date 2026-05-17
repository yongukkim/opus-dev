import { parseEditionObject, type ParsedEdition } from "@/lib/editionFields";
import { appendIssuanceChronicleIfNewlyApproved } from "@/lib/chronicleLedger";
import { issueEditionCertificatesOnApprovalWithResult } from "@/lib/editionCertificate";
import { applyCertificateLedgerOpusSubmissionBackfill } from "@/lib/editionLedgerBinding";
import { enqueueMintJobForApprovedSubmission } from "@/lib/onchainMintQueue";
import {
  appendSubmissionReviewPatch,
  getSubmissionById,
  SubmissionLedgerValidationError,
  type SubmissionRecord,
} from "@/lib/privateStorage";

type ReviewStatus = NonNullable<SubmissionRecord["reviewStatus"]>;
type ContentRating = NonNullable<SubmissionRecord["contentRating"]>;

export type OperatorReviewRequestBody = Partial<{
  reviewStatus: ReviewStatus;
  contentRating: ContentRating;
  reviewNote: string;
  edition: unknown;
}>;

/**
 * ISO 27001 A.9.2.1 / A.14.2.1 / A.12.4.1 — Shared operator review mutation (session API + internal console API).
 * KO: 검수 확정·Chronicle·민팅 큐 부가 기록의 분기를 단일 구현으로 유지해 불일치를 방지한다.
 * JA: 審査確定とChronicle・ミントキュー付帯を単一実装に保ち、不整合を防ぐ。
 * EN: Keep review persistence + Chronicle + mint-queue side effects in one implementation to avoid drift.
 */
export async function runOperatorSubmissionReview(input: {
  reviewerId: string;
  submissionId: string;
  body: unknown;
}): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  const { reviewerId, submissionId, body: rawBody } = input;

  const submission = await getSubmissionById(submissionId);
  if (!submission) {
    return { ok: false, status: 404, error: "not_found" };
  }
  if ((submission.reviewStatus ?? "pending_review") === "withdrawn") {
    return { ok: false, status: 409, error: "withdrawn" };
  }

  let body: OperatorReviewRequestBody;
  if (rawBody !== null && typeof rawBody === "object") {
    body = rawBody as OperatorReviewRequestBody;
  } else {
    return { ok: false, status: 400, error: "invalid_request" };
  }

  const reviewStatus = body.reviewStatus;
  const contentRating = body.contentRating;
  const reviewNote = typeof body.reviewNote === "string" ? body.reviewNote : undefined;

  const allowedStatus: ReviewStatus[] = ["pending_review", "approved", "changes_requested", "rejected"];
  const allowedRating: ContentRating[] = ["general", "mature", "explicit"];
  if (!reviewStatus || !allowedStatus.includes(reviewStatus)) {
    return { ok: false, status: 400, error: "invalid_request" };
  }
  if (!contentRating || !allowedRating.includes(contentRating)) {
    return { ok: false, status: 400, error: "invalid_request" };
  }

  const normalizedStatus: ReviewStatus =
    contentRating === "explicit" && reviewStatus === "approved" ? "rejected" : reviewStatus;

  let editionOverride: ParsedEdition | undefined;
  if (body.edition !== undefined) {
    if (body.edition === null || typeof body.edition !== "object") {
      return { ok: false, status: 400, error: "invalid_edition" };
    }
    const cur = submission.reviewStatus ?? "pending_review";
    if (cur !== "pending_review" && cur !== "changes_requested") {
      return { ok: false, status: 409, error: "edition_locked" };
    }
    const ep = parseEditionObject(body.edition);
    if (!ep.ok) {
      return { ok: false, status: 400, error: ep.error };
    }
    editionOverride = ep.value;
  }

  let written: SubmissionRecord;
  try {
    written = await appendSubmissionReviewPatch({
      submission,
      reviewerId,
      reviewStatus: normalizedStatus,
      contentRating,
      reviewNote,
      editionOverride,
    });
  } catch (e) {
    if (e instanceof SubmissionLedgerValidationError) {
      return { ok: false, status: 422, error: "submission_identity_incomplete" };
    }
    throw e;
  }

  let chronicleIssuanceId: string | null = null;
  try {
    chronicleIssuanceId = await appendIssuanceChronicleIfNewlyApproved({ before: submission, written });
  } catch {
    /* auxiliary failure — see route comment ISO A.12.4.1 */
  }

  const certResult = await issueEditionCertificatesOnApprovalWithResult(written, chronicleIssuanceId);
  if (!certResult.ok) {
    console.error(
      "[operator-review]",
      JSON.stringify({
        event: "certificate_issuance_failed",
        submissionId: written.id,
        reason: certResult.reason,
        detail: certResult.detail,
      }),
    );
  } else if (normalizedStatus === "approved" && (certResult.issued > 0 || certResult.skippedExisting > 0)) {
    try {
      await applyCertificateLedgerOpusSubmissionBackfill(false);
    } catch {
      /* auxiliary — JSONL + cert rows remain authoritative */
    }
  }

  try {
    await enqueueMintJobForApprovedSubmission(written);
  } catch {
    /* auxiliary failure */
  }

  return { ok: true };
}
