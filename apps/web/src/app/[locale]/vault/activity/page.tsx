import { getDictionary } from "@/i18n/catalog";
import { normalizeLocale } from "@/i18n/paths";

type Props = { params: Promise<{ locale: string }> };

export default async function VaultActivityPage({ params }: Props) {
  const { locale: raw } = await params;
  const m = getDictionary(normalizeLocale(raw));
  const v = m.vault;

  return (
    <main className="p-6 md:p-10">
      <h1 className="font-display text-2xl text-opus-warm">{v.activityTitle}</h1>
      <p className="mt-3 font-sans text-sm text-opus-warm/55">{v.activityBody}</p>
    </main>
  );
}
