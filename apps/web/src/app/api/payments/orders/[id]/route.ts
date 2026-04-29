import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { readActorFromRequest } from "@/lib/authContext";

export const runtime = "nodejs";

/**
 * ISO 27001 A.9.2.1 (§4), A.13.1.3 (§6)
 * KO: 주문 조회는 소유자(collector) 또는 운영자만 허용하며, 결제/오류 정보는 최소 필드만 반환합니다.
 * JA: 注文照会は所有者(collector)または運営者のみ許可し、決済/エラー情報は最小限の項目のみ返します。
 * EN: Order lookup is limited to owner collector or operator and returns only minimal payment/error fields.
 */
export async function GET(request: NextRequest, ctx: { params: Promise<{ id: string }> }): Promise<Response> {
  const actor = await readActorFromRequest(request);
  if (!actor) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const orderId = id.trim();
  if (!orderId) {
    return NextResponse.json({ ok: false, error: "invalid_request" }, { status: 400 });
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      buyerUserId: true,
      status: true,
      amountJpy: true,
      currency: true,
      provider: true,
      paidAt: true,
      failedAt: true,
      cancelledAt: true,
      refundedAt: true,
      createdAt: true,
      payments: {
        select: {
          id: true,
          status: true,
          provider: true,
          capturedAt: true,
          failedAt: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!order) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }
  if (actor.role !== "operator" && order.buyerUserId !== actor.userId) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  return NextResponse.json({ ok: true, order }, { status: 200 });
}
