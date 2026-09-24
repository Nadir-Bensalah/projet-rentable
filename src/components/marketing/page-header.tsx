import Link from "next/link";
import type { ReactNode } from "react";
import { absoluteUrl } from "@/config/site";
import { JsonLd } from "./json-ld";

export function Breadcrumbs({ items }: { items: { href: string; label: string }[] }) {
  return (
    <>
      <nav aria-label="Fil d'Ariane" className="text-sm text-subtle">
        <ol className="flex flex-wrap items-center gap-1.5">
          {items.map((it, i) => (
            <li key={it.href} className="flex items-center gap-1.5">
              {i > 0 ? <span aria-hidden>/</span> : null}
              {i === items.length - 1 ? (
                <span aria-current="page" className="text-muted">
                  {it.label}
                </span>
              ) : (
                <Link href={it.href} className="hover:text-[var(--fg)]">
                  {it.label}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </nav>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.label, item: absoluteUrl(it.href) })),
        }}
      />
    </>
  );
}

export function PageHeader({
  eyebrow,
  title,
  lead,
  children,
  breadcrumbs,
}: {
  eyebrow?: string;
  title: ReactNode;
  lead?: ReactNode;
  children?: ReactNode;
  breadcrumbs?: { href: string; label: string }[];
}) {
  return (
    <div className="relative overflow-hidden border-b border-[var(--border)]">
      <div className="bg-grid pointer-events-none absolute inset-0 opacity-60" aria-hidden />
      <div className="relative mx-auto max-w-4xl px-4 pb-12 pt-10 sm:px-6 sm:pt-14">
        {breadcrumbs ? (
          <div className="mb-6">
            <Breadcrumbs items={breadcrumbs} />
          </div>
        ) : null}
        {eyebrow ? <p className="text-sm font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-300">{eyebrow}</p> : null}
        <h1 className="mt-2 text-balance text-3xl font-bold tracking-tight sm:text-5xl">{title}</h1>
        {lead ? <p className="mt-4 max-w-2xl text-pretty text-lg leading-relaxed text-muted">{lead}</p> : null}
        {children ? <div className="mt-7">{children}</div> : null}
      </div>
    </div>
  );
}
