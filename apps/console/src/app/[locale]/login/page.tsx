import Link from "next/link";
import { Suspense } from "react";
import { redirect, notFound } from "next/navigation";
import { auth } from "@/auth";
import { getDictionary } from "@/i18n/catalog";
import { isSupportedLocale } from "@/i18n/config";
import { isConsoleDevPreview } from "@/lib/devPreview";
import { ConsoleLanguageSwitcher } from "@/components/ConsoleLanguageSwitcher";
import { consoleSignOutAction } from "./actions";
import { ConsoleLoginForm } from "./ConsoleLoginForm";

type LoginSearch = {
  registered?: string;
  verify?: string;
  register?: string;
};

function loginBannerFromSearch(
  sp: LoginSearch,
  t: ReturnType<typeof getDictionary>,
): { message: string; variant: "info" | "success" | "error" } | undefined {
  if (sp.register === "closed") {
    return { message: t.login.banners.registerClosed, variant: "error" };
  }
  if (sp.registered === "1") {
    return { message: t.login.banners.checkEmail, variant: "info" };
  }
  if (sp.verify === "ok") {
    return { message: t.login.banners.verified, variant: "success" };
  }
  if (sp.verify === "expired") {
    return { message: t.login.banners.linkExpired, variant: "error" };
  }
  if (sp.verify === "invalid") {
    return { message: t.login.banners.linkInvalid, variant: "error" };
  }
  return undefined;
}

export default async function LoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<LoginSearch>;
}) {
  const { locale: raw } = await params;
  if (!isSupportedLocale(raw)) notFound();
  const locale = raw;

  const session = await auth();
  const preview = isConsoleDevPreview();
  const sp = await searchParams;
  const t = getDictionary(locale);
  const queryBanner = loginBannerFromSearch(sp, t);

  if (session?.user?.role === "operator") {
    redirect(`/${locale}/review`);
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-xl font-semibold text-gray-900">{t.login.title}</h1>
          <Suspense fallback={<div className="h-5 w-32 shrink-0" aria-hidden />}>
            <ConsoleLanguageSwitcher locale={locale} labels={t.lang} />
          </Suspense>
        </div>
        <p className="mt-2 text-sm text-gray-600">{t.login.lead}</p>
        {session?.user ? (
          <div className="mt-4 space-y-3">
            <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900">{t.login.notOperator}</p>
            <form action={consoleSignOutAction}>
              <input type="hidden" name="locale" value={locale} />
              <button
                type="submit"
                className="text-sm font-medium text-gray-700 underline decoration-gray-400 underline-offset-2 hover:text-gray-900"
              >
                {t.login.signOut}
              </button>
            </form>
          </div>
        ) : null}
        {preview ? (
          <div className="mt-6 space-y-3">
            <Link
              href={`/${locale}/review`}
              className="inline-flex w-full items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-900 shadow-sm hover:bg-gray-50"
            >
              {t.login.previewOpen}
            </Link>
            <p className="text-center text-xs text-gray-500">{t.login.previewEnvHint}</p>
          </div>
        ) : null}
        {!session?.user ? <ConsoleLoginForm locale={locale} t={t} queryBanner={queryBanner} /> : null}
        <p className="mt-6 text-center text-xs text-gray-400">
          <a className="text-blue-600 underline hover:text-blue-800" href={process.env["OPUS_STORE_PUBLIC_ORIGIN"] ?? "#"}>
            {t.login.publicSite}
          </a>
        </p>
      </div>
    </div>
  );
}
