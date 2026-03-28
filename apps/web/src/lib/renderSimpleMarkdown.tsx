import type { ReactNode } from "react";

function inlineFormat(s: string): ReactNode {
  const nodes: ReactNode[] = [];
  const re = /\*\*(.+?)\*\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let si = 0;
  while ((m = re.exec(s)) !== null) {
    if (m.index > last) {
      nodes.push(s.slice(last, m.index));
    }
    nodes.push(
      <strong key={`s-${si++}`} className="font-semibold text-opus-warm">
        {m[1]}
      </strong>,
    );
    last = m.index + m[0].length;
  }
  if (last < s.length) {
    nodes.push(s.slice(last));
  }
  return nodes.length === 1 ? nodes[0]! : <>{nodes}</>;
}

/**
 * Minimal markdown for legal summaries: # / ## / - lists / --- / **bold** / italic *line*.
 */
export function renderSimpleMarkdown(markdown: string): ReactNode {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const out: ReactNode[] = [];
  let i = 0;
  let key = 0;
  const nk = () => key++;

  while (i < lines.length) {
    const raw = lines[i] ?? "";
    const t = raw.trim();
    if (!t) {
      i += 1;
      continue;
    }

    if (t === "---") {
      out.push(<hr key={nk()} className="my-8 border-white/[0.12]" />);
      i += 1;
      continue;
    }

    if (t.startsWith("# ")) {
      out.push(
        <h1 key={nk()} className="font-display text-2xl text-opus-warm md:text-3xl">
          {inlineFormat(t.slice(2))}
        </h1>,
      );
      i += 1;
      continue;
    }

    if (t.startsWith("## ")) {
      out.push(
        <h2 key={nk()} className="mt-8 font-display text-lg text-opus-warm/95 first:mt-0">
          {inlineFormat(t.slice(3))}
        </h2>,
      );
      i += 1;
      continue;
    }

    if (t.startsWith("- ")) {
      const items: string[] = [];
      while (i < lines.length) {
        const L = (lines[i] ?? "").trim();
        if (!L.startsWith("- ")) break;
        items.push(L.slice(2));
        i += 1;
      }
      out.push(
        <ul key={nk()} className="mt-3 list-disc space-y-2 pl-5 font-sans text-sm leading-relaxed text-opus-warm/75">
          {items.map((item, j) => (
            <li key={j}>{inlineFormat(item)}</li>
          ))}
        </ul>,
      );
      continue;
    }

    const paras: string[] = [raw];
    i += 1;
    while (i < lines.length) {
      const L = lines[i] ?? "";
      const tr = L.trim();
      if (!tr) break;
      if (tr.startsWith("#") || tr === "---" || tr.startsWith("- ")) break;
      paras.push(L);
      i += 1;
    }
    const paraText = paras.join(" ").trim();
    const italicOnly = /^\*(.+)\*$/.exec(paraText);
    if (italicOnly) {
      out.push(
        <p key={nk()} className="font-sans text-sm italic leading-relaxed text-opus-warm/50">
          {italicOnly[1]}
        </p>,
      );
    } else {
      out.push(
        <p key={nk()} className="font-sans text-sm leading-relaxed text-opus-warm/75">
          {inlineFormat(paraText)}
        </p>,
      );
    }
  }

  return <div className="space-y-2">{out}</div>;
}
