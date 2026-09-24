import Link from "next/link";
import { Fragment, type ReactNode } from "react";
import type { Block } from "@/content/types";
import { Alert } from "@/components/ui/alert";
import { ButtonLink } from "@/components/ui/button";

/** Renders the tiny inline markdown subset: **bold** and [label](href). Everything else is plain text. */
export function RichText({ text }: { text: string }) {
  const out: ReactNode[] = [];
  const re = /\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)\s]+)\)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(<Fragment key={i++}>{text.slice(last, m.index)}</Fragment>);
    if (m[1]) out.push(<strong key={i++}>{m[1]}</strong>);
    else {
      const href = m[3];
      if (href.startsWith("/"))
        out.push(
          <Link key={i++} href={href}>
            {m[2]}
          </Link>,
        );
      else if (/^https:\/\//.test(href))
        out.push(
          <a key={i++} href={href} rel="noopener noreferrer nofollow" target="_blank">
            {m[2]}
          </a>,
        );
      else out.push(<Fragment key={i++}>{m[2]}</Fragment>);
    }
    last = re.lastIndex;
  }
  if (last < text.length) out.push(<Fragment key={i++}>{text.slice(last)}</Fragment>);
  return <>{out}</>;
}

export function Blocks({ blocks }: { blocks: Block[] }) {
  return (
    <div className="prose-content">
      {blocks.map((b, i) => {
        switch (b.type) {
          case "p":
            return (
              <p key={i}>
                <RichText text={b.text} />
              </p>
            );
          case "h2":
            return (
              <h2 key={i} id={b.id}>
                {b.text}
              </h2>
            );
          case "h3":
            return <h3 key={i}>{b.text}</h3>;
          case "ul":
            return (
              <ul key={i}>
                {b.items.map((it, j) => (
                  <li key={j}>
                    <RichText text={it} />
                  </li>
                ))}
              </ul>
            );
          case "ol":
            return (
              <ol key={i}>
                {b.items.map((it, j) => (
                  <li key={j}>
                    <RichText text={it} />
                  </li>
                ))}
              </ol>
            );
          case "callout":
            return (
              <div key={i} className="my-6 not-prose">
                <Alert tone={b.tone === "success" ? "success" : b.tone === "warning" ? "warning" : "info"} title={b.title}>
                  <RichText text={b.text} />
                </Alert>
              </div>
            );
          case "table":
            return (
              <div key={i} className="my-6 overflow-x-auto rounded-xl border border-[var(--border)]">
                <table>
                  {b.caption ? <caption className="p-3 text-left text-sm text-subtle">{b.caption}</caption> : null}
                  <thead>
                    <tr>
                      {b.head.map((h, j) => (
                        <th key={j} scope="col">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {b.rows.map((r, j) => (
                      <tr key={j}>
                        {r.map((c, k) => (
                          <td key={k}>
                            <RichText text={c} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          case "cta":
            return (
              <div
                key={i}
                className="my-8 rounded-2xl border border-brand-200 bg-brand-50 p-6 dark:border-brand-800/60 dark:bg-brand-950/40"
              >
                <p className="!mb-1 text-lg font-bold">{b.title}</p>
                <p className="!mb-4 text-muted">{b.text}</p>
                <ButtonLink href={b.href} data-cta="content-cta">
                  {b.label}
                </ButtonLink>
              </div>
            );
        }
      })}
    </div>
  );
}
