import Link from "next/link";
import QRCode from "qrcode";
import { getDictionary } from "@/i18n/catalog";
import { normalizeLocale, withLocale } from "@/i18n/paths";
import { resolveSiteBaseUrl } from "@/lib/siteBaseUrl";
import { sanitizeReturnTo } from "@/lib/returnTo";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ returnTo?: string }>;
};

export const dynamic = "force-dynamic";

export default async function MobileBridgePage({ params, searchParams }: Props) {
  const { locale: raw } = await params;
  const { returnTo: returnToParam } = await searchParams;
  const locale = normalizeLocale(raw);
  const m = getDictionary(locale);
  const mv = m.mobileViewer;

  const fallback = withLocale(locale, "/");
  const returnPath = sanitizeReturnTo(returnToParam, fallback);
  const base = await resolveSiteBaseUrl();
  const targetUrl = `${base}${returnPath.startsWith("/") ? returnPath : `/${locale}/`}`;

  let qrSrc: string | null = null;
  try {
    qrSrc = await QRCode.toDataURL(targetUrl, {
      errorCorrectionLevel: "M",
      width: 240,
      margin: 2,
      color: { dark: "#0E0E0E", light: "#F6F4F0" },
    });
  } catch {
    qrSrc = null;
  }

  return (
    <main className="mx-auto max-w-lg px-6 py-16 md:py-24">
      <p className="font-mono text-[0.65rem] uppercase tracking-[0.22em] text-opus-warm/45">OPUS</p>
      <h1 className="mt-3 font-display text-2xl tracking-wide text-opus-warm md:text-3xl">{mv.bridgeTitle}</h1>
      <p className="mt-4 text-sm leading-relaxed text-opus-warm/60">{mv.bridgeLead}</p>

      <p className="mt-8 font-mono text-[0.6rem] uppercase tracking-[0.2em] text-opus-warm/40">{mv.bridgeScanLabel}</p>
      <div className="mt-3 flex justify-center rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6">
        {qrSrc ? (
          // eslint-disable-next-line @next/next/no-img-element -- data URL from server-generated QR
          <img src={qrSrc} width={240} height={240} className="h-60 w-60" alt="" />
        ) : (
          <p className="text-sm text-opus-warm/50">QR</p>
        )}
      </div>

      <p className="mt-6 break-all font-mono text-[0.7rem] leading-relaxed text-opus-warm/50">{targetUrl}</p>

      <div className="mt-8">
        <a
          href={targetUrl}
          className="opus-surface-metallic inline-flex w-full items-center justify-center rounded-lg px-5 py-3 text-center text-sm font-semibold text-black transition hover:opacity-95"
        >
          {mv.bridgeOpenCta}
        </a>
      </div>

      <p className="mt-6 text-xs leading-relaxed text-opus-warm/45">{mv.bridgeLoginHint}</p>

      <p className="mt-10 text-center">
        <Link href={withLocale(locale, "/")} className="text-sm text-opus-gold/70 underline-offset-4 hover:text-opus-gold-light hover:underline">
          {m.footer.linkHome}
        </Link>
      </p>
    </main>
  );
}
