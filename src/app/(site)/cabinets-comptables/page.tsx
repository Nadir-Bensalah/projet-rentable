import { Check, FileStack, Layers, Scale, Timer } from "lucide-react";
import type { Metadata } from "next";
import { Faq } from "@/components/marketing/faq";
import { PageHeader } from "@/components/marketing/page-header";
import { ButtonLink } from "@/components/ui/button";
import { PLANS, formatPrice } from "@/config/plans";

export const metadata: Metadata = {
  title: "Cabinets comptables : relevés PDF clients convertis par lot",
  description:
    "Convertissez par lot les relevés bancaires PDF de vos clients, contrôlés au centime, en journal de banque 512/471 aux colonnes FEC, OFX, CSV ou Excel. Sans envoi de fichier.",
  alternates: { canonical: "/cabinets-comptables" },
};

export default function FirmsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Experts-comptables, gestionnaires de paie, bookkeepers"
        title="Les relevés PDF de vos clients, prêts à importer. Et contrôlés."
        lead="Quand un client n'a que des PDF — compte non synchronisé, historique ancien, banque étrangère — Relevéo les convertit par lot en écritures ou en fichiers d'import, avec un contrôle de solde pour chaque relevé."
        breadcrumbs={[
          { href: "/", label: "Accueil" },
          { href: "/cabinets-comptables", label: "Cabinets comptables" },
        ]}
      >
        <div className="flex flex-col gap-3 sm:flex-row">
          <ButtonLink href="/convertir?exemple=1" size="lg" data-cta="firms-sample">
            Tester avec un exemple
          </ButtonLink>
          <ButtonLink href="/tarifs" size="lg" variant="secondary">
            Plan Cabinet : {formatPrice(PLANS.business.priceMonthly)}/mois
          </ButtonLink>
        </div>
      </PageHeader>
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: FileStack,
              t: "Traitement par lot",
              d: "Jusqu'à 24 relevés déposés d'un coup, lus les uns après les autres dans votre navigateur.",
            },
            {
              icon: Layers,
              t: "Fusion sans doublons",
              d: "Une année de relevés en un seul fichier trié ; les opérations présentes dans deux relevés qui se chevauchent ne sont gardées qu'une fois.",
            },
            {
              icon: Scale,
              t: "Contrôle par relevé",
              d: "Solde de départ + mouvements = solde final. Les relevés en écart sont signalés avant l'import.",
            },
            {
              icon: Timer,
              t: "Journal prêt à importer",
              d: "Écritures 512 / 471 aux 18 colonnes du FEC, ou OFX / CSV selon votre logiciel.",
            },
          ].map((f) => (
            <div key={f.t} className="surface p-6">
              <f.icon className="size-6 text-brand-600 dark:text-brand-300" aria-hidden />
              <h2 className="mt-4 font-semibold">{f.t}</h2>
              <p className="mt-2 text-[0.95rem] leading-relaxed text-muted">{f.d}</p>
            </div>
          ))}
        </div>

        <section className="mt-16 grid gap-10 lg:grid-cols-2 lg:items-center [&>*]:min-w-0">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Le secret professionnel respecté par construction</h2>
            <p className="mt-4 leading-relaxed text-muted">
              Les relevés de vos clients ne sont envoyés à aucun serveur : ni le nôtre, ni celui d&apos;un sous-traitant d&apos;IA. Relevéo
              n&apos;est donc pas destinataire de ces données. C&apos;est un argument simple à expliquer à vos clients et à documenter dans
              votre registre des traitements.
            </p>
            <ul className="mt-6 grid gap-2.5">
              {[
                "Pas de téléversement, pas de stockage de pièces",
                "Aucune connexion aux comptes bancaires",
                "Rapport de contrôle imprimable à joindre au dossier",
              ].map((t) => (
                <li key={t} className="flex gap-2.5">
                  <Check className="mt-0.5 size-5 shrink-0 text-emerald-600" aria-hidden />
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="surface p-6 font-mono text-xs leading-relaxed">
            <p className="mb-2 font-sans text-sm font-semibold">Extrait d&apos;export « Écritures (colonnes FEC) » — données fictives</p>
            <div className="overflow-x-auto">
              <pre className="text-muted">{`JournalCode  EcritureDate  CompteNum  EcritureLib                     Debit    Credit
BQ           20260803      512000     VIR SEPA RECU /DE ACME CONSEIL  1850,00  0,00
BQ           20260803      471000     VIR SEPA RECU /DE ACME CONSEIL  0,00     1850,00
BQ           20260805      512000     PRLV SEPA EDF                   0,00     78,40
BQ           20260805      471000     PRLV SEPA EDF                   78,40    0,00`}</pre>
            </div>
          </div>
        </section>

        <section className="mx-auto mt-16 max-w-3xl">
          <h2 className="text-2xl font-bold tracking-tight">Questions des cabinets</h2>
          <div className="mt-6">
            <Faq
              items={[
                {
                  q: "Le fichier « écritures » est-il un FEC conforme ?",
                  a: "Non : c'est un journal de banque au format de colonnes du FEC, pratique pour l'import. Le FEC réglementaire est produit par votre logiciel de comptabilité, à partir de l'ensemble de vos écritures.",
                },
                {
                  q: "Puis-je changer les comptes 512000 / 471000 ?",
                  a: "Oui : au moment de l'export « Écritures », vous choisissez le code journal, le compte de banque (par ex. 512100 pour un second compte) et le compte d'attente.",
                },
                {
                  q: "Plusieurs collaborateurs peuvent-ils utiliser le même compte ?",
                  a: "Un compte correspond à une adresse e-mail. Les comptes multi-utilisateurs ne sont pas encore disponibles : écrivez-nous via la page [Contact](/contact) si c'est un besoin pour votre cabinet.",
                },
                {
                  q: "Que se passe-t-il si un relevé n'est pas bien lu ?",
                  a: "Le contrôle de solde le signale. Vous pouvez corriger la ligne dans le tableau, ou nous envoyer un signalement anonyme (structure du relevé uniquement, jamais son contenu) pour que nous améliorions la lecture.",
                },
              ]}
            />
          </div>
        </section>
      </div>
    </>
  );
}
