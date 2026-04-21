import type { ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * Renders legal markdown documents (privacy policy, terms of service) with
 * GitHub Flavored Markdown support — tables, headings up to h4, links,
 * numbered lists — styled to match the OPUS Classic Luxury palette.
 *
 * KO: 법적 문서(개인정보처리방침·이용약관) 전용 마크다운 렌더러. 테이블·링크
 *     ·h3·번호 목록 등 GFM 전부 지원하며 OPUS 팔레트(near-black/champagne
 *     brass/warm white)에 맞춘 스타일을 적용한다.
 * JA: 法的文書（プライバシーポリシー・利用規約）専用の Markdown レンダラー。
 *     表・リンク・h3・番号付きリスト等 GFM をすべて対応し、OPUS パレットに
 *     沿ったスタイルで表示する。
 * EN: Legal-document-only Markdown renderer. Supports the full GFM feature set
 *     (tables, links, h3, ordered lists) and applies styles consistent with
 *     the OPUS palette (near-black / champagne brass / warm white).
 *
 * ISO 27001 §12.4.1 / CLAUDE.md §5: table rendering is required so that
 * PIPA §28-8 ② cross-border-transfer disclosures and APPI §28 safeguards
 * reach the user as a properly formatted table rather than as mangled
 * inline text.
 */
export function renderLegalMarkdown(markdown: string): ReactNode {
  return (
    <div className="space-y-4">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="font-display text-2xl text-opus-warm md:text-3xl">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="mt-8 font-display text-lg text-opus-warm/95 first:mt-0">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="mt-5 font-display text-base text-opus-warm/90">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="mt-4 font-sans text-sm font-semibold text-opus-warm/85">
              {children}
            </h4>
          ),
          p: ({ children }) => (
            <p className="font-sans text-sm leading-relaxed text-opus-warm/75">
              {children}
            </p>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-opus-warm">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="italic text-opus-warm/65">{children}</em>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              className="text-opus-gold underline-offset-4 hover:underline"
              target={href?.startsWith("http") ? "_blank" : undefined}
              rel={href?.startsWith("http") ? "noreferrer noopener" : undefined}
            >
              {children}
            </a>
          ),
          ul: ({ children }) => (
            <ul className="mt-3 list-disc space-y-2 pl-5 font-sans text-sm leading-relaxed text-opus-warm/75">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="mt-3 list-decimal space-y-2 pl-5 font-sans text-sm leading-relaxed text-opus-warm/75">
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="marker:text-opus-warm/40">{children}</li>,
          hr: () => <hr className="my-8 border-white/[0.12]" />,
          blockquote: ({ children }) => (
            <blockquote className="mt-3 border-l-2 border-opus-gold/60 pl-4 font-sans text-sm italic leading-relaxed text-opus-warm/65">
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="mt-4 overflow-x-auto rounded-lg border border-white/[0.08]">
              <table className="w-full border-collapse text-left font-sans text-sm text-opus-warm/80">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-opus-slate/25 text-opus-warm/90">{children}</thead>
          ),
          tbody: ({ children }) => <tbody>{children}</tbody>,
          tr: ({ children }) => (
            <tr className="border-b border-white/[0.06] last:border-b-0">{children}</tr>
          ),
          th: ({ children }) => (
            <th className="whitespace-nowrap border-r border-white/[0.06] px-3 py-2 align-top font-semibold last:border-r-0">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border-r border-white/[0.06] px-3 py-2 align-top last:border-r-0">
              {children}
            </td>
          ),
          code: ({ children }) => (
            <code className="rounded bg-opus-slate/30 px-1.5 py-0.5 font-mono text-[0.8rem] text-opus-warm/90">
              {children}
            </code>
          ),
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
