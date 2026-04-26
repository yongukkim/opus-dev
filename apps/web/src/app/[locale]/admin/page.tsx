import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getDictionary } from "@/i18n/catalog";
import { normalizeLocale, withLocale } from "@/i18n/paths";
import { OperatorAccountAdminTable } from "@/components/operator/OperatorAccountAdminTable";

type Props = { params: Promise<{ locale: string }> };

export default async function OperatorAdminPage({ params }: Props) {
  const { locale: raw } = await params;
  const locale = normalizeLocale(raw);
  const m = getDictionary(locale);

  const session = await auth();
  const isOperator = session?.user?.role === "operator";

  const users = isOperator
    ? await prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        take: 100,
        select: { id: true, name: true, email: true, role: true, createdAt: true },
      })
    : [];

  const rows = users.map((u) => ({
    id: u.id,
    name: u.name ?? "",
    email: u.email ?? "",
    role: (u.role === "ARTIST" ? "artist" : u.role === "OPERATOR" ? "operator" : "collector") as
      | "collector"
      | "artist"
      | "operator",
    createdAt: u.createdAt.toISOString(),
  }));

  return (
    <main className="min-h-screen bg-opus-charcoal px-6 pb-24 pt-[calc(var(--opus-header-plus-trust)+4rem)] text-opus-warm/80">
      <div className="mx-auto max-w-6xl">
        <p className="opus-text-metallic-soft text-center text-xs uppercase tracking-[0.4em]">OPUS</p>
        <h1 className="mt-4 text-center font-display text-3xl tracking-[0.12em] text-opus-warm">
          {m.operatorAdmin.title}
        </h1>
        <p className="mt-3 text-center text-sm text-opus-warm/55">{m.operatorAdmin.subtitle}</p>

        {!isOperator ? (
          <div className="mx-auto mt-10 max-w-xl rounded-xl border border-white/[0.08] bg-opus-slate/30 p-6 text-center shadow-opus-card">
            <p className="font-display text-xl text-opus-warm">{m.operatorAdmin.unauthorizedTitle}</p>
            <p className="mt-3 text-sm text-opus-warm/60">{m.operatorAdmin.unauthorizedBody}</p>
          </div>
        ) : (
          <OperatorAccountAdminTable rows={rows} sessionUserId={session.user.id} m={m} />
        )}

        <div className="mt-14 text-center">
          <Link
            href={withLocale(locale, "/")}
            className="inline-block text-sm text-opus-gold underline-offset-4 hover:text-opus-gold-light hover:underline"
          >
            ← Home
          </Link>
        </div>
      </div>
    </main>
  );
}
