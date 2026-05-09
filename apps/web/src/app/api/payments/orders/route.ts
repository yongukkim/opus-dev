import { NextRequest, NextResponse } from "next/server";
import { readActorFromRequest } from "@/lib/authContext";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type CreateOrderBody = {
  title?: string;
  amountJpy?: number;
  artworkId?: string;
  editionId?: string;
  sellerUserId?: string;
};

/**
 * ISO 27001 A.14.2.1 (§1), A.13.1.3 (§6), A.12.4.1 (§5)
 * KO: 주문 생성은 서버에서 금액/필드 검증을 수행하고, idempotency key로 중복 생성을 방지하며, 민감정보를 응답에 노출하지 않습니다.
 * JA: 注文作成はサーバー側で金額/項目を検証し、idempotency keyで重複作成を防止し、機微情報をレスポンスに露出しません。
 * EN: Order creation validates inputs server-side, prevents duplicate creation with an idempotency key, and does not expose sensitive internals.
 */
export async function POST(request: NextRequest): Promise<Response> {
  const actor = await readActorFromRequest(request);
  if (!actor || actor.role !== "collector") {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  let body: CreateOrderBody;
  try {
    body = (await request.json()) as CreateOrderBody;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_request" }, { status: 400 });
  }

  const idempotencyKey = request.headers.get("x-idempotency-key")?.trim() ?? "";
  const title = body.title?.trim() ?? "";
  const amountJpy = Number.isFinite(body.amountJpy) ? Number(body.amountJpy) : NaN;
  if (!idempotencyKey || idempotencyKey.length > 128 || !title || title.length > 256) {
    return NextResponse.json({ ok: false, error: "invalid_request" }, { status: 400 });
  }
  if (!Number.isInteger(amountJpy) || amountJpy <= 0 || amountJpy > 99_999_999) {
    return NextResponse.json({ ok: false, error: "invalid_amount" }, { status: 400 });
  }

  const existing = await prisma.order.findUnique({ where: { idempotencyKey } });
  if (existing) {
    return NextResponse.json(
      {
        ok: true,
        reused: true,
        orderId: existing.id,
        status: existing.status,
        amountJpy: existing.amountJpy,
        provider: existing.provider,
      },
      { status: 200 },
    );
  }

  const created = await prisma.$transaction(async (tx) => {
    const order = await tx.order.create({
      data: {
        idempotencyKey,
        title,
        amountJpy,
        artworkId: body.artworkId?.trim() || null,
        editionId: body.editionId?.trim() || null,
        sellerUserId: body.sellerUserId?.trim() || null,
        buyerUserId: actor.userId,
        provider: "MOCK",
        status: "PENDING",
      },
      select: { id: true, status: true, amountJpy: true, createdAt: true, provider: true },
    });
    const payment = await tx.payment.create({
      data: {
        orderId: order.id,
        provider: "MOCK",
        amountJpy,
        currency: "JPY",
        status: "REQUIRES_ACTION",
      },
      select: { id: true, status: true },
    });
    return { order, payment };
  });

  return NextResponse.json({ ok: true, reused: false, order: created.order, payment: created.payment }, { status: 201 });
}
