import { redirect } from "next/navigation";
import { normalizeLocale } from "@/i18n/paths";
import { getOpusConsoleReviewUrl } from "@/lib/opusConsoleUrl";

type Props = { params: Promise<{ locale: string }> };

/**
 * Artwork registration review moved to the dedicated OPUS Console (shared DB, separate host).
 * KO: 작품 검수 UI는 스토어가 아니라 콘솔 앱에서만 제공한다.
 * JA: 作品審査UIはストアではなく専用コンソールで提供する。
 * EN: Operator review runs on the dedicated console app, not the public storefront.
 */
export default async function OperatorReviewPage({ params }: Props) {
  const { locale: raw } = await params;
  const locale = normalizeLocale(raw);
  redirect(getOpusConsoleReviewUrl(locale));
}
