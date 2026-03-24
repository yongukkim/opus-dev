import type { Metadata } from "next";
import Link from "next/link";
import { TokushohoContent } from "./tokushoho";

export const metadata: Metadata = {
  title: "特定商取引法に基づく表記 | OPUS",
  description: "特定商取引法に基づく表記（案）",
};

export default function TokushohoPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 pb-16 pt-[calc(6.5rem+2.5rem)]">
      <Link
        href="/"
        className="text-sm text-opus-warm/70 underline-offset-4 hover:text-opus-gold hover:underline"
      >
        ← トップへ
      </Link>
      <div className="mt-8">
        <TokushohoContent />
      </div>
    </main>
  );
}
