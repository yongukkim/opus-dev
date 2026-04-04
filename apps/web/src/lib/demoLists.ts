/**
 * Demo-only cart / wishlist persistence in `localStorage`.
 *
 * ISO 27001 A.18.1.4 (§7) Privacy by Design
 * KO: 데모 단계에서는 장바구니·찜 목록을 서버로 보내지 않고 단말 `localStorage`에만 저장합니다. PII를 넣지 않으며, 운영 전환 시 서버 동기화·동의·삭제 UI로 교체합니다.
 * JA: デモ段階ではカート・ほしいものをサーバに送らず端末の localStorage のみに保存します。PIIを入れず、本番移行時はサーバ同期・同意・削除UIに置き換えます。
 * EN: Demo keeps cart/wishlist on-device in localStorage only (no server sync). Do not store PII; replace with server-backed lists and consent flows for production.
 */

export const OPUS_DEMO_CART_KEY = "opus.demo.cart.v1";
export const OPUS_DEMO_WISHLIST_KEY = "opus.demo.wishlist.v1";

export type DemoListLine = {
  slug: string;
  title: string;
  artist: string;
  priceJpy: number;
  addedAt: string;
};

export function readDemoList(key: string): DemoListLine[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isDemoListLine);
  } catch {
    return [];
  }
}

function isDemoListLine(v: unknown): v is DemoListLine {
  if (v == null || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  const price = o["priceJpy"];
  return (
    typeof o["slug"] === "string" &&
    typeof o["title"] === "string" &&
    typeof o["artist"] === "string" &&
    typeof price === "number" &&
    Number.isFinite(price) &&
    typeof o["addedAt"] === "string"
  );
}

export function writeDemoList(key: string, lines: DemoListLine[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(lines.slice(0, 50)));
  } catch {
    /* quota / private mode */
  }
}

export function upsertDemoLine(lines: DemoListLine[], line: DemoListLine): DemoListLine[] {
  const next = lines.filter((x) => x.slug !== line.slug);
  next.push(line);
  return next;
}
