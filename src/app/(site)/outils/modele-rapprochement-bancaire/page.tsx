import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/marketing/page-header";
import { TemplateDownload } from "@/components/tools/template-download";

export const metadata: Metadata = {
  title: "Modèle Excel de rapprochement bancaire gratuit",
  description:
    "Téléchargez gratuitement un modèle Excel de rapprochement bancaire avec formules : solde bancaire rapproché, solde comptable rapproché et écart calculés automatiquement.",
  alternates: { canonical: "/outils/modele-rapprochement-bancaire" },
};

export default function TemplatePage() {
  return (
    <>
      <PageHeader
        eyebrow="Ressource gratuite"
        title="Modèle Excel de rapprochement bancaire"
        lead="Un classeur prêt à remplir, avec les formules du rapprochement : vous saisissez les soldes et les opérations en suspens, l'écart se calcule tout seul."
        breadcrumbs={[
          { href: "/", label: "Accueil" },
          { href: "/outils/modele-rapprochement-bancaire", label: "Modèle de rapprochement" },
        ]}
      >
        <TemplateDownload />
        <p className="mt-3 text-sm text-subtle">Sans inscription. Compatible Excel, LibreOffice et Google Sheets.</p>
      </PageHeader>
      <div className="prose-content mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <h2 id="contenu">Ce que contient le modèle</h2>
        <ul>
          <li>
            Le solde du relevé et les opérations comptabilisées mais pas encore passées en banque (chèques émis non encaissés, remises en
            cours).
          </li>
          <li>
            Le solde du compte 512 et les opérations passées en banque mais pas encore comptabilisées (frais, prélèvements, virements
            reçus).
          </li>
          <li>Les deux soldes rapprochés et l&apos;écart, qui doit être nul.</li>
        </ul>
        <h2 id="methode">Comment l&apos;utiliser</h2>
        <p>
          Pointez les opérations du relevé avec celles de votre comptabilité, reportez dans le tableau celles qui ne figurent que d&apos;un
          côté, puis vérifiez que l&apos;écart est à zéro. Le guide{" "}
          <Link href="/guides/rapprochement-bancaire">rapprochement bancaire</Link> détaille la méthode avec un exemple chiffré.
        </p>
        <p>
          Pour récupérer les opérations d&apos;un relevé PDF sans les recopier, utilisez{" "}
          <Link href="/convertir">le convertisseur Relevéo</Link> : il vérifie aussi que le relevé est complet.
        </p>
      </div>
    </>
  );
}
