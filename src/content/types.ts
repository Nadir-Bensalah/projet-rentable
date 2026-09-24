/**
 * Structured editorial content (guides, legal pages, landing sections).
 * Inline text supports a tiny markdown subset: **bold** and [label](/internal-or-https-url).
 */
export type Block =
  | { type: "p"; text: string }
  | { type: "h2"; text: string; id?: string }
  | { type: "h3"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "callout"; tone: "info" | "warning" | "success"; title?: string; text: string }
  | { type: "table"; head: string[]; rows: string[][]; caption?: string }
  | { type: "cta"; title: string; text: string; href: string; label: string };

export interface FaqItem {
  q: string;
  a: string;
}

export interface Guide {
  slug: string;
  title: string;
  metaTitle: string;
  description: string;
  /** ISO date */
  updated: string;
  readingMinutes: number;
  category: "Conversion" | "Comptabilité" | "Pratique";
  intro: string;
  blocks: Block[];
  faq: FaqItem[];
  related: string[];
}

export interface LegalPage {
  slug: string;
  title: string;
  description: string;
  updated: string;
  blocks: Block[];
}
