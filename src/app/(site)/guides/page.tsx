import { ArrowRight, Clock } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/marketing/page-header";
import { GUIDES } from "@/content/guides";

export const metadata: Metadata = {
  title: "Guides : relevés bancaires, Excel, OFX et rapprochement",
  description:
    "Guides pratiques pour convertir un relevé bancaire PDF, importer vos opérations en comptabilité, faire un rapprochement bancaire et éviter les pièges du CSV.",
  alternates: { canonical: "/guides" },
};

export default function GuidesIndex() {
  return (
    <>
      <PageHeader
        eyebrow="Guides"
        title="Des relevés PDF aux chiffres fiables"
        lead="Méthodes, formats et bonnes pratiques pour exploiter vos relevés bancaires sans erreur."
        breadcrumbs={[
          { href: "/", label: "Accueil" },
          { href: "/guides", label: "Guides" },
        ]}
      />
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-12 sm:px-6 md:grid-cols-2 lg:grid-cols-3">
        {GUIDES.map((g) => (
          <Link
            key={g.slug}
            href={`/guides/${g.slug}`}
            className="group surface flex flex-col p-6 transition-shadow hover:shadow-[var(--shadow-lift)]"
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-300">{g.category}</p>
            <h2 className="mt-2 text-lg font-bold leading-snug">{g.title}</h2>
            <p className="mt-2 flex-1 text-[0.95rem] leading-relaxed text-muted">{g.description}</p>
            <p className="mt-5 flex items-center justify-between text-sm text-subtle">
              <span className="inline-flex items-center gap-1.5">
                <Clock className="size-4" aria-hidden /> {g.readingMinutes} min
              </span>
              <span className="inline-flex items-center gap-1 font-semibold text-brand-600 group-hover:gap-2 dark:text-brand-300">
                Lire <ArrowRight className="size-4 transition-all" aria-hidden />
              </span>
            </p>
          </Link>
        ))}
      </div>
    </>
  );
}
