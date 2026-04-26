export const MAX_EDITIONS = 20;

export type ParsedEdition = {
  editionMode: "unique" | "limited";
  editionTotal: number;
  initialMint: number;
  numberingPolicy: "auto" | "manual";
  lockEdition: boolean;
};

type EditionShape = {
  editionMode?: unknown;
  editionTotal?: unknown;
  initialMint?: unknown;
  numberingPolicy?: unknown;
  lockEdition?: unknown;
};

/**
 * ISO 27001 A.14.2.1 (§1) — shared server-side edition JSON validation.
 * KO: 에디션 JSON은 열거·정수 범위를 화이트리스트로 검증합니다.
 * JA: エディションJSONは列挙・整数範囲をホワイトリスト検証します。
 * EN: Validate edition JSON with allowlisted enums and integer bounds.
 */
export function parseEditionObject(
  body: unknown,
): { ok: true; value: ParsedEdition } | { ok: false; error: string } {
  if (body === null || typeof body !== "object") return { ok: false, error: "invalid:edition" };
  const b = body as EditionShape;

  const editionMode = b.editionMode;
  if (editionMode !== "unique" && editionMode !== "limited") return { ok: false, error: "invalid:editionMode" };

  if (typeof b.editionTotal !== "number" || !Number.isInteger(b.editionTotal)) {
    return { ok: false, error: "invalid:editionTotal" };
  }
  const editionTotal = b.editionTotal;
  if (editionTotal < 1 || editionTotal > MAX_EDITIONS) return { ok: false, error: "invalid:editionTotal" };
  if (editionMode === "unique" && editionTotal !== 1) return { ok: false, error: "invalid:editionTotal" };

  if (typeof b.initialMint !== "number" || !Number.isInteger(b.initialMint)) {
    return { ok: false, error: "invalid:initialMint" };
  }
  const initialMint = b.initialMint;
  if (initialMint < 1 || initialMint > editionTotal) return { ok: false, error: "invalid:initialMint" };

  const numberingPolicy = b.numberingPolicy;
  if (numberingPolicy !== "auto" && numberingPolicy !== "manual") {
    return { ok: false, error: "invalid:numberingPolicy" };
  }

  if (typeof b.lockEdition !== "boolean") return { ok: false, error: "invalid:lockEdition" };

  return {
    ok: true,
    value: {
      editionMode,
      editionTotal,
      initialMint,
      numberingPolicy,
      lockEdition: b.lockEdition,
    },
  };
}
