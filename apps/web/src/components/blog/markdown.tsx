import * as React from "react";
import Link from "next/link";

/**
 * Renderizador Markdown mínimo y seguro (sin dependencia, sin `dangerouslySetInnerHTML`).
 * Soporta: # ## ### encabezados, - / 1. listas, > citas, `---` regla,
 * párrafos por línea en blanco, y en línea: **negrita**, *cursiva*, `código`,
 * [texto](url), ![alt](url). Todo lo demás se muestra como texto plano (React
 * escapa por defecto).
 */
export function Markdown({ content, className }: { content: string; className?: string }) {
  const blocks = content.replace(/\r\n/g, "\n").split(/\n{2,}/);
  return (
    <div className={className}>
      {blocks.map((block, i) => (
        <Block key={i} raw={block.trim()} />
      ))}
    </div>
  );
}

function Block({ raw }: { raw: string }) {
  if (!raw) return null;

  if (/^---+$/.test(raw)) return <hr className="my-8 border-border" />;

  const h = raw.match(/^(#{1,4})\s+(.*)$/);
  if (h) {
    const level = h[1]!.length;
    const text = <Inline text={h[2]!} />;
    const cls = "mt-8 mb-3 font-semibold tracking-tight";
    if (level === 1) return <h1 className={`text-2xl ${cls}`}>{text}</h1>;
    if (level === 2) return <h2 className={`text-xl ${cls}`}>{text}</h2>;
    if (level === 3) return <h3 className={`text-lg ${cls}`}>{text}</h3>;
    return <h4 className={`text-base ${cls}`}>{text}</h4>;
  }

  const lines = raw.split("\n");

  if (lines.every((l) => /^\s*[-*]\s+/.test(l))) {
    return (
      <ul className="my-4 ml-5 list-disc space-y-1.5 text-[0.95rem] leading-relaxed">
        {lines.map((l, i) => (
          <li key={i}>
            <Inline text={l.replace(/^\s*[-*]\s+/, "")} />
          </li>
        ))}
      </ul>
    );
  }

  if (lines.every((l) => /^\s*\d+\.\s+/.test(l))) {
    return (
      <ol className="my-4 ml-5 list-decimal space-y-1.5 text-[0.95rem] leading-relaxed">
        {lines.map((l, i) => (
          <li key={i}>
            <Inline text={l.replace(/^\s*\d+\.\s+/, "")} />
          </li>
        ))}
      </ol>
    );
  }

  if (lines.every((l) => /^\s*>\s?/.test(l))) {
    return (
      <blockquote className="my-4 border-l-2 border-primary pl-4 text-[0.95rem] italic text-muted-foreground">
        <Inline text={lines.map((l) => l.replace(/^\s*>\s?/, "")).join(" ")} />
      </blockquote>
    );
  }

  return (
    <p className="my-4 text-[0.95rem] leading-relaxed text-foreground/90">
      <Inline text={raw.split("\n").join(" ")} />
    </p>
  );
}

/** Formato en línea. Procesa imágenes/links primero, luego énfasis/código. */
function Inline({ text }: { text: string }): React.ReactElement {
  const nodes: React.ReactNode[] = [];
  const re = /!\[([^\]]*)\]\(([^)\s]+)\)|\[([^\]]+)\]\(([^)\s]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;

  while ((m = re.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    if (m[2] !== undefined) {
      // imagen
      nodes.push(
        // eslint-disable-next-line @next/next/no-img-element
        <img key={key++} src={m[2]} alt={m[1] ?? ""} className="my-4 w-full rounded-lg" loading="lazy" />,
      );
    } else if (m[4] !== undefined) {
      const href = m[4];
      const internal = href.startsWith("/");
      nodes.push(
        internal ? (
          <Link key={key++} href={href} className="text-primary underline underline-offset-2">
            {m[3]}
          </Link>
        ) : (
          <a
            key={key++}
            href={href}
            target="_blank"
            rel="noreferrer"
            className="text-primary underline underline-offset-2"
          >
            {m[3]}
          </a>
        ),
      );
    } else if (m[5] !== undefined) {
      nodes.push(<strong key={key++}>{m[5]}</strong>);
    } else if (m[6] !== undefined) {
      nodes.push(<em key={key++}>{m[6]}</em>);
    } else if (m[7] !== undefined) {
      nodes.push(
        <code key={key++} className="rounded bg-secondary px-1 py-0.5 text-[0.85em]">
          {m[7]}
        </code>,
      );
    }
    last = re.lastIndex;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return <>{nodes}</>;
}
