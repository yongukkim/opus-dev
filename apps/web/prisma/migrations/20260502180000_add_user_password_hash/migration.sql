-- ISO 27001 A.10.1.1 / A.9.4.2 — optional bcrypt password for console email/password sign-in (storefront OAuth users remain NULL).
-- KO: 콘솔 전용 이메일·비밀번호 인증용 해시만 저장한다(스토어 Google 전용 계정은 NULL).
-- JA: コンソール用メール・パスワード認証のハッシュのみを保存する（ストアOAuth専用はNULL）。
-- EN: Stores bcrypt hash only for console credentials; OAuth-only accounts keep this column NULL.
ALTER TABLE "users" ADD COLUMN "password_hash" VARCHAR(255);
