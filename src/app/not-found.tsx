import type { Metadata } from "next";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Page introuvable",
  robots: { index: false, follow: true },
  alternates: { canonical: null },
};

export default function RootNotFound() {
  return (
    <>
      <SiteHeader />
      <main id="contenu" className="mx-auto max-w-xl px-4 py-24 text-center">
        <p className="text-sm font-semibold text-brand-600 dark:text-brand-300">Erreur 404</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Cette page n&apos;existe pas</h1>
        <p className="mt-3 text-muted">Le lien est peut-être incorrect ou la page a été déplacée.</p>
        <div className="mt-8 flex justify-center gap-3">
          <ButtonLink href="/">Accueil</ButtonLink>
          <ButtonLink href="/convertir" variant="secondary">
            Convertir un relevé
          </ButtonLink>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
