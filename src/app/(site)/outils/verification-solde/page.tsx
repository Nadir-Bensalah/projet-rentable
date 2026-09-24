import type { Metadata } from "next";
import { PageHeader } from "@/components/marketing/page-header";
import { BalanceChecker } from "@/components/tools/balance-checker";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Vérifier un solde bancaire : calculateur gratuit d'écart",
  description:
    "Solde de départ + opérations = solde final ? Collez vos opérations : le calculateur trouve l'écart et suggère sa cause (ligne manquante, signe inversé, chiffres inversés). Gratuit, sans envoi.",
  alternates: { canonical: "/outils/verification-solde" },
};

export default function BalanceToolPage() {
  return (
    <>
      <PageHeader
        eyebrow="Outil gratuit"
        title="Vérifier un solde et trouver l'écart"
        lead="Collez vos opérations, saisissez les soldes : l'outil calcule l'écart et vous indique la cause la plus probable. Tout se passe dans votre navigateur."
        breadcrumbs={[
          { href: "/", label: "Accueil" },
          { href: "/outils/verification-solde", label: "Vérifier un solde" },
        ]}
      />
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <BalanceChecker />
        <div className="mt-12 rounded-2xl border border-[var(--border)] p-6 sm:flex sm:items-center sm:justify-between sm:gap-6">
          <div>
            <p className="font-semibold">Vos opérations sont dans un relevé PDF ?</p>
            <p className="mt-1 text-sm text-muted">Relevéo les extrait et fait ce contrôle automatiquement, pour chaque relevé.</p>
          </div>
          <ButtonLink href="/convertir" className="mt-4 sm:mt-0" data-cta="tool-balance-convert">
            Convertir un relevé
          </ButtonLink>
        </div>
      </div>
    </>
  );
}
