"use client";

import { useActionState } from "react";
import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { ConsoleMessages } from "@/i18n/types";
import { consoleRegisterAction, type ConsoleRegisterState } from "./actions";

const field =
  "mt-1 w-full rounded-md border border-white/15 bg-[#0E0E0E] px-3 py-2 text-sm text-[#F6F4F0] shadow-inner focus:border-[#DEB892]/50 focus:outline-none focus:ring-1 focus:ring-[#DEB892]/35";

export function ConsoleRegisterForm({
  locale,
  t,
}: {
  locale: Locale;
  t: ConsoleMessages;
}) {
  const [state, formAction, pending] = useActionState<ConsoleRegisterState | undefined, FormData>(
    consoleRegisterAction,
    undefined,
  );

  return (
    <form action={formAction} className="mt-6 space-y-4">
      <input type="hidden" name="locale" value={locale} />
      {state?.error ? (
        <p className="rounded-md border border-red-500/25 bg-red-950/40 px-3 py-2 text-sm text-red-100">{state.error}</p>
      ) : null}
      <div>
        <label htmlFor="reg-email" className="block text-xs font-medium text-[#F6F4F0]/75">
          {t.register.email}
        </label>
        <input id="reg-email" name="email" type="email" autoComplete="email" required className={field} />
      </div>
      <div>
        <label htmlFor="reg-name" className="block text-xs font-medium text-[#F6F4F0]/75">
          {t.register.nameOptional}
        </label>
        <input id="reg-name" name="name" type="text" autoComplete="name" className={field} />
      </div>
      <div>
        <label htmlFor="reg-password" className="block text-xs font-medium text-[#F6F4F0]/75">
          {t.register.password}
        </label>
        <p className="text-xs text-[#F6F4F0]/45">{t.register.passwordHint}</p>
        <input
          id="reg-password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={12}
          className={field}
        />
      </div>
      <div>
        <label htmlFor="reg-password2" className="block text-xs font-medium text-[#F6F4F0]/75">
          {t.register.passwordConfirm}
        </label>
        <input
          id="reg-password2"
          name="passwordConfirm"
          type="password"
          autoComplete="new-password"
          required
          minLength={12}
          className={field}
        />
      </div>
      <div className="space-y-2 text-sm text-[#F6F4F0]/80">
        <label className="flex gap-2">
          <input type="checkbox" name="acceptTos" value="on" required className="mt-1 accent-[#DEB892]" />
          {t.register.acceptTos}
        </label>
        <label className="flex gap-2">
          <input type="checkbox" name="acceptPrivacy" value="on" required className="mt-1 accent-[#DEB892]" />
          {t.register.acceptPrivacy}
        </label>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="inline-flex w-full items-center justify-center rounded-md border border-[#DEB892]/40 bg-gradient-to-b from-[#e4c9a8] to-[#c9a574] px-4 py-2.5 text-sm font-semibold text-[#1a1510] shadow-md shadow-black/30 hover:from-[#edd4b8] hover:to-[#d1ae84] disabled:opacity-60"
      >
        {pending ? t.register.submitting : t.register.submit}
      </button>
      <p className="text-center text-sm text-[#F6F4F0]/65">
        {t.register.signInPrompt}{" "}
        <Link href={`/${locale}/login`} className="font-medium text-[#DEB892] underline decoration-[#DEB892]/40 hover:text-[#F6F4F0]">
          {t.register.signInLink}
        </Link>
      </p>
    </form>
  );
}
