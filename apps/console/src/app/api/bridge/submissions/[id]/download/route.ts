import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/auth";
import { internalOperatorHeaders, requireWebOrigin } from "@/lib/webInternal";

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "operator") {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { id } = await context.params;
  try {
    const origin = requireWebOrigin();
    const res = await fetch(`${origin}/api/internal/operator/submissions/${encodeURIComponent(id)}/download`, {
      headers: internalOperatorHeaders(session.user.id),
      cache: "no-store",
    });
    if (!res.ok) {
      const t = await res.text();
      return new NextResponse(t, { status: res.status, headers: { "Content-Type": "application/json" } });
    }
    const buf = await res.arrayBuffer();
    const ct = res.headers.get("content-type") ?? "application/octet-stream";
    const cd = res.headers.get("content-disposition");
    const headers = new Headers();
    headers.set("Content-Type", ct);
    if (cd) headers.set("Content-Disposition", cd);
    headers.set("Cache-Control", "private, no-store");
    return new NextResponse(buf, { status: 200, headers });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "bridge_error";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
