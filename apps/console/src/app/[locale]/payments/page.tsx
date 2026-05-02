import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { auth } from "@/auth";
import { getDictionary } from "@/i18n/catalog";
import { isSupportedLocale } from "@/i18n/config";
import { ConsoleChrome } from "@/components/ConsoleChrome";
import { devPreviewChromeUser, isConsoleDevPreview } from "@/lib/devPreview";

/**
 * ISO 27001 A.9.2.1 / A.18.1.4 (CLAUDE.md §4, §7)
 * KO: 결제·대사 UI는 준비 중이어도 운영자 전용 경로로 두고 공개 스토어와 분리한다.
 * JA: 決済・照合UIは準備中でも運用者専用パスに置き、公開ストアと分離する。
 * EN: Keep payment/reconciliation UI on operator-only routes, split from the public storefront, even when stubbed.
 */
export default async function PaymentsPlaceholderPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isSupportedLocale(raw)) notFound();
  const locale = raw;

  const preview = isConsoleDevPreview();
  const session = preview ? null : await auth();
  const t = getDictionary(locale);

  if (!preview && (!session?.user?.id || session.user.role !== "operator")) {
    redirect(`/${locale}/login`);
  }

  const chromeUser = preview ? devPreviewChromeUser() : session!.user;

  return (
    <ConsoleChrome user={chromeUser} previewMode={preview} locale={locale} labels={t.chrome}>
      <div className="border-b border-white/10 bg-[#141414] px-6 py-5">
        <h1 className="text-xl font-semibold tracking-tight text-[#F6F4F0]">{t.dashboard.cardPaymentsTitle}</h1>
        <p className="mt-1 max-w-2xl text-sm text-[#F6F4F0]/65">{t.dashboard.cardPaymentsBody}</p>
        <p className="mt-3 inline-flex rounded-full border border-[#DEB892]/35 bg-[#DEB892]/10 px-3 py-1 text-xs font-medium text-[#DEB892]">
          {t.dashboard.cardPaymentsBadge}
        </p>
        <div className="mt-6">
          <Link
            href={`/${locale}/home`}
            className="text-sm font-medium text-[#DEB892] underline decoration-[#DEB892]/50 underline-offset-4 hover:text-[#F6F4F0]"
          >
            ← {t.chrome.navHome}
          </Link>
        </div>
      </div>
    </ConsoleChrome>
  );
}
