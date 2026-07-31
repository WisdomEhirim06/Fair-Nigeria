import type { ReactNode } from 'react';

export function Markdown({ source, className = '' }: { source: string; className?: string }) {
  return <div className={className}>{renderBlocks(source)}</div>;
}

function renderBlocks(source: string): ReactNode[] {
  const lines = source.replace(/\r\n/g, '\n').split('\n');
  const out: ReactNode[] = [];
  let i = 0;
  let key = 0;
  const k = () => `b${key++}`;

  while (i < lines.length) {
    const line = lines[i];

    // Blank line
    if (line.trim() === '') {
      i += 1;
      continue;
    }

    // Fenced code block
    if (line.trim().startsWith('```')) {
      const buf: string[] = [];
      i += 1;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        buf.push(lines[i]);
        i += 1;
      }
      i += 1; // skip closing fence
      out.push(
        <pre key={k()} className="my-4 overflow-x-auto rounded-xl bg-ink/[0.06] p-4 font-mono text-[0.82rem] leading-relaxed text-ink/85">
          <code>{buf.join('\n')}</code>
        </pre>,
      );
      continue;
    }

    // Horizontal rule
    if (/^(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
      out.push(<hr key={k()} className="my-8 border-ink/12" />);
      i += 1;
      continue;
    }

    // Headings
    const heading = /^(#{1,3})\s+(.*)$/.exec(line);
    if (heading) {
      const level = heading[1].length;
      const text = heading[2];
      if (level === 1)
        out.push(<h1 key={k()} className="mt-8 text-[1.7rem] font-extrabold tracking-[-0.02em]">{renderInline(text, k())}</h1>);
      else if (level === 2)
        out.push(<h2 key={k()} className="mt-8 text-[1.35rem] font-bold tracking-[-0.01em]">{renderInline(text, k())}</h2>);
      else out.push(<h3 key={k()} className="mt-6 text-[1.1rem] font-bold">{renderInline(text, k())}</h3>);
      i += 1;
      continue;
    }

    // Blockquote
    if (/^>\s?/.test(line)) {
      const buf: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        buf.push(lines[i].replace(/^>\s?/, ''));
        i += 1;
      }
      out.push(
        <blockquote key={k()} className="my-5 border-l-[3px] border-lime pl-4 text-[1rem] italic leading-relaxed text-ink/75">
          {renderInline(buf.join(' '), k())}
        </blockquote>,
      );
      continue;
    }

    // Unordered list
    if (/^[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^[-*]\s+/, ''));
        i += 1;
      }
      out.push(
        <ul key={k()} className="my-4 flex list-disc flex-col gap-1.5 pl-5 text-[1rem] leading-relaxed marker:text-lime">
          {items.map((it, idx) => (
            <li key={idx}>{renderInline(it, `${k()}-${idx}`)}</li>
          ))}
        </ul>,
      );
      continue;
    }

    // Ordered list
    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s+/, ''));
        i += 1;
      }
      out.push(
        <ol key={k()} className="my-4 flex list-decimal flex-col gap-1.5 pl-5 text-[1rem] leading-relaxed marker:font-semibold marker:text-leaf">
          {items.map((it, idx) => (
            <li key={idx}>{renderInline(it, `${k()}-${idx}`)}</li>
          ))}
        </ol>,
      );
      continue;
    }

    // Paragraph — gather consecutive non-blank, non-special lines
    const buf: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !/^(#{1,3}\s|>\s?|[-*]\s|\d+\.\s|```)/.test(lines[i]) &&
      !/^(-{3,}|\*{3,}|_{3,})\s*$/.test(lines[i])
    ) {
      buf.push(lines[i]);
      i += 1;
    }
    out.push(
      <p key={k()} className="my-4 text-[1.02rem] leading-[1.7] text-ink/85">
        {renderInline(buf.join(' '), k())}
      </p>,
    );
  }

  return out;
}

function safeUrl(url: string): boolean {
  return /^(https?:\/\/|\/|#|mailto:)/i.test(url.trim());
}

/** Inline formatting: **bold**, *italic* / _italic_, `code`, [text](url). */
function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const out: ReactNode[] = [];
  let buf = '';
  let n = 0;
  let i = 0;
  const flush = () => {
    if (buf) {
      out.push(buf);
      buf = '';
    }
  };

  while (i < text.length) {
    const rest = text.slice(i);

    // Inline code
    if (text[i] === '`') {
      const end = text.indexOf('`', i + 1);
      if (end > i) {
        flush();
        out.push(
          <code key={`${keyPrefix}-${n++}`} className="rounded bg-ink/[0.07] px-1.5 py-0.5 font-mono text-[0.85em]">
            {text.slice(i + 1, end)}
          </code>,
        );
        i = end + 1;
        continue;
      }
    }

    // Bold
    if (rest.startsWith('**')) {
      const end = text.indexOf('**', i + 2);
      if (end > i + 1) {
        flush();
        out.push(
          <strong key={`${keyPrefix}-${n++}`} className="font-semibold text-ink">
            {renderInline(text.slice(i + 2, end), `${keyPrefix}-${n}`)}
          </strong>,
        );
        i = end + 2;
        continue;
      }
    }

    // Italic
    if (text[i] === '*' || text[i] === '_') {
      const ch = text[i];
      const end = text.indexOf(ch, i + 1);
      if (end > i) {
        flush();
        out.push(
          <em key={`${keyPrefix}-${n++}`}>{renderInline(text.slice(i + 1, end), `${keyPrefix}-${n}`)}</em>,
        );
        i = end + 1;
        continue;
      }
    }

    // Link
    if (text[i] === '[') {
      const m = /^\[([^\]]+)\]\(([^)\s]+)\)/.exec(rest);
      if (m) {
        const [full, label, url] = m;
        if (safeUrl(url)) {
          const external = /^https?:\/\//i.test(url);
          flush();
          out.push(
            <a
              key={`${keyPrefix}-${n++}`}
              href={url}
              {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              className="font-medium text-leaf underline decoration-lime/50 underline-offset-2 transition-colors hover:text-forest-deep"
            >
              {label}
            </a>,
          );
          i += full.length;
          continue;
        }
      }
    }

    buf += text[i];
    i += 1;
  }

  flush();
  return out;
}
