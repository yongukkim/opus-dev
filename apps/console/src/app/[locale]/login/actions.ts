"use server";

import { signIn, signOut } from "@/auth";
import { getDictionary } from "@/i18n/catalog";
import { localeFromFormData } from "@/lib/formLocale";
import { redirect } from "next/navigation";

export type ConsoleLoginState = { error?: string };

export async function consoleLoginAction(
  _prev: ConsoleLoginState | undefined,
  formData: FormData,
): Promise<ConsoleLoginState> {
  const locale = localeFromFormData(formData);
  const t = getDictionary(locale);

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) {
    return { error: t.errors.loginEmailPasswordRequired };
  }

  const result = await signIn("credentials", {
    email,
    password,
    redirect: false,
  });

  if (result?.error) {
    return { error: t.errors.loginInvalid };
  }

  redirect(`/${locale}/`);
}

export async function consoleSignOutAction(formData: FormData) {
  const locale = localeFromFormData(formData);
  await signOut({ redirectTo: `/${locale}/login` });
}
