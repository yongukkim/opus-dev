-- ISO 27001 A.9.4.2 — operator console email OTP storage (hashed only).
CREATE TABLE "console_login_otp" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "email_norm" TEXT NOT NULL,
    "code_hash" VARCHAR(64) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "consumed_at" TIMESTAMP(3),
    "verify_attempts" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "console_login_otp_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "console_login_otp_email_norm_created_at_idx" ON "console_login_otp"("email_norm", "created_at");
