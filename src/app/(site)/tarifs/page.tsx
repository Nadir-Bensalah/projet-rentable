import type { Metadata } from "next";
import { Faq } from "@/components/marketing/faq";
import { PageHeader } from "@/components/marketing/page-header";
import { PricingTable } from "@/components/billing/pricing-table";
import { PricingNotice } from "@/components/billing/pricing-notice";
import { FREE_MONTHLY_PAGES, PACK, PLANS, formatPrice } from "@/config/plans";
import type { FaqItem } from "@/content/types";

export const metadata: Metadata = {
  title: "Tarifs — gratuit, pack sans abonnement ou forfait mensuel",
  description: `${FREE_MONTHLY_PAGES} pages gratuites par mois. Pack de ${PACK.pages} pages à ${formatPrice(PACK.price)} sans abonnement, ou forfait Pro à ${formatPrice(PLANS.pro.priceMonthly)} par mois. Sans engagement.`,
  alternates: { canonical: "/tarifs" },
};

const FAQ: FaqItem[] = [
  {
    q: "Comment sont comptées les pages ?",
    a: "Une page = une page du relevé PDF que vous exportez. Un relevé de 3 pages consomme 3 pages. Ré-exporter le même relevé dans un autre format pendant le même mois ne consomme rien.",
  },
  {
    q: "Que se passe-t-il si je dépasse mon forfait ?",
    a: "Rien n'est facturé automatiquement. Relevéo vous propose d'acheter un pack ou de changer d'offre, et vous pouvez aussi attendre le mois suivant.",
  },
  {
    q: "Puis-je résilier à tout moment ?",
    a: "Oui. La résiliation se fait en deux clics depuis votre espace, rubrique Abonnement. Vous gardez l'accès jusqu'à la fin de la période payée.",
  },
  {
    q: "Les pages non utilisées sont-elles reportées ?",
    a: `Les pages mensuelles de votre forfait ne sont pas reportées. Les pages d'un pack restent disponibles ${PACK.validityMonths} mois.`,
  },
  {
    q: "Qui encaisse le paiement ?",
    a: "Le paiement est traité par notre prestataire de paiement sécurisé. Vos coordonnées bancaires ne transitent jamais par Relevéo. Vous recevez une facture par e-mail.",
  },
  {
    q: "Proposez-vous un remboursement ?",
    a: "Oui, selon notre [politique de remboursement](/remboursement) : un pack non utilisé est remboursé sur demande dans les 14 jours.",
  },
];

export default function PricingPage() {
  return (
    <>
      <PageHeader
        eyebrow="Tarifs"
        title="Payez uniquement ce que vous convertissez."
        lead="Commencez gratuitement. Un besoin ponctuel ? Un pack sans abonnement. Un usage régulier ? Un forfait mensuel, résiliable à tout moment."
      />
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <PricingNotice />
        <PricingTable />
      </div>
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <h2 className="text-2xl font-bold tracking-tight">Questions sur les tarifs</h2>
        <div className="mt-6">
          <Faq items={FAQ} />
        </div>
      </div>
    </>
  );
}
