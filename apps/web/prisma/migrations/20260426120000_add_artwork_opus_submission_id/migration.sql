-- ISO 27001 A.12.4.1 (§5) — JSONL submission id on Artwork for idempotent Prisma dual-write on approval.
-- KO: 승인 시 Prisma Artwork upsert를 멱등하게 하기 위해 JSONL 제출 ID를 외부 키로 둔다.
-- JA: 承認時のPrisma Artwork upsertを冪等にするため、JSONL提出IDを外部キーとして保持する。
-- EN: Store JSONL submission id as an external key for idempotent Prisma Artwork upsert on approval.

ALTER TABLE "artworks" ADD COLUMN "opus_submission_id" VARCHAR(64);

CREATE UNIQUE INDEX "artworks_opus_submission_id_key" ON "artworks"("opus_submission_id");
