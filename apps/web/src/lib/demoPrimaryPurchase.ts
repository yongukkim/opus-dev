import { reissueEditionCertificatesOnCustodyTransfer } from "@/lib/editionCertificate";
import {
  getCurrentOwner,
  getSubmissionById,
  transferOwnershipToBuyer,
  type OpusRole,
} from "@/lib/privateStorage";

export type DemoPrimarySettleOutcome =
  | "disabled"
  | "not_collector"
  | "invalid_submission"
  | "already_owned"
  | "not_available"
  | "settled"
  | "transfer_error";

/**
 * ISO 27001 A.9.2.1 (§4) / A.12.4.1 (§5) / A.13.1.3 (§6)
 * KO: 실결제 없이 소유를 바꾸는 데모 경로는 명시적 환경변수가 켜진 경우에만, 소장자 역할과 스튜디오 소장 상태를 검증한 뒤에만 실행합니다.
 * JA: 実決済なしのデモ所有移転は、明示の環境変数が有効な場合に限り、コレクター役割とスタジオ保管状態を検証した上でのみ実行します。
 * EN: Demo custody transfer without live payment runs only when an explicit env flag is set, after RBAC and studio-hold checks.
 */
export async function attemptDemoPrimaryPurchaseSettle(input: {
  submissionId: string;
  buyerUserId: string;
  buyerRole: OpusRole;
}): Promise<DemoPrimarySettleOutcome> {
  if (process.env["OPUS_DEMO_PRIMARY_PURCHASE"]?.trim() !== "true") {
    return "disabled";
  }
  if (input.buyerRole !== "collector") {
    return "not_collector";
  }

  const sid = input.submissionId.trim();
  if (!sid) return "invalid_submission";

  const submission = await getSubmissionById(sid);
  if (!submission || (submission.reviewStatus ?? "pending_review") !== "approved") {
    return "invalid_submission";
  }

  const owner = await getCurrentOwner(submission.id, submission.artistId);
  if (owner.ownerId === input.buyerUserId && owner.ownerType === "collector") {
    return "already_owned";
  }
  if (!(owner.ownerType === "artist" && owner.ownerId === submission.artistId)) {
    return "not_available";
  }

  try {
    await transferOwnershipToBuyer({
      submission,
      buyerId: input.buyerUserId,
      buyerRole: "collector",
    });
    try {
      await reissueEditionCertificatesOnCustodyTransfer({
        submissionId: sid,
        newCustodyUserId: input.buyerUserId,
        newOwnerType: "collector",
      });
    } catch {
      /* certificate append is auxiliary */
    }
    return "settled";
  } catch {
    return "transfer_error";
  }
}
