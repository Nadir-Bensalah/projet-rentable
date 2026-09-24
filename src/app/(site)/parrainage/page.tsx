import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/marketing/page-header";
import { ButtonLink } from "@/components/ui/button";
import { REFERRAL_REWARD_PAGES } from "@/config/plans";
import { MAX_REFERRAL_REWARDS } from "@/lib/referral-rules";

export const metadata: Metadata = {
  title: "Parrainage : des pages offertes pour vous et vos proches",
  description: `Invitez un collègue ou un client : quand il confirme son compte, vous recevez chacun ${REFERRAL_REWARD_PAGES} pages de conversion offertes.`,
  alternates: { canonical: "/parrainage" },
};

export default function ReferralPage() {
  return (
    <>
      <PageHeader
        eyebrow="Parrainage"
        title={`${REFERRAL_REWARD_PAGES} pages offertes pour vous, ${REFERRAL_REWARD_PAGES} pour la personne invitée`}
        lead="Vous connaissez quelqu'un qui recopie ses relevés à la main ? Partagez votre lien personnel."
        breadcrumbs={[
          { href: "/", label: "Accueil" },
          { href: "/parrainage", label: "Parrainage" },
        ]}
      >
        <ButtonLink href="/compte" size="lg" data-cta="referral-get-link">
          Obtenir mon lien
        </ButtonLink>
      </PageHeader>
      <div className="prose-content mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <h2 id="fonctionnement">Comment ça marche</h2>
        <ol>
          <li>
            Copiez votre lien de parrainage depuis votre espace <Link href="/compte">Mon compte</Link>.
          </li>
          <li>La personne crée un compte gratuit avec ce lien, puis confirme son adresse e-mail.</li>
          <li>Vous recevez chacun {REFERRAL_REWARD_PAGES} pages de crédit, valables 12 mois, utilisables avec tous les formats.</li>
        </ol>
        <h2 id="conditions">Conditions</h2>
        <ul>
          <li>
            La récompense est attribuée quand le compte invité confirme son adresse e-mail. Votre propre adresse doit aussi être confirmée.
          </li>
          <li>Jusqu&apos;à {MAX_REFERRAL_REWARDS} parrainages récompensés par compte.</li>
          <li>
            Les comptes créés uniquement pour obtenir des pages (adresses jetables, comptes multiples d&apos;une même personne) peuvent être
            exclus du programme.
          </li>
          <li>Les pages de crédit n&apos;ont pas de valeur monétaire et ne sont pas remboursables.</li>
        </ul>
      </div>
    </>
  );
}
