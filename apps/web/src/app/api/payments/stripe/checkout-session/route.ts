import { NextRequest, NextResponse } from "next/server";
import { readActorFromRequest } from "@/lib/authContext";
import { prisma } from "@/lib/prisma";
import type { Locale } from "@/i18n/config";
import { normalizeLocale } from "@/i18n/paths";
import { publicOriginFromRequest } from "@/lib/publicOrigin";
import { sanitizeReturnTo } from "@/lib/returnTo";
import { getStripeServer } from "@/lib/stripeServer";

export const runtime = "nodejs";

type Body = {
  orderId?: string;
  locale?: string;
  cancelPath?: string;
  /** Internal path only; sanitized to prevent open redirects. */
  returnTo?: string;
  /** Presentation label for success page; length-capped, no control chars. */
  artwork?: string;
};

/**
 * ISO 27001 A.9.2.1 (§4), A.10.1.1 (§3), A.13.1.3 (§6), A.18.1.4 (§7)
 * KO: 구매자 본인의 미결제 STRIPE 주문만 Checkout으로 넘기며, JPY 단건·금액 위변조를 막고, 성공/취소 URL은 returnTo·표시용 artwork를 검증한 뒤 동일 출처로 제한합니다.
 * JA: 未払いのSTRIPE注文を購入者本人のみCheckoutへ送り、JPY一括・改ざん防止、成功/キャンセルURLはreturnTo・表示用artworkを検証し同一オリジンに限定します。
 * EN: Only the buyer’s pending STRIPE order may open Checkout; JPY one-shot prevents tampering; success/cancel URLs validate returnTo/display artwork and stay same-origin.
 */
export async function POST(request: NextRequest): Promise<Response> {
  const stripe = getStripeServer();
  if (!stripe) {
    return NextResponse.json({ ok: false, error: "stripe_not_configured" }, { status: 503 });
  }

  const actor = await readActorFromRequest(request);
  if (!actor || actor.role !== "collector") {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_request" }, { status: 400 });
  }

  const orderId = body.orderId?.trim() ?? "";
  const localeRaw = body.locale?.trim() ?? "en";
  const locale = normalizeLocale(localeRaw) as Locale;
  if (!orderId) {
    return NextResponse.json({ ok: false, error: "invalid_request" }, { status: 400 });
  }

  const cancelPath = body.cancelPath?.trim() ?? "";
  const expectedCheckoutPrefix = `/${locale}/checkout`;
  if (!cancelPath.startsWith(expectedCheckoutPrefix)) {
    return NextResponse.json({ ok: false, error: "invalid_cancel_path" }, { status: 400 });
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      buyerUserId: true,
      status: true,
      provider: true,
      amountJpy: true,
      title: true,
      currency: true,
    },
  });
  if (!order || order.buyerUserId !== actor.userId) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }
  if (order.provider !== "STRIPE" || order.status !== "PENDING") {
    return NextResponse.json({ ok: false, error: "invalid_order_state" }, { status: 409 });
  }

  const origin = publicOriginFromRequest(request);
  const returnToSafe = sanitizeReturnTo(body.returnTo, `/${locale}/vault/collection`);
  const artworkRaw = (body.artwork ?? "").trim().slice(0, 256);
  const artworkSafe =
    artworkRaw && !/[\n\r\0]/.test(artworkRaw) ? artworkRaw : "";
  const successQs = new URLSearchParams({ orderId: order.id, returnTo: returnToSafe });
  if (artworkSafe) successQs.set("artwork", artworkSafe);
  const successUrl = `${origin}/${locale}/purchase/success?${successQs.toString()}`;
  const cancelUrl = `${origin}${cancelPath.startsWith("/") ? cancelPath : `/${cancelPath}`}`;

  const stripeLocale = locale === "ja" ? "ja" : "en";

  try {
    const session = await stripe.checkout.sessions.create(
      {
        mode: "payment",
        client_reference_id: order.id,
        locale: stripeLocale,
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: "jpy",
              unit_amount: order.amountJpy,
              product_data: {
                name: order.title.slice(0, 250),
                metadata: { opus_order_id: order.id },
              },
            },
          },
        ],
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          opus_order_id: order.id,
          opus_locale: locale,
        },
        payment_intent_data: {
          metadata: { opus_order_id: order.id },
        },
        custom_text: {
          submit: {
            message:
              locale === "ja"
                ? "お支払いは Stripe を通じて処理されます。特定商取引法に基づく表示はサイトの表示ページをご確認ください。"
                : locale === "ko"
                  ? "결제는 Stripe를 통해 처리됩니다. 전자상거래 등에서의 표시·고지는 사이트의 표시 페이지를 확인해 주세요."
                  : "Payment is processed by Stripe. For legally required commercial disclosures (Japan), see the site’s disclosure pages.",
          },
        },
      },
      { idempotencyKey: `checkout_${order.id}` },
    );

    if (!session.url) {
      return NextResponse.json({ ok: false, error: "session_missing_url" }, { status: 500 });
    }

    await prisma.order.update({
      where: { id: order.id },
      data: { providerReference: session.id },
    });

    return NextResponse.json({ ok: true, url: session.url, sessionId: session.id }, { status: 200 });
  } catch (e) {
    console.error("[stripe checkout-session]", e);
    return NextResponse.json({ ok: false, error: "stripe_error" }, { status: 502 });
  }
}
