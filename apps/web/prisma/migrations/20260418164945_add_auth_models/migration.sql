-- OPUS — add Auth.js (NextAuth v5) Prisma adapter models + APPI consent ledger.
-- ISO 27001 A.9.2.1 / A.9.4.2 / A.10.1.1 / A.18.1.4 (§2, §3, §4, §7) Privacy by Design / Least-Privilege RBAC / Crypto controls
-- KO: 본 마이그레이션은 (1) OAuth 인증을 위한 최소 식별자(email/name/image)와 (2) APPI 동의 시점·버전·국외이전·마케팅을 분리 기록하는 컬럼,
--     (3) Auth.js 표준 accounts/sessions/verification_tokens 테이블, (4) RBAC 용 OpusRole(기본 COLLECTOR) 을 추가한다.
--     provider 토큰은 DB 저장만 허용하며 응답·로그에 노출하지 않는다.
-- JA: 本マイグレーションは、(1) OAuth認証に必要な最小限の識別子、(2) APPI同意の時刻・版・国外移転・マーケティング項目を分離して記録、
--     (3) Auth.js標準のaccounts/sessions/verification_tokens、(4) RBAC用OpusRole(既定COLLECTOR)を追加する。
--     プロバイダ発行トークンはDB保存のみ許可し、ログ・レスポンスへ漏らさない。
-- EN: Adds (1) minimum identity columns required for OAuth, (2) APPI consent ledger split by purpose & version
--     (incl. cross-border transfer + optional marketing), (3) Auth.js Prisma-adapter standard tables, and (4) OpusRole for RBAC.
--     Provider tokens are persisted at-rest only — never echoed in logs or HTTP responses.

-- CreateEnum
CREATE TYPE "OpusRole" AS ENUM ('COLLECTOR', 'ARTIST', 'OPERATOR');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "email" TEXT,
ADD COLUMN     "email_verified" TIMESTAMP(3),
ADD COLUMN     "image" TEXT,
ADD COLUMN     "marketing_opt_in_at" TIMESTAMP(3),
ADD COLUMN     "name" TEXT,
ADD COLUMN     "overseas_transfer_accepted_at" TIMESTAMP(3),
ADD COLUMN     "privacy_accepted_at" TIMESTAMP(3),
ADD COLUMN     "privacy_version_accepted" VARCHAR(32),
ADD COLUMN     "role" "OpusRole" NOT NULL DEFAULT 'COLLECTOR',
ADD COLUMN     "tos_accepted_at" TIMESTAMP(3),
ADD COLUMN     "tos_version_accepted" VARCHAR(32);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_account_id" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "session_token" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateIndex
CREATE INDEX "accounts_user_id_idx" ON "accounts"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_provider_account_id_key" ON "accounts"("provider", "provider_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_session_token_key" ON "sessions"("session_token");

-- CreateIndex
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
