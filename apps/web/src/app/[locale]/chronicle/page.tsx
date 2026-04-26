import type { Metadata } from "next";
import Link from "next/link";
import { ChroniclePublicList } from "@/components/home/ChroniclePublicList";
import { getDictionary } from "@/i18n/catalog";
import { listPublicChroniclePreviewRows } from "@/lib/chronicleLedger";
import { normalizeLocale, withLocale } from "@/i18n/paths";

type Props = { params: Promise<{ locale: string }> };

export const dynamic = "force-dynamic";

/**
 * ISO 27001 A.13.1.3 (§6), A.18.1.4 (§7)
 * KO: 공개 Chronicle 색인은 마스킹된 발행 메타만 노출하며 PII·원본 저장 경로를 응답에 포함하지 않습니다.
 * JA: 公開Chronicle索引はマスク済み発行メタのみを返し、PIIや原本保存パスを応答に含めません。
 * EN: Public Chronicle index exposes only masked issuance metadata — no PII or raw storage paths in responses.
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale = normalizeLocale(raw);
  const d = getDictionary(locale);
  return {
    title: d.meta.chronicleIndexTitle,
    description: d.meta.chronicleIndexDescription,
  };
}

export default async function ChronicleIndexPage({ params }: Props) {
  const { locale: raw } = await params;
  const locale = normalizeLocale(raw);
  const m = getDictionary(locale);
  const cp = m.home.chroniclePreview;
  const page = m.home.chroniclePage;
  const rows = await listPublicChroniclePreviewRows(80);

  return (
    <main className="min-h-screen border-t border-white/[0.05] bg-gradient-to-b from-opus-charcoal via-[#141414] to-opus-charcoal px-6 pb-24 pt-[calc(var(--opus-header-plus-trust)+3rem)] text-opus-warm/80 md:px-10">
      <div className="mx-auto max-w-3xl text-center">
        <p className="opus-text-metallic-soft font-mono text-[0.65rem] uppercase tracking-[0.32em]">{cp.kicker}</p>
        <h1 className="opus-text-metallic mt-3 font-display text-2xl tracking-wide text-opus-warm md:text-3xl">
          {page.title}
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm text-opus-warm/55">{page.subtitle}</p>

        {rows.length > 0 ? (
          <ChroniclePublicList
            locale={locale}
            m={m}
            rows={rows}
            ulClassName="mx-auto mt-10 w-full max-w-2xl space-y-4 text-left"
          />
        ) : (
          <p className="mx-auto mt-12 max-w-md text-sm text-opus-warm/50">{page.emptyLead}</p>
        )}

        <p className="mx-auto mt-8 max-w-md font-mono text-[0.62rem] uppercase tracking-[0.18em] text-opus-warm/45">
          {cp.maskLegend}
        </p>

        <p className="mt-10">
          <Link
            href={withLocale(locale, "/")}
            className="text-sm text-opus-gold underline-offset-4 hover:text-opus-gold-light hover:underline"
          >
            {page.backHome}
          </Link>
        </p>
      </div>
    </main>
  );
}
