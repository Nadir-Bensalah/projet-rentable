import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Blocks } from "@/components/marketing/rich-text";
import { Faq } from "@/components/marketing/faq";
import { JsonLd } from "@/components/marketing/json-ld";
import { PageHeader } from "@/components/marketing/page-header";
import { ButtonLink } from "@/components/ui/button";
import { absoluteUrl, site } from "@/config/site";
import { GUIDES } from "@/content/guides";

export const dynamicParams = false;

export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata(props: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await props.params;
  const g = GUIDES.find((x) => x.slug === slug);
  if (!g) return {};
  return {
    title: { absolute: `${g.metaTitle} — Relevéo` },
    description: g.description,
    alternates: { canonical: `/guides/${g.slug}` },
    openGraph: { type: "article", title: g.title, description: g.description, url: `/guides/${g.slug}`, modifiedTime: g.updated },
  };
}

export default async function GuidePage(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params;
  const g = GUIDES.find((x) => x.slug === slug);
  if (!g) notFound();
  const toc = g.blocks.filter((b): b is { type: "h2"; text: string; id?: string } => b.type === "h2" && !!b.id);
  const related = g.related.map((s) => GUIDES.find((x) => x.slug === s)).filter(Boolean) as typeof GUIDES;
  const updated = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(new Date(g.updated));
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: g.title,
          description: g.description,
          dateModified: g.updated,
          datePublished: g.updated,
          inLanguage: "fr-FR",
          mainEntityOfPage: absoluteUrl(`/guides/${g.slug}`),
          author: { "@type": "Organization", name: site.name },
          publisher: { "@type": "Organization", name: site.name, logo: { "@type": "ImageObject", url: absoluteUrl("/icon.svg") } },
        }}
      />
      <PageHeader
        eyebrow={g.category}
        title={g.title}
        lead={g.intro}
        breadcrumbs={[
          { href: "/", label: "Accueil" },
          { href: "/guides", label: "Guides" },
          { href: `/guides/${g.slug}`, label: g.title },
        ]}
      >
        <p className="text-sm text-subtle">
          Mis à jour le {updated} · {g.readingMinutes} min de lecture
        </p>
      </PageHeader>
      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_16rem]">
        <article className="min-w-0 max-w-3xl">
          <Blocks blocks={g.blocks} />
          {g.faq.length ? (
            <section className="mt-12" aria-labelledby="faq-guide">
              <h2 id="faq-guide" className="mb-5 text-2xl font-bold tracking-tight">
                Questions fréquentes
              </h2>
              <Faq items={g.faq} />
            </section>
          ) : null}
        </article>
        <aside className="hidden lg:block">
          <div className="sticky top-24 grid gap-6">
            {toc.length ? (
              <nav aria-label="Sommaire">
                <p className="text-sm font-semibold">Sommaire</p>
                <ul className="mt-3 grid gap-2 border-l border-[var(--border)] text-sm">
                  {toc.map((t) => (
                    <li key={t.id}>
                      <a
                        href={`#${t.id}`}
                        className="-ml-px block border-l border-transparent pl-3 text-muted hover:border-brand-500 hover:text-[var(--fg)]"
                      >
                        {t.text}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            ) : null}
            <div className="rounded-2xl border border-[var(--border)] p-5">
              <p className="font-semibold">Convertir un relevé</p>
              <p className="mt-1 text-sm text-muted">Gratuit, sans envoi de fichier, vérifié au centime.</p>
              <ButtonLink href="/convertir" size="sm" className="mt-4 w-full" data-cta="guide-sidebar">
                Essayer
              </ButtonLink>
            </div>
          </div>
        </aside>
      </div>
      {related.length ? (
        <section className="mx-auto max-w-6xl px-4 sm:px-6" aria-labelledby="related">
          <h2 id="related" className="text-xl font-bold">
            À lire aussi
          </h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {related.map((r) => (
              <Link
                key={r.slug}
                href={`/guides/${r.slug}`}
                className="rounded-2xl border border-[var(--border)] p-5 hover:bg-[var(--bg-subtle)]"
              >
                <p className="font-semibold">{r.title}</p>
                <p className="mt-1 line-clamp-2 text-sm text-muted">{r.description}</p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}
