import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { internalOperatorHeaders, requireWebOrigin } from "@/lib/webInternal";

/**
 * ISO 27001 A.9.2.1 — Browser calls this route (operator session); server forwards with internal secret.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "operator") {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const origin = requireWebOrigin();
    const res = await fetch(`${origin}/api/internal/operator/submissions`, {
      headers: internalOperatorHeaders(session.user.id),
      cache: "no-store",
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
