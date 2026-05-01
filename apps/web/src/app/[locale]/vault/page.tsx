import { redirect } from "next/navigation";
import { normalizeLocale, withLocale } from "@/i18n/paths";

type Props = { params: Promise<{ locale: string }> };

/** Vault root redirects to Collection (overview page removed). */
export default async function VaultIndexRedirect({ params }: Props) {
  const { locale: raw } = await params;
  const locale = normalizeLocale(raw);
  redirect(withLocale(locale, "/vault/collection"));
}
