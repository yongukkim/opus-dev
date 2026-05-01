import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStripeServer, getStripeWebhookSecret } from "@/lib/stripeServer";

export const runtime = "nodejs";

/**
 * ISO 27001 A.13.1.3 (§6), A.12.4.1 (§5), A.18.1.4 (§7)
 * KO: Stripe 서명으로만 웹훅을 처리하고, event id로 멱등 저장하며, 카드·원시 PII는 저장하지 않습니다.
 * JA: Stripe署名でのみWebhookを処理し、event idで冪等保存し、カード・生PIIは保存しません。
 * EN: Process webhooks only after Stripe signature verification; idempotent by event id; never store card data or raw PII.
 */
export async function POST(request: NextRequest): Promise<Response> {
  const stripe = getStripeServer();
  const whSecret = getStripeWebhookSecret();
  if (!stripe || !whSecret) {
    return NextResponse.json({ ok: false, error: "not_configured" }, { status: 503 });
  }

  const raw = await request.text();
  const sig = request.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ ok: false, error: "missing_signature" }, { status: 400 });
  }

  let event: import("stripe").Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, whSecret);
  } catch {
    return NextResponse.json({ ok: false, error: "bad_signature" }, { status: 400 });
  }

  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ ok: true, ignored: event.type }, { status: 200 });
  }

  const session = event.data.object as import("stripe").Stripe.Checkout.Session;
  const orderId =
    (session.metadata?.["opus_order_id"] ?? session.client_reference_id)?.trim() ?? "";
  if (!orderId) {
    return NextResponse.json({ ok: false, error: "missing_order" }, { status: 400 });
  }

  if (session.payment_status !== "paid") {
    return NextResponse.json({ ok: true, ignored: "not_paid" }, { status: 200 });
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, status: true, provider: true },
  });
  if (!order || order.provider !== "STRIPE") {
    return NextResponse.json({ ok: true, noop: true }, { status: 200 });
  }
  if (order.status === "PAID") {
    return NextResponse.json({ ok: true, duplicated: true }, { status: 200 });
  }

  const payment = await prisma.payment.findFirst({
    where: { orderId, provider: "STRIPE" },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });
  if (!payment) {
    return NextResponse.json({ ok: false, error: "payment_missing" }, { status: 404 });
  }

  const pi = session.payment_intent;
  const paymentIntentId = typeof pi === "string" ? pi : pi?.id ?? null;

  try {
    await prisma.$transaction(async (tx) => {
      const dup = await tx.paymentEvent.findUnique({
        where: { provider_providerEventId: { provider: "STRIPE", providerEventId: event.id } },
        select: { id: true },
      });
      if (dup) return;

      await tx.paymentEvent.create({
        data: {
          paymentId: payment.id,
          provider: "STRIPE",
          providerEventId: event.id,
          eventType: "PAYMENT_INTENT_SUCCEEDED",
          payloadMasked: {
            source: "checkout.session.completed",
            sessionId: session.id,
            paymentStatus: session.payment_status,
            paymentIntentId,
          },
        },
      });

      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: "SUCCEEDED",
          capturedAt: new Date(),
          providerPaymentId: paymentIntentId ?? session.id,
        },
      });

      await tx.order.update({
        where: { id: orderId },
        data: { status: "PAID", paidAt: new Date() },
      });
    });
  } catch (e) {
    console.error("[stripe webhook]", e);
    return NextResponse.json({ ok: false, error: "persist_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
