import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { AnalyticsOptOut } from "@/components/marketing/analytics-opt-out";
import { Blocks } from "@/components/marketing/rich-text";
import { PageHeader } from "@/components/marketing/page-header";
import { LEGAL_SLUGS, getLegalPage } from "@/content/legal";

// Rendered at request time: the publisher identity comes from runtime environment
// variables, so one Docker image can be configured without rebuilding.

export async function generateMetadata(props: { params: Promise<{ legal: string }> }): Promise<Metadata> {
  const { legal } = await props.params;
  if (!(LEGAL_SLUGS as readonly string[]).includes(legal)) return {};
  await connection();
  const p = getLegalPage(legal);
  if (!p) return {};
  return { title: p.title, description: p.description, alternates: { canonical: `/${p.slug}` } };
}

export default async function LegalPageView(props: { params: Promise<{ legal: string }> }) {
  const { legal } = await props.params;
  if (!(LEGAL_SLUGS as readonly string[]).includes(legal)) notFound();
  await connection();
  const p = getLegalPage(legal);
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
