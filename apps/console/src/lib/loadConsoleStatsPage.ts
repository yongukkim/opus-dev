import { redirect, notFound } from "next/navigation";
import { auth } from "@/auth";
import { getDictionary } from "@/i18n/catalog";
import { isSupportedLocale, type Locale } from "@/i18n/config";
import { devPreviewChromeUser, isConsoleDevPreview } from "@/lib/devPreview";

export async function loadConsoleStatsPage(params: Promise<{ locale: string }>) {
  const { locale: raw } = await params;
  if (!isSupportedLocale(raw)) notFound();
  const locale = raw as Locale;

  const preview = isConsoleDevPreview();
  const session = preview ? null : await auth();
  const t = getDictionary(locale);

  if (!preview && (!session?.user?.id || session.user.role !== "operator")) {
    redirect(`/${locale}/login`);
  }

  const chromeUser = preview ? devPreviewChromeUser() : session!.user;
  const actingUserId = preview ? null : session!.user.id;

  return { locale, preview, chromeUser, t, actingUserId };
}
