import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Faq } from "@/components/marketing/faq";
import { PageHeader } from "@/components/marketing/page-header";
import { Blocks } from "@/components/marketing/rich-text";
import { ButtonLink } from "@/components/ui/button";
import { FORMAT_PAGES } from "@/content/formats";

export const dynamicParams = false;

export function generateStaticParams() {
  return FORMAT_PAGES.map((f) => ({ slug: f.slug }));
}

export async function generateMetadata(props: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await props.params;
  const f = FORMAT_PAGES.find((x) => x.slug === slug);
  if (!f) return {};
  return { title: { absolute: `${f.metaTitle} — Relevéo` }, description: f.description, alternates: { canonical: `/formats/${f.slug}` } };
}

export default async function FormatPageView(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params;
  const f = FORMAT_PAGES.find((x) => x.slug === slug);
  if (!f) notFound();
  return (
    <>
      <PageHeader
        eyebrow={`Format ${f.format}`}
        title={f.title}
        lead={f.lead}
        breadcrumbs={[
          { href: "/", label: "Accueil" },
          { href: `/formats/${f.slug}`, label: f.title },
        ]}
      >
        <ButtonLink href="/convertir" size="lg" data-cta={`format-${f.slug}`}>
          Convertir un relevé
        </ButtonLink>
      </PageHeader>
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <Blocks blocks={f.blocks} />
        <h2 className="mb-5 mt-12 text-2xl font-bold tracking-tight">Questions fréquentes</h2>
        <Faq items={f.faq} />
        <nav aria-label="Autres formats" className="mt-12 rounded-2xl border border-[var(--border)] p-5">
          <p className="font-semibold">Autres formats</p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {FORMAT_PAGES.filter((x) => x.slug !== f.slug).map((x) => (
              <li key={x.slug}>
                <Link
                  href={`/formats/${x.slug}`}
                  className="inline-block rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm hover:bg-[var(--bg-subtle)]"
                >
                  {x.format}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </>
  );
}
