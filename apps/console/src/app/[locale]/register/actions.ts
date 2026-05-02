"use server";

import { hash } from "bcryptjs";
import type { Prisma } from "@prisma/client";
import { redirect } from "next/navigation";
import { getDictionary } from "@/i18n/catalog";
import type { ConsoleMessages } from "@/i18n/types";
import { localeFromFormData } from "@/lib/formLocale";
import { prisma } from "@/lib/prisma";
import { sendConsoleVerificationEmail } from "@/lib/consoleMail";
import { consolePublicOrigin } from "@/lib/consoleOrigin";
import { hashVerificationToken, newPlainVerificationToken } from "@/lib/consoleVerificationToken";

export type ConsoleRegisterState = { error?: string };

const CONSOLE_LEGAL_VERSION = "console-operator-1";
const VERIFY_TTL_MS = 48 * 60 * 60 * 1000;

function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

function validatePasswordKeys(pw: string): keyof ConsoleMessages["errors"] | null {
  if (pw.length < 12) return "registerPasswordShort";
  if (!/\p{L}/u.test(pw)) return "registerPasswordLetter";
  if (!/\p{N}/u.test(pw)) return "registerPasswordNumber";
  return null;
}

export async function consoleRegisterAction(
  _prev: ConsoleRegisterState | undefined,
  formData: FormData,
): Promise<ConsoleRegisterState> {
  const locale = localeFromFormData(formData);
  const t = getDictionary(locale);

  const secret = process.env["OPUS_CONSOLE_REGISTER_SECRET"]?.trim();
  const invite = String(formData.get("invite") ?? "").trim();
  if (!secret || invite !== secret) {
    return { error: t.errors.registerInviteInvalid };
  }

  const email = normalizeEmail(String(formData.get("email") ?? ""));
  const password = String(formData.get("password") ?? "");
  const password2 = String(formData.get("passwordConfirm") ?? "");
  const nameRaw = String(formData.get("name") ?? "").trim();
  const name = nameRaw.length > 0 ? nameRaw : null;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: t.errors.registerEmailInvalid };
  }
  if (password !== password2) {
    return { error: t.errors.registerPasswordMismatch };
  }
  const pwKey = validatePasswordKeys(password);
  if (pwKey) return { error: t.errors[pwKey] };

  if (formData.get("acceptTos") !== "on" || formData.get("acceptPrivacy") !== "on") {
    return { error: t.errors.registerConsentRequired };
  }
  if (formData.get("acceptOverseas") !== "on") {
    return { error: t.errors.registerOverseasRequired };
  }
  if (formData.get("acceptAge") !== "on") {
    return { error: t.errors.registerAgeRequired };
  }

  const marketing = formData.get("acceptMarketing") === "on";
  const now = new Date();

  const existing = await prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
    select: { id: true, passwordHash: true },
  });
  if (existing?.passwordHash) {
    return { error: t.errors.registerAlreadyRegistered };
  }
  if (existing && !existing.passwordHash) {
    return { error: t.errors.registerEmailUsedStorefront };
  }

  const passwordHash = await hash(password, 12);
  const plainToken = newPlainVerificationToken();
  const tokenHash = hashVerificationToken(plainToken);
  const expires = new Date(Date.now() + VERIFY_TTL_MS);

  let createdId: string;
  try {
    const created = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const user = await tx.user.create({
        data: {
          email,
          name,
          passwordHash,
          emailVerified: null,
          tosAcceptedAt: now,
          tosVersionAccepted: CONSOLE_LEGAL_VERSION,
          privacyAcceptedAt: now,
          privacyVersionAccepted: CONSOLE_LEGAL_VERSION,
          overseasTransferAcceptedAt: now,
          buyerAgeSelfAttestedAt: now,
          marketingOptInAt: marketing ? now : null,
        },
        select: { id: true },
      });
      await tx.verificationToken.deleteMany({ where: { identifier: email } });
      await tx.verificationToken.create({
        data: {
          identifier: email,
          token: tokenHash,
          expires,
        },
      });
      return user;
    });
    createdId = created.id;
  } catch (e: unknown) {
    const code = typeof e === "object" && e && "code" in e ? (e as { code?: string }).code : undefined;
    if (code === "P2002") {
      return { error: t.errors.registerDuplicateEmail };
    }
    throw e;
  }

  const verifyUrl = `${consolePublicOrigin()}/api/console/verify-email?token=${encodeURIComponent(plainToken)}`;

  try {
    await sendConsoleVerificationEmail(email, verifyUrl);
  } catch {
    await prisma.verificationToken.deleteMany({ where: { identifier: email } });
    await prisma.user.delete({ where: { id: createdId } }).catch(() => undefined);
    return { error: t.errors.registerMailFailed };
  }

  redirect(`/${locale}/login?registered=1`);
}
