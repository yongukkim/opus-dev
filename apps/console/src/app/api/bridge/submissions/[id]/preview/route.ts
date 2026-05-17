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
    const res = await fetch(
      `${origin}/api/internal/operator/submissions/${encodeURIComponent(id)}/preview`,
      {
        headers: internalOperatorHeaders(session.user.id),
        cache: "no-store",
      },
    );
    if (!res.ok) {
      const t = await res.text();
      return new NextResponse(t, { status: res.status, headers: { "Content-Type": "application/json" } });
    }
    const buf = await res.arrayBuffer();
    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type": res.headers.get("content-type") ?? "image/webp",
        "Cache-Control": "private, max-age=600",
        "X-Robots-Tag": "noindex, noimageindex",
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "bridge_error";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
