import type { Metadata } from "next";
import Link from "next/link";
import { getDictionary } from "@/i18n/catalog";
import { normalizeLocale, withLocale } from "@/i18n/paths";

export const metadata: Metadata = {
  title: "본인 확인 진행",
  description: "OPUS 판매자 eKYC 다음 단계 (연동 예정).",
  robots: { index: false, follow: false },
};

type Props = { params: Promise<{ locale: string }> };

/**
 * Placeholder after consent + Vault connecting overlay.
 * ISO 27001 A.18.1.4 (§7)
 * KO: 실제 eKYC 위젯·토큰 교환은 벤더 연동 후 이 경로에서 이어집니다.
 */
export default async function SellerVerifyStartPage({ params }: Props) {
  const { locale: raw } = await params;
  const locale = normalizeLocale(raw);
  const m = getDictionary(locale);
  const s = m.sellerVerifyStart;
  const consentHref = withLocale(locale, "/seller/verify/consent");
  const vaultHref = withLocale(locale, "/vault");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#060606] px-6 text-center text-[#d4cbc0]/85">
      <p className="font-mono text-[0.65rem] uppercase tracking-[0.35em] text-[#a8987c]/70">OPUS · Seller</p>
      <h1 className="mt-4 max-w-md font-display text-xl font-light text-[#f2ebe3]">{s.title}</h1>
      <p className="mt-4 max-w-sm text-sm font-light leading-relaxed text-[#9a8f7e]/88">{s.body}</p>
      <Link
        href={consentHref}
        className="mt-10 text-sm font-light text-[#c9a97e] underline-offset-4 hover:text-[#deb892] hover:underline"
      >
        {s.backToConsent}
      </Link>
      <Link
        href={vaultHref}
        className="mt-4 text-sm font-light text-[#6d655a] hover:text-[#9a8f7e]"
      >
        {s.vaultLink}
      </Link>
    </main>
  );
}
