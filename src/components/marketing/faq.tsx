import { ChevronDown } from "lucide-react";
import type { FaqItem } from "@/content/types";
import { RichText } from "./rich-text";
import { JsonLd } from "./json-ld";

export function Faq({ items, withSchema = true }: { items: FaqItem[]; withSchema?: boolean }) {
  return (
    <div className="divide-y divide-[var(--border)] overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)]">
      {items.map((item) => (
        <details key={item.q} className="group">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-left font-semibold marker:content-none hover:bg-[var(--bg-subtle)] [&::-webkit-details-marker]:hidden">
            <span>{item.q}</span>
            <ChevronDown className="size-5 shrink-0 text-subtle transition-transform group-open:rotate-180" aria-hidden />
          </summary>
          <div className="px-5 pb-5 text-[0.97rem] leading-relaxed text-muted">
            <RichText text={item.a} />
          </div>
        </details>
      ))}
      {withSchema ? (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: items.map((i) => ({
              "@type": "Question",
              name: i.q,
              acceptedAnswer: { "@type": "Answer", text: i.a.replace(/\*\*/g, "").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") },
            })),
          }}
        />
      ) : null}
    </div>
  );
}
