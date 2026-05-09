import { auth } from "@/auth";
import { OperatorStaffRolePanel } from "@/components/operator/OperatorStaffRolePanel";
import { getDictionary } from "@/i18n/catalog";
import { normalizeLocale, withLocale } from "@/i18n/paths";
import { prisma } from "@/lib/prisma";
import { getOpusConsoleReviewUrl } from "@/lib/opusConsoleUrl";
import Link from "next/link";

type Props = { params: Promise<{ locale: string }> };

export default async function VaultAuthoritySettingsPage({ params }: Props) {
  const { locale: raw } = await params;
  const locale = normalizeLocale(raw);
  const m = getDictionary(locale);
  const a = m.vaultAuthority;

  const session = await auth();
  const isOperator = session?.user?.role === "operator";

  if (!isOperator || !session.user?.id) {
    return (
      <main className="flex-1 p-6 pb-24 text-opus-warm/80 md:p-10">
        <div className="mx-auto max-w-3xl rounded-xl border border-white/[0.08] bg-opus-slate/30 p-6 text-center shadow-opus-card">
          <p className="font-display text-xl text-opus-warm">{m.operatorAdmin.unauthorizedTitle}</p>
          <p className="mt-3 text-sm text-opus-warm/60">{m.operatorAdmin.unauthorizedBody}</p>
          <div className="mt-6">
            <Link
              href={withLocale(locale, "/vault/collection")}
              className="text-sm text-opus-gold underline-offset-4 hover:text-opus-gold-light hover:underline"
            >
              {m.vault.artistGateBackVault}
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    where: { role: "OPERATOR" },
    take: 50,
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });
  const accountRows = users.map((u) => ({
    id: u.id,
    name: u.name ?? "",
    email: u.email ?? "",
    role: (u.role === "ARTIST" ? "artist" : u.role === "OPERATOR" ? "operator" : "collector") as
      | "collector"
      | "artist"
      | "operator",
    createdAt: u.createdAt.toISOString(),
  }));

  const consoleReviewUrl = getOpusConsoleReviewUrl(locale);

  return (
    <main className="flex-1 p-6 pb-24 text-opus-warm/80 md:p-10">
      <h1 className="font-display text-2xl text-opus-warm">{a.title}</h1>
      <p className="mt-3 max-w-3xl text-sm text-opus-warm/55">{a.subtitle}</p>

      <section className="mt-10">
        <p className="font-mono text-[0.65rem] uppercase tracking-[0.28em] text-opus-warm/45">{a.reviewSection}</p>
        <div className="mt-4 max-w-3xl rounded-xl border border-white/[0.08] bg-opus-slate/30 p-6 shadow-opus-card">
          <p className="text-sm text-opus-warm/75">{a.reviewConsoleBody}</p>
          <div className="mt-5">
            <Link
              href={consoleReviewUrl}
              className="inline-block rounded-lg border border-opus-gold/35 bg-opus-gold/10 px-4 py-2.5 text-sm font-medium text-opus-gold-light hover:bg-opus-gold/15"
            >
              {a.reviewConsoleCta}
            </Link>
          </div>
        </div>
      </section>

      <section className="mt-12">
        <p className="font-mono text-[0.65rem] uppercase tracking-[0.28em] text-opus-warm/45">{a.accountSection}</p>
        <OperatorStaffRolePanel rows={accountRows} m={m} />
      </section>
    </main>
  );
}
