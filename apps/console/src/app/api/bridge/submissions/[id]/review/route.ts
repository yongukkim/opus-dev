import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { internalOperatorHeaders, requireWebOrigin } from "@/lib/webInternal";

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "operator") {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { id } = await context.params;
  const body = await req.text();
  try {
    const origin = requireWebOrigin();
    const res = await fetch(`${origin}/api/internal/operator/submissions/${encodeURIComponent(id)}/review`, {
      method: "POST",
      headers: {
        ...internalOperatorHeaders(session.user.id),
        "Content-Type": "application/json",
      },
      body,
    });
    const text = await res.text();
    return new NextResponse(text, {
      status: res.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "bridge_error";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
