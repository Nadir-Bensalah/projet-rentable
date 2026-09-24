import type { Metadata } from "next";
import { PageHeader } from "@/components/marketing/page-header";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Relevé PDF vers Excel : comparer les méthodes",
  description:
    "Saisie manuelle, export CSV de la banque, convertisseur en ligne, IA généraliste ou Relevéo : avantages, limites et risques de chaque méthode pour exploiter un relevé bancaire PDF.",
  alternates: { canonical: "/comparatif" },
};

const ROWS: [string, string, string, string, string, string][] = [
  ["Méthode", "Données envoyées à un tiers", "Contrôle d'exhaustivité", "Historique ancien / compte clôturé", "Temps", "Coût"],
  ["Saisie manuelle", "Non", "Manuel (à refaire soi-même)", "Oui", "Long", "Votre temps"],
  ["Export CSV/OFX de la banque", "Non", "Non nécessaire (données natives)", "Souvent limité à une période récente", "Rapide", "Gratuit"],
  ["Convertisseur en ligne avec envoi du fichier", "Oui : le relevé est téléversé", "Variable", "Oui", "Rapide", "Variable"],
  [
    "IA généraliste (chatbot)",
    "Oui : le relevé est transmis au service",
    "Non : risque d'oubli ou d'invention de lignes",
    "Oui",
    "Rapide",
    "Variable",
  ],
  [
    "Relevéo",
    "Non : lecture dans votre navigateur",
    "Oui : contrôle des soldes au centime",
    "Oui",
    "Rapide",
    "Gratuit puis dès 12 €/mois ou 15 € le pack",
  ],
];

export default function ComparePage() {
  return (
    <>
      <PageHeader
        eyebrow="Comparatif"
        title="Relevé PDF vers tableur : quelle méthode choisir ?"
        lead="Il n'y a pas une seule bonne réponse. Voici, honnêtement, ce que permet chaque approche."
        breadcrumbs={[
          { href: "/", label: "Accueil" },
          { href: "/comparatif", label: "Comparatif" },
        ]}
      />
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <div className="overflow-x-auto rounded-2xl border border-[var(--border)]">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-[var(--bg-subtle)]">
              <tr>
                {ROWS[0].map((h) => (
                  <th key={h} scope="col" className="px-4 py-3 font-semibold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {ROWS.slice(1).map((r) => (
                <tr key={r[0]} className={r[0] === "Relevéo" ? "bg-brand-50/60 dark:bg-brand-950/30" : undefined}>
                  {r.map((c, i) =>
                    i === 0 ? (
                      <th key={i} scope="row" className="px-4 py-3 font-semibold">
                        {c}
                      </th>
                    ) : (
                      <td key={i} className="px-4 py-3 text-muted">
                        {c}
                      </td>
                    ),
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="prose-content mt-10">
          <h2 id="banque">Si votre banque propose l&apos;export CSV ou OFX : utilisez-le</h2>
          <p>
            Pour les opérations récentes d&apos;un compte ouvert, l&apos;export natif de votre banque est la meilleure source : gratuit et
            sans conversion. Relevéo est utile quand ce fichier n&apos;existe pas : historique au-delà de la période proposée par la banque,
            compte clôturé, relevés transmis en PDF par un client, banque qui ne propose pas d&apos;export.
          </p>
          <h2 id="ia">Et une IA généraliste ?</h2>
          <p>
            Un assistant conversationnel peut extraire un tableau d&apos;un PDF, mais il transmet le document à un service tiers et ne
            garantit pas l&apos;exhaustivité : une ligne oubliée ou un montant mal recopié ne sera pas signalé. Relevéo refait le calcul de
            la banque pour vous le dire.
          </p>
          <h2 id="en-ligne">Les convertisseurs en ligne</h2>
          <p>
            Beaucoup fonctionnent bien, mais la plupart demandent de téléverser le relevé sur leurs serveurs. Vérifiez leur politique de
            confidentialité, la durée de conservation et le pays d&apos;hébergement avant d&apos;y envoyer un document contenant votre IBAN.
          </p>
        </div>
        <div className="mt-10 flex justify-center">
          <ButtonLink href="/convertir" size="lg" data-cta="compare-convert">
            Essayer Relevéo gratuitement
          </ButtonLink>
        </div>
      </div>
    </>
  );
}
