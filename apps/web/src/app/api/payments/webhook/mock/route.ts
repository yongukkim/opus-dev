import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type MockWebhookPayload = {
  eventId?: string;
  paymentId?: string;
  orderId?: string;
  type?: "payment_intent.succeeded" | "payment_intent.failed" | "payment_intent.canceled" | "charge.refunded";
  amountJpy?: number;
  failureCode?: string;
};

function webhookSecret(): string {
  return process.env["OPUS_MOCK_WEBHOOK_SECRET"] || "";
}

function verifySignature(raw: string, signatureHeader: string): boolean {
  const secret = webhookSecret();
  if (!secret) return false;
  const expected = crypto.createHmac("sha256", secret).update(raw).digest("hex");
  const received = signatureHeader.trim().toLowerCase();
  if (!received) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(received, "hex"));
  } catch {
    return false;
  }
}

function mapEventType(input: NonNullable<MockWebhookPayload["type"]>):
  | "PAYMENT_INTENT_SUCCEEDED"
  | "PAYMENT_INTENT_FAILED"
  | "PAYMENT_CANCELLED"
  | "PAYMENT_REFUNDED" {
  if (input === "payment_intent.succeeded") return "PAYMENT_INTENT_SUCCEEDED";
  if (input === "payment_intent.failed") return "PAYMENT_INTENT_FAILED";
  if (input === "payment_intent.canceled") return "PAYMENT_CANCELLED";
  return "PAYMENT_REFUNDED";
}

/**
 * ISO 27001 A.13.1.3 (§6), A.14.2.1 (§1), A.12.4.1 (§5)
 * KO: 웹훅은 HMAC 서명을 검증하고, provider event id 고유키로 멱등 처리하며, 최소 마스킹 payload만 감사 저장합니다.
 * JA: WebhookはHMAC署名を検証し、provider event idの一意キーで冪等化し、最小限にマスクしたpayloadのみ監査保存します。
 * EN: Webhook verifies HMAC signatures, enforces idempotency by unique provider event id, and stores only masked payload for audit.
 */
export async function POST(request: NextRequest): Promise<Response> {
  const raw = await request.text();
  const signature = request.headers.get("x-opus-mock-signature") ?? "";
  if (!verifySignature(raw, signature)) {
    return NextResponse.json({ ok: false, error: "invalid_signature" }, { status: 401 });
  }

  let payload: MockWebhookPayload;
  try {
    payload = JSON.parse(raw) as MockWebhookPayload;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
  }

  const eventId = payload.eventId?.trim() ?? "";
  const paymentId = payload.paymentId?.trim() ?? "";
  const orderId = payload.orderId?.trim() ?? "";
  if (!eventId || !paymentId || !orderId || !payload.type) {
    return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
  }

  const payment = await prisma.payment.findFirst({
    where: { id: paymentId, orderId, provider: "MOCK" },
    select: { id: true, orderId: true },
  });
  if (!payment) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  const already = await prisma.paymentEvent.findUnique({
    where: { provider_providerEventId: { provider: "MOCK", providerEventId: eventId } },
    select: { id: true },
  });
  if (already) {
    return NextResponse.json({ ok: true, duplicated: true }, { status: 200 });
  }

  const mapped = mapEventType(payload.type);
  await prisma.$transaction(async (tx) => {
    await tx.paymentEvent.create({
      data: {
        paymentId: payment.id,
        provider: "MOCK",
        providerEventId: eventId,
        eventType: mapped,
        payloadMasked: {
          type: payload.type,
          paymentId,
          orderId,
          amountJpy: payload.amountJpy ?? null,
          failureCode: payload.failureCode ?? null,
        },
      },
    });

    if (mapped === "PAYMENT_INTENT_SUCCEEDED") {
      await tx.payment.update({
        where: { id: payment.id },
        data: { status: "SUCCEEDED", capturedAt: new Date(), failureCode: null, failureReasonMasked: null },
      });
      await tx.order.update({
        where: { id: payment.orderId },
        data: { status: "PAID", paidAt: new Date(), failureCode: null, failureReasonMasked: null },
      });
    } else if (mapped === "PAYMENT_INTENT_FAILED") {
      await tx.payment.update({
        where: { id: payment.id },
        data: { status: "FAILED", failedAt: new Date(), failureCode: payload.failureCode ?? "provider_failed" },
      });
      await tx.order.update({
        where: { id: payment.orderId },
        data: { status: "FAILED", failedAt: new Date(), failureCode: payload.failureCode ?? "provider_failed" },
      });
    } else if (mapped === "PAYMENT_CANCELLED") {
      await tx.payment.update({
        where: { id: payment.id },
        data: { status: "CANCELLED" },
      });
      await tx.order.update({
        where: { id: payment.orderId },
        data: { status: "CANCELLED", cancelledAt: new Date() },
      });
    } else {
      await tx.payment.update({
        where: { id: payment.id },
        data: { status: "REFUNDED" },
      });
      await tx.order.update({
        where: { id: payment.orderId },
        data: { status: "REFUNDED", refundedAt: new Date() },
      });
    }
  });

  return NextResponse.json({ ok: true, duplicated: false }, { status: 200 });
}
