import type { Metadata } from "next";
import { TokushohoContent } from "./tokushoho";
import { getDictionary } from "@/i18n/catalog";
import { normalizeLocale, withLocale } from "@/i18n/paths";
import Link from "next/link";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale = normalizeLocale(raw);
  const d = getDictionary(locale);
  return {
    title: d.meta.tokushohoTitle,
    description: d.meta.tokushohoDescription,
  };
}

export default async function TokushohoPage({ params }: Props) {
  const { locale: raw } = await params;
  const locale = normalizeLocale(raw);
  const m = getDictionary(locale);

  return (
    <main className="mx-auto max-w-3xl px-6 pb-16 pt-[calc(6.5rem+2.5rem)]">
      <Link
        href={withLocale(locale, "/")}
        className="text-sm text-opus-warm/70 underline-offset-4 hover:text-opus-gold hover:underline"
      >
        {m.tokushoho.back}
      </Link>
      <div className="mt-8">
        <TokushohoContent legal={m.tokushoho} />
      </div>
    </main>
  );
}
