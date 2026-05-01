import { prisma } from "@/lib/prisma";

/** Dev/prod bootstrap list — keep in sync with ops runbooks; promotes to OPERATOR on first qualifying sign-in. */
export const OPUS_BOOTSTRAP_OPERATOR_EMAILS = new Set(["admin@opus-store.com"]);

/**
 * ISO 27001 A.9.2.1 (§4) — designated operator emails sync to OPERATOR in the shared DB.
 * KO: 지정 이메일은 콘솔·스토어가 공유하는 User 행에서 OPERATOR로 승격된다.
 * JA: 指定メールは共有User行でOPERATORへ昇格する。
 * EN: Listed emails are promoted to OPERATOR on the shared `User` row.
 */
export async function ensureBootstrapOperatorRoleByEmail(email: string): Promise<void> {
  const normalized = email.trim().toLowerCase();
  if (!OPUS_BOOTSTRAP_OPERATOR_EMAILS.has(normalized)) return;
  const row = await prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" }, NOT: { role: "OPERATOR" } },
    select: { id: true },
  });
  if (!row) return;
  await prisma.user.update({ where: { id: row.id }, data: { role: "OPERATOR" } });
}
