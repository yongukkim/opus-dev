import { NextResponse } from "next/server";
import { buildSearchIndex } from "@/lib/searchIndex";

/**
 * Static-feeling omni-search index (PR-8 of the home redesign series,
 * spec §4.3). Re-built at most once per hour; the client fetches it
 * once per session and runs substring matching itself.
 *
 * Compliance:
 * - All identifiers in the response are pen-name-only or `maskSellerId`-
 *   masked; the raw seller id is never serialized. See `searchIndex.ts`
 *   JSDoc for the full PII contract (ISO 27001 A.18.1.4 /
 *   SECURITY_GOVERNANCE.md §1).
 * - Cache headers mirror the route's `revalidate` so a CDN can shoulder
 *   the load: this is publicly cacheable (no per-user content).
 */
export const runtime = "nodejs";
export const revalidate = 300;

export async function GET(): Promise<Response> {
  try {
    const index = await buildSearchIndex();
    return NextResponse.json(index, {
      status: 200,
      headers: {
        "Cache-Control": "public, max-age=120, stale-while-revalidate=600",
      },
    });
  } catch (error) {
    console.error("[search/index.json] failed to build", error);
    // Fail closed with an empty (but well-typed) index so the modal can
    // still open and show its empty-state CTA copy.
    return NextResponse.json(
      {
        generatedAt: new Date().toISOString(),
        artworks: [],
        artists: [],
        listings: [],
      },
      { status: 200 },
    );
  }
}
