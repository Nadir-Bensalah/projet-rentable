import { Check, Lock, Server, ShieldCheck, X } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/marketing/page-header";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Confidentialité : votre relevé ne quitte pas votre ordinateur",
  description:
    "Comment Relevéo convertit vos relevés bancaires sans jamais les recevoir : lecture locale par le navigateur, politique de sécurité stricte, données minimales. Et comment le vérifier.",
  alternates: { canonical: "/securite" },
};

export default function SecurityPage() {
  return (
    <>
      <PageHeader
        eyebrow="Confidentialité et sécurité"
        title="Votre relevé ne quitte pas votre ordinateur."
        lead="Un relevé bancaire est l'un des documents les plus sensibles que vous possédez. Relevéo a été conçu pour ne jamais en avoir besoin sur ses serveurs."
        breadcrumbs={[
          { href: "/", label: "Accueil" },
          { href: "/securite", label: "Confidentialité" },
        ]}
      />
      <div className="mx-auto grid max-w-4xl gap-12 px-4 py-12 sm:px-6">
        <section className="grid gap-6 md:grid-cols-2">
          <div className="surface p-6">
            <h2 className="flex items-center gap-2 font-bold">
              <Check className="size-5 text-emerald-600" aria-hidden /> Ce qui reste sur votre appareil
            </h2>
            <ul className="mt-4 grid gap-2 text-[0.97rem] text-muted">
              {[
                "Le fichier PDF",
                "Les libellés des opérations",
                "Les montants et les soldes",
                "Votre nom, votre adresse, votre IBAN",
                "Le fichier Excel, CSV ou OFX produit",
                "Le mot de passe d'un PDF protégé",
              ].map((t) => (
                <li key={t}>• {t}</li>
              ))}
            </ul>
          </div>
          <div className="surface p-6">
            <h2 className="flex items-center gap-2 font-bold">
              <Server className="size-5 text-brand-600 dark:text-brand-300" aria-hidden /> Ce que reçoit notre serveur
            </h2>
            <p className="mt-4 text-[0.97rem] text-muted">Uniquement au moment d&apos;un téléchargement, pour décompter vos pages :</p>
            <ul className="mt-2 grid gap-2 text-[0.97rem] text-muted">
              {[
                "Le nombre de pages du relevé",
                "Une empreinte SHA-256 du fichier (elle ne permet pas de reconstituer son contenu ; elle sert à ne pas facturer deux fois le même relevé)",
                "Le format choisi, le nom de la banque reconnue et le résultat du contrôle (vérifié / écart / non vérifiable)",
              ].map((t) => (
                <li key={t}>• {t}</li>
              ))}
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold tracking-tight">Comment c&apos;est possible</h2>
          <div className="prose-content mt-4">
            <p>
              La lecture du PDF est faite par <strong>pdf.js</strong>, la bibliothèque libre qui affiche les PDF dans Firefox, exécutée dans
              l&apos;onglet de votre navigateur. L&apos;analyse des colonnes, le contrôle des soldes et la création du fichier d&apos;export
              sont faits par le code de la page, sur votre appareil.
            </p>
            <p>
              Le site applique une <strong>politique de sécurité du contenu</strong> (Content-Security-Policy) qui n&apos;autorise les
              connexions que vers notre propre domaine : même par erreur, le code de la page ne peut pas envoyer vos données vers un service
              tiers, une IA externe ou une régie publicitaire.
            </p>
            <p>
              Votre conversion en cours est gardée dans la mémoire de l&apos;onglet (stockage de session du navigateur) pour survivre à un
              rechargement ou à un paiement ; elle disparaît quand vous fermez l&apos;onglet ou cliquez sur « Tout effacer ».
            </p>
          </div>
        </section>

        <section className="surface p-6 sm:p-8">
          <h2 className="flex items-center gap-2 text-xl font-bold">
            <ShieldCheck className="size-6 text-emerald-600" aria-hidden /> Vérifiez-le vous-même en 1 minute
          </h2>
          <ol className="mt-4 grid list-decimal gap-2 pl-5 text-[0.97rem] text-muted">
            <li>
              Ouvrez la page{" "}
              <Link className="font-medium text-brand-600 underline dark:text-brand-300" href="/convertir">
                Convertir
              </Link>
              .
            </li>
            <li>
              Ouvrez les outils de développement de votre navigateur (touche F12) puis l&apos;onglet <strong>Réseau</strong>.
            </li>
            <li>
              Déposez un relevé : aucune requête ne transporte votre fichier. Les seules requêtes vers notre serveur sont de petits messages
              (mesure d&apos;audience, compte) sans le contenu du relevé.
            </li>
            <li>
              Pour aller plus loin : une fois la page chargée, coupez votre connexion Internet et déposez un relevé. La lecture et le
              contrôle fonctionnent quand même.
            </li>
          </ol>
        </section>

        <section>
          <h2 className="text-2xl font-bold tracking-tight">Nos autres engagements</h2>
          <ul className="mt-5 grid gap-3 text-[0.97rem]">
            {[
              "Mots de passe hachés avec scrypt, jamais stockés en clair",
              "Sessions protégées (cookie httpOnly, Secure, SameSite), déconnexion à distance de vos appareils",
              "Paiement géré par un prestataire spécialisé : vos données de carte ne passent jamais par Relevéo",
              "Aucun cookie publicitaire, aucun traceur tiers ; mesure d'audience interne désactivable",
              "Export de toutes vos données de compte et suppression du compte en libre-service",
            ].map((t) => (
              <li key={t} className="flex gap-3">
                <Lock className="mt-0.5 size-5 shrink-0 text-brand-600 dark:text-brand-300" aria-hidden />
                {t}
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-[var(--border)] p-6">
          <h2 className="flex items-center gap-2 font-bold">
            <X className="size-5 text-rose-600" aria-hidden /> Ce que Relevéo ne fait pas
          </h2>
          <p className="mt-2 text-[0.97rem] text-muted">
            Pas de connexion à votre banque, pas d&apos;accès à vos comptes, pas d&apos;IA externe, pas de revente de données. Relevéo
            n&apos;a besoin que du PDF que vous choisissez de déposer — et ne le reçoit même pas.
          </p>
        </section>

        <div className="flex justify-center">
          <ButtonLink href="/convertir" size="lg" data-cta="security-convert">
            Convertir un relevé en toute confidentialité
          </ButtonLink>
        </div>
      </div>
    </>
  );
}
