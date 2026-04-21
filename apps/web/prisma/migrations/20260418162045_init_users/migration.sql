-- OPUS first migration — `users` table.
-- ISO 27001 A.18.1.4 (§7) Privacy by Design / APPI alignment
-- KO: PII 최소화 원칙에 따라 신분증 이미지 경로·카드번호 등 원본은 저장하지 않고, 외부 eKYC 결과 ref·플래그만 보관한다.
-- JA: PII最小化に沿って、身分証画像のパスやカード番号などの原本は保存せず、外部eKYC結果のrefとフラグのみ保持する。
-- EN: Follows data minimization: no ID image paths or PAN; only external eKYC outcome refs and flags are persisted.

-- CreateEnum
CREATE TYPE "SellerEkycStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "buyer_age_self_attested_at" TIMESTAMP(3),
    "is_adult" BOOLEAN NOT NULL DEFAULT false,
    "credit_card_age_verified_at" TIMESTAMP(3),
    "credit_card_verification_ref" VARCHAR(191),
    "seller_ekyc_status" "SellerEkycStatus",
    "seller_ekyc_external_ref" VARCHAR(191),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);
