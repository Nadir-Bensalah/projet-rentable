import Link from "next/link";
import { Logo } from "@/components/logo";

const COLUMNS = [
  {
    title: "Produit",
    links: [
      { href: "/convertir", label: "Convertir un relevé" },
      { href: "/tarifs", label: "Tarifs" },
      { href: "/cabinets-comptables", label: "Pour les cabinets" },
      { href: "/securite", label: "Confidentialité et sécurité" },
      { href: "/parrainage", label: "Parrainage" },
    ],
  },
  {
    title: "Formats",
    links: [
      { href: "/formats/excel", label: "Relevé PDF vers Excel" },
      { href: "/formats/csv", label: "Relevé PDF vers CSV" },
      { href: "/formats/ofx", label: "Relevé PDF vers OFX" },
      { href: "/formats/qif", label: "Relevé PDF vers QIF" },
      { href: "/formats/ecritures-comptables", label: "Écritures comptables" },
    ],
  },
  {
    title: "Ressources",
    links: [
      { href: "/guides", label: "Guides" },
      { href: "/outils/verification-solde", label: "Vérifier un solde (gratuit)" },
      { href: "/outils/modele-rapprochement-bancaire", label: "Modèle de rapprochement" },
      { href: "/comparatif", label: "Comparer les méthodes" },
      { href: "/contact", label: "Contact" },
    ],
  },
  {
    title: "Légal",
    links: [
      { href: "/mentions-legales", label: "Mentions légales" },
      { href: "/confidentialite", label: "Politique de confidentialité" },
      { href: "/cookies", label: "Cookies et mesure d'audience" },
      { href: "/cgu", label: "Conditions d'utilisation" },
      { href: "/cgv", label: "Conditions de vente" },
      { href: "/remboursement", label: "Remboursement" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-[var(--border)] bg-[var(--bg-subtle)] no-print">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.3fr_repeat(4,1fr)]">
        <div className="max-w-xs">
          <Logo />
          <p className="mt-4 text-sm leading-relaxed text-muted">
            Vos relevés bancaires PDF convertis dans votre navigateur et vérifiés au centime. Aucun fichier envoyé.
          </p>
        </div>
        {COLUMNS.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <h2 className="text-sm font-semibold text-[var(--fg)]">{col.title}</h2>
            <ul className="mt-3 grid gap-2">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-muted hover:text-[var(--fg)]">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-[var(--border)]">
        <p className="mx-auto max-w-6xl px-4 py-6 text-xs text-subtle sm:px-6">
          © {new Date().getFullYear()} Relevéo. Outil d&apos;aide à la saisie : vérifiez toujours vos données avant de les utiliser. Relevéo n&apos;est affilié à aucune banque.
        </p>
      </div>
    </footer>
  );
}
