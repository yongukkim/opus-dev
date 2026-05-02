import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getDictionary } from "@/i18n/catalog";
import { isSupportedLocale } from "@/i18n/config";
import { ConsoleLanguageSwitcher } from "@/components/ConsoleLanguageSwitcher";
import { ConsoleRegisterForm } from "./ConsoleRegisterForm";

export default async function RegisterPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ invite?: string }>;
}) {
  const { locale: raw } = await params;
  if (!isSupportedLocale(raw)) notFound();
  const locale = raw;

  const sp = await searchParams;
  const invite = typeof sp.invite === "string" ? sp.invite : "";
  const secret = process.env["OPUS_CONSOLE_REGISTER_SECRET"]?.trim();
  if (!secret || invite !== secret) {
    notFound();
  }

  const t = getDictionary(locale);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0E0E0E] px-4">
      <div className="w-full max-w-md rounded-lg border border-white/10 bg-[#141414] p-8 shadow-xl shadow-black/40">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-xl font-semibold tracking-tight text-[#F6F4F0]">{t.register.title}</h1>
          <Suspense fallback={<div className="h-5 w-32 shrink-0" aria-hidden />}>
            <ConsoleLanguageSwitcher locale={locale} labels={t.lang} />
          </Suspense>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-[#F6F4F0]/70">{t.register.lead}</p>
        <ConsoleRegisterForm locale={locale} invite={invite} t={t} />
        <p className="mt-6 text-center text-xs text-[#F6F4F0]/40">
          <Link href={`/${locale}/login`} className="text-[#DEB892] underline decoration-[#DEB892]/40 hover:text-[#F6F4F0]">
            {t.register.back}
          </Link>
        </p>
      </div>
    </div>
  );
}
