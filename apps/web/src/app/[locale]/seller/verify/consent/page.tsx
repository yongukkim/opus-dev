import type { Metadata } from "next";
import { SellerVerifyConsentForm } from "@/components/seller/SellerVerifyConsentForm";
import { getDictionary } from "@/i18n/catalog";
import { normalizeLocale } from "@/i18n/paths";

export const metadata: Metadata = {
  title: "판매자 본인 확인 동의",
  description:
    "OPUS 판매자 eKYC — 개인정보·고유식별정보·제3자 제공 동의. 범죄수익이전방지법 및 운영 정책에 따른 정산용 본인 확인.",
  robots: { index: false, follow: false },
};

type Props = { params: Promise<{ locale: string }> };

/**
 * Seller KYC entry — consent for personal data before eKYC handoff.
 * ISO 27001 A.18.1.4 (§7) · CLAUDE.md §7
 * KO: 동의 화면을 별도 경로로 분리해 목적·위탁을 명시하고 감사 추적 가능한 흐름으로 둔다.
 * JA: 同意画面を分離し、目的・委託を明示して監査可能なフローとする。
 * EN: Standalone consent route documents purpose and subprocessors for auditability.
 */
export default async function SellerVerifyConsentPage({ params }: Props) {
  const { locale: raw } = await params;
  const locale = normalizeLocale(raw);
  const m = getDictionary(locale);
  return <SellerVerifyConsentForm locale={locale} strings={m.sellerVerifyConsent} />;
}
