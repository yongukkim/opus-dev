"use client";

import { useActionState } from "react";
import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { ConsoleMessages } from "@/i18n/types";
import { consoleRegisterAction, type ConsoleRegisterState } from "./actions";

export function ConsoleRegisterForm({
  locale,
  invite,
  t,
}: {
  locale: Locale;
  invite: string;
  t: ConsoleMessages;
}) {
  const [state, formAction, pending] = useActionState<ConsoleRegisterState | undefined, FormData>(
    consoleRegisterAction,
    undefined,
  );

  return (
    <form action={formAction} className="mt-6 space-y-4">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="invite" value={invite} />
      {state?.error ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-900">{state.error}</p>
      ) : null}
      <div>
        <label htmlFor="reg-email" className="block text-xs font-medium text-gray-700">
          {t.register.email}
        </label>
        <input
          id="reg-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
        />
      </div>
      <div>
        <label htmlFor="reg-name" className="block text-xs font-medium text-gray-700">
          {t.register.nameOptional}
        </label>
        <input
          id="reg-name"
          name="name"
          type="text"
          autoComplete="name"
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
        />
      </div>
      <div>
        <label htmlFor="reg-password" className="block text-xs font-medium text-gray-700">
          {t.register.password}
        </label>
        <p className="text-xs text-gray-500">{t.register.passwordHint}</p>
        <input
          id="reg-password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={12}
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
        />
      </div>
      <div>
        <label htmlFor="reg-password2" className="block text-xs font-medium text-gray-700">
          {t.register.passwordConfirm}
        </label>
        <input
          id="reg-password2"
          name="passwordConfirm"
          type="password"
          autoComplete="new-password"
          required
          minLength={12}
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
        />
      </div>
      <div className="space-y-2 text-sm text-gray-700">
        <label className="flex gap-2">
          <input type="checkbox" name="acceptTos" value="on" required className="mt-1" />
          {t.register.acceptTos}
        </label>
        <label className="flex gap-2">
          <input type="checkbox" name="acceptPrivacy" value="on" required className="mt-1" />
          {t.register.acceptPrivacy}
        </label>
        <label className="flex gap-2">
          <input type="checkbox" name="acceptOverseas" value="on" required className="mt-1" />
          {t.register.acceptOverseas}
        </label>
        <label className="flex gap-2">
          <input type="checkbox" name="acceptAge" value="on" required className="mt-1" />
          {t.register.acceptAge}
        </label>
        <label className="flex gap-2">
          <input type="checkbox" name="acceptMarketing" value="on" className="mt-1" />
          {t.register.acceptMarketing}
        </label>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="inline-flex w-full items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-900 shadow-sm hover:bg-gray-50 disabled:opacity-60"
      >
        {pending ? t.register.submitting : t.register.submit}
      </button>
      <p className="text-center text-sm text-gray-600">
        {t.register.signInPrompt}{" "}
        <Link href={`/${locale}/login`} className="font-medium text-blue-600 underline hover:text-blue-800">
          {t.register.signInLink}
        </Link>
      </p>
    </form>
  );
}
