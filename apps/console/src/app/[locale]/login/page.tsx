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
    redirect(`/${locale}/home`);
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0E0E0E] px-4">
      <div className="w-full max-w-md rounded-lg border border-white/10 bg-[#141414] p-8 shadow-xl shadow-black/40">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-xl font-semibold tracking-tight text-[#F6F4F0]">{t.login.title}</h1>
          <Suspense fallback={<div className="h-5 w-32 shrink-0" aria-hidden />}>
            <ConsoleLanguageSwitcher locale={locale} labels={t.lang} />
          </Suspense>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-[#F6F4F0]/70">{t.login.lead}</p>
        {session?.user ? (
          <div className="mt-4 space-y-3">
            <p className="rounded-md border border-amber-500/25 bg-amber-950/35 px-3 py-2 text-sm text-amber-100">{t.login.notOperator}</p>
            <form action={consoleSignOutAction}>
              <input type="hidden" name="locale" value={locale} />
              <button
                type="submit"
                className="text-sm font-medium text-[#DEB892] underline decoration-[#DEB892]/40 underline-offset-2 hover:text-[#F6F4F0]"
              >
                {t.login.signOut}
              </button>
            </form>
          </div>
        ) : null}
        {preview ? (
          <div className="mt-6 space-y-3">
            <Link
              href={`/${locale}/home`}
              className="inline-flex w-full items-center justify-center rounded-md border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-medium text-[#F6F4F0] shadow-sm hover:bg-white/10"
            >
              {t.login.previewOpen}
            </Link>
            <p className="text-center text-xs text-[#F6F4F0]/45">{t.login.previewEnvHint}</p>
          </div>
        ) : null}
        {!session?.user ? (
          <ConsoleLoginForm
            locale={locale}
            t={t}
            queryBanner={queryBanner}
            googleConfigured={Boolean(process.env["AUTH_GOOGLE_ID"]?.trim() && process.env["AUTH_GOOGLE_SECRET"]?.trim())}
          />
        ) : null}
        <p className="mt-4 text-center text-sm text-[#F6F4F0]/50">
          {t.login.registerPrompt}{" "}
          <Link href={`/${locale}/register`} className="text-[#DEB892] underline decoration-[#DEB892]/40 hover:text-[#F6F4F0]">
            {t.login.registerLink}
          </Link>
        </p>
        <p className="mt-4 text-center text-xs text-[#F6F4F0]/40">
          <a className="text-[#DEB892] underline decoration-[#DEB892]/40 hover:text-[#F6F4F0]" href={process.env["OPUS_STORE_PUBLIC_ORIGIN"] ?? "#"}>
            {t.login.publicSite}
          </a>
        </p>
      </div>
    </div>
  );
}
