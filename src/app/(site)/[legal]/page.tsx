import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AnalyticsOptOut } from "@/components/marketing/analytics-opt-out";
import { Blocks } from "@/components/marketing/rich-text";
import { PageHeader } from "@/components/marketing/page-header";
import { LEGAL_PAGES } from "@/content/legal";

// Unknown slugs render the 404 page (notFound below) instead of raising NoFallbackError.
export const dynamicParams = true;

export function generateStaticParams() {
  return LEGAL_PAGES.map((p) => ({ legal: p.slug }));
}

export async function generateMetadata(props: { params: Promise<{ legal: string }> }): Promise<Metadata> {
  const { legal } = await props.params;
  const p = LEGAL_PAGES.find((x) => x.slug === legal);
  if (!p) return {};
  return { title: p.title, description: p.description, alternates: { canonical: `/${p.slug}` } };
}

export default async function LegalPageView(props: { params: Promise<{ legal: string }> }) {
  const { legal } = await props.params;
  const p = LEGAL_PAGES.find((x) => x.slug === legal);
  if (!p) notFound();
  const updated = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(new Date(p.updated));
  return (
    <>
      <PageHeader
        title={p.title}
        lead={`Dernière mise à jour : ${updated}`}
        breadcrumbs={[
          { href: "/", label: "Accueil" },
          { href: `/${p.slug}`, label: p.title },
        ]}
      />
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <Blocks blocks={p.blocks} />
        {p.slug === "cookies" ? (
          <div className="mt-10">
            <AnalyticsOptOut />
          </div>
        ) : null}
      </div>
    </>
  );
}
