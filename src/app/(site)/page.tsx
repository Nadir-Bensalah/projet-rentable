import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Eye,
  FileSpreadsheet,
  Files,
  Lock,
  MousePointerClick,
  PencilLine,
  Scale,
  ShieldCheck,
  Upload,
  UserRound,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Faq } from "@/components/marketing/faq";
import { JsonLd } from "@/components/marketing/json-ld";
import { HomeNotice } from "@/components/marketing/home-notice";
import { ProductPreview } from "@/components/marketing/product-preview";
import { ButtonLink } from "@/components/ui/button";
import { FREE_MONTHLY_PAGES, PACK, PLANS, formatPrice } from "@/config/plans";
import { absoluteUrl, site } from "@/config/site";
import type { FaqItem } from "@/content/types";

export const metadata: Metadata = {
  description:
    "Convertissez vos relevés bancaires PDF en Excel, CSV, OFX ou écritures comptables. Lecture dans votre navigateur, aucun envoi, contrôle du solde au centime.",
  alternates: { canonical: "/" },
};

const FAQ: FaqItem[] = [
  {
    q: "Mon relevé est-il envoyé sur vos serveurs ?",
    a: "Non. Le PDF est lu par votre navigateur, sur votre appareil. Au moment de l'export, nous recevons seulement le nombre de pages et une empreinte technique du fichier (pour ne pas vous facturer deux fois le même relevé). Les libellés, les montants et votre numéro de compte ne quittent jamais votre ordinateur. Détails sur la page [Confidentialité](/securite).",
  },
  {
    q: "Quelles banques sont compatibles ?",
    a: "Relevéo ne dépend pas d'un modèle par banque : il analyse la mise en page du relevé (dates, colonnes débit/crédit ou montant signé, soldes). Il fonctionne avec les relevés PDF « texte » téléchargés depuis votre espace bancaire. Surtout, il vous dit pour chaque relevé si le résultat est complet grâce à la vérification du solde.",
  },
  {
    q: "Comment savoir si la conversion est juste ?",
    a: "Chaque relevé est contrôlé : solde de départ + crédits − débits doit donner exactement le solde final imprimé par la banque. Si c'est le cas, le relevé est marqué « Vérifié au centime ». Sinon, Relevéo affiche l'écart et vous aide à trouver la ligne en cause.",
  },
  {
    q: "Et les relevés scannés (photos, images) ?",
    a: "Ils ne sont pas pris en charge : un scan ne contient pas de texte, seulement une image. Relevéo vous le signale immédiatement plutôt que de produire des chiffres approximatifs. Téléchargez plutôt la version PDF depuis votre banque en ligne ([voir le guide](/guides/releve-bancaire-scanne-pdf-image)).",
  },
  {
    q: "Qu'est-ce qu'une « page » dans les offres ?",
    a: `Une page de relevé PDF exportée. Un relevé mensuel de particulier fait souvent 1 à 3 pages. Le plan gratuit inclut ${FREE_MONTHLY_PAGES} pages par mois, et ré-exporter le même relevé dans un autre format pendant le mois ne coûte rien (jusqu'à 10 fois).`,
  },
  {
    q: "Puis-je importer le résultat dans mon logiciel de comptabilité ?",
    a: "Oui : Relevéo produit de l'Excel, du CSV (format français ou international), de l'OFX, du QIF, du JSON et un journal de banque en partie double avec les colonnes du FEC. La plupart des logiciels de comptabilité et de budget acceptent au moins l'un de ces formats.",
  },
  {
    q: "Faut-il une carte bancaire pour essayer ?",
    a: "Non. Vous pouvez convertir et vérifier un relevé sans compte. Pour télécharger le fichier, un compte gratuit suffit.",
  },
];

export default function HomePage() {
  return (
    <>
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: site.name,
            applicationCategory: "FinanceApplication",
            operatingSystem: "Web",
            url: absoluteUrl("/"),
            description: site.description,
            inLanguage: "fr-FR",
            offers: [
              { "@type": "Offer", name: "Gratuit", price: "0", priceCurrency: "EUR" },
              { "@type": "Offer", name: PACK.name, price: (PACK.price / 100).toFixed(2), priceCurrency: "EUR" },
              {
                "@type": "Offer",
                name: `${PLANS.pro.name} mensuel`,
                price: (PLANS.pro.priceMonthly / 100).toFixed(2),
                priceCurrency: "EUR",
              },
            ],
          },
          {
            "@context": "https://schema.org",
            "@type": "Organization",
            name: site.name,
            url: absoluteUrl("/"),
            logo: absoluteUrl("/icon.svg"),
          },
        ]}
      />

      <HomeNotice />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="bg-grid pointer-events-none absolute inset-0" aria-hidden />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pb-16 pt-12 sm:px-6 sm:pt-20 lg:grid-cols-[1.05fr_1fr] lg:gap-14 lg:pb-24">
          <div className="animate-fade-up">
            <p className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-1 text-xs font-semibold text-muted shadow-[var(--shadow-soft)]">
              <Lock className="size-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden />
              Traitement 100 % dans votre navigateur
            </p>
            <h1 className="mt-5 text-balance text-4xl font-bold leading-[1.08] tracking-tight sm:text-6xl">
              Vos relevés bancaires PDF en Excel, <span className="text-brand-600 dark:text-brand-300">vérifiés au centime.</span>
            </h1>
            <p className="mt-5 max-w-xl text-pretty text-lg leading-relaxed text-muted">
              Déposez un relevé : Relevéo en extrait toutes les opérations, vérifie que le solde de départ plus les opérations donne bien le
              solde final, puis produit votre fichier Excel, CSV, OFX ou vos écritures comptables. Le fichier ne quitte jamais votre
              ordinateur.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/convertir" size="lg" data-cta="hero-convert" icon={<Upload className="size-5" aria-hidden />}>
                Convertir un relevé gratuitement
              </ButtonLink>
              <ButtonLink
                href="/convertir?exemple=1"
                size="lg"
                variant="secondary"
                data-cta="hero-sample"
                icon={<Eye className="size-5" aria-hidden />}
              >
                Voir avec un exemple
              </ButtonLink>
            </div>
            <ul className="mt-7 grid gap-2 text-sm text-muted sm:grid-cols-3">
              {[`${FREE_MONTHLY_PAGES} pages gratuites / mois`, "Sans carte bancaire", "Aucun fichier envoyé"].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="animate-fade-up [animation-delay:120ms]">
            <ProductPreview />
          </div>
        </div>
      </section>

      {/* Problem */}
      <section className="border-y border-[var(--border)] bg-[var(--bg-subtle)]">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="max-w-2xl text-balance text-2xl font-bold tracking-tight sm:text-3xl">
            Recopier un relevé à la main, c&apos;est long, et une erreur passe vite inaperçue.
          </h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              {
                t: "Le copier-coller casse tout",
                d: "Colonnes décalées, montants collés au libellé, lignes coupées en deux : un PDF n'est pas un tableau.",
              },
              {
                t: "Une ligne oubliée ne se voit pas",
                d: "Sur 80 opérations, une ligne manquante ou un signe inversé fausse tout le mois, sans alerte.",
              },
              {
                t: "Les relevés PDF sont partout",
                d: "Historique ancien, compte clôturé, relevés envoyés par un client, dossier de prêt : souvent, seul le PDF existe.",
              },
            ].map((p) => (
              <div key={p.t} className="surface p-6">
                <h3 className="font-semibold">{p.t}</h3>
                <p className="mt-2 text-[0.97rem] leading-relaxed text-muted">{p.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6" aria-labelledby="how">
        <p className="text-sm font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-300">Comment ça marche</p>
        <h2 id="how" className="mt-2 text-balance text-3xl font-bold tracking-tight sm:text-4xl">
          Trois étapes, moins d&apos;une minute.
        </h2>
        <ol className="mt-12 grid gap-6 md:grid-cols-3">
          {[
            {
              icon: MousePointerClick,
              t: "1. Déposez vos PDF",
              d: "Glissez un ou plusieurs relevés dans la page. S'ils sont protégés par un mot de passe, vous le saisissez localement.",
            },
            {
              icon: Scale,
              t: "2. Vérifiez",
              d: "Les opérations apparaissent dans un tableau, avec le contrôle du solde. Corrigez une cellule ou excluez une ligne si besoin.",
            },
            {
              icon: FileSpreadsheet,
              t: "3. Exportez",
              d: "Excel, CSV, OFX, QIF, JSON ou journal de banque : choisissez le format attendu par votre logiciel.",
            },
          ].map((s) => (
            <li key={s.t} className="surface relative p-6">
              <span className="inline-flex size-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-300">
                <s.icon className="size-5" aria-hidden />
              </span>
              <h3 className="mt-4 text-lg font-semibold">{s.t}</h3>
              <p className="mt-2 leading-relaxed text-muted">{s.d}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Proof */}
      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <div className="surface grid gap-10 overflow-hidden p-8 sm:p-12 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">La différence Relevéo</p>
            <h2 className="mt-2 text-balance text-3xl font-bold tracking-tight">Une preuve, pas une promesse.</h2>
            <p className="mt-4 leading-relaxed text-muted">
              Un convertisseur qui « a l&apos;air de marcher » ne suffit pas quand les chiffres partent en comptabilité. Relevéo refait le
              calcul de la banque : si le solde de départ plus les crédits moins les débits ne tombe pas exactement sur le solde final, vous
              le savez immédiatement, avec l&apos;écart exact.
            </p>
            <ul className="mt-6 grid gap-3 text-[0.97rem]">
              {[
                "Contrôle global du relevé, au centime près",
                "Contrôle ligne par ligne quand le relevé imprime un solde courant",
                "Comparaison avec les totaux imprimés par la banque quand ils existent",
                "Rapport de contrôle imprimable à joindre à votre dossier (offres payantes)",
              ].map((t) => (
                <li key={t} className="flex gap-3">
                  <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="grid gap-3" aria-label="Exemple de contrôle (données fictives)">
            {[
              { l: "Solde de départ", v: "1 520,34 €" },
              { l: "+ Crédits (9 opérations)", v: "4 912,00 €" },
              { l: "− Débits (37 opérations)", v: "3 801,56 €" },
            ].map((r) => (
              <div
                key={r.l}
                className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] px-5 py-4"
              >
                <span className="text-muted">{r.l}</span>
                <span className="tabular font-semibold">{r.v}</span>
              </div>
            ))}
            <div className="flex items-center justify-between rounded-xl border-2 border-emerald-500/60 bg-emerald-50 px-5 py-4 dark:bg-emerald-950/40">
              <span className="font-semibold text-emerald-900 dark:text-emerald-200">= Solde final imprimé</span>
              <span className="tabular flex items-center gap-2 font-bold text-emerald-800 dark:text-emerald-300">
                2 630,78 € <CheckCircle2 className="size-5" aria-label="identique" />
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Privacy */}
      <section className="border-y border-[var(--border)] bg-slate-950 text-slate-100 dark:bg-[#070a10]">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:items-center">
          <div>
            <ShieldCheck className="size-10 text-emerald-400" aria-hidden />
            <h2 className="mt-4 text-balance text-3xl font-bold tracking-tight">Votre relevé ne quitte jamais votre ordinateur.</h2>
            <p className="mt-4 max-w-xl leading-relaxed text-slate-300">
              Un relevé contient votre IBAN, votre adresse, vos salaires et vos dépenses. Relevéo le lit localement, dans l&apos;onglet de
              votre navigateur. Il n&apos;y a pas d&apos;envoi de fichier, pas de stockage, pas d&apos;IA externe qui lit vos données.
            </p>
            <Link href="/securite" className="mt-6 inline-flex items-center gap-1.5 font-semibold text-emerald-300 hover:text-emerald-200">
              Comment le vérifier vous-même <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
          <ul className="grid gap-4 text-[0.97rem]">
            {[
              "Lecture du PDF par votre navigateur (bibliothèque pdf.js)",
              "Politique de sécurité du site qui interdit l'envoi de données vers d'autres domaines",
              "Côté serveur : uniquement le nombre de pages et une empreinte du fichier",
              "Aucun cookie publicitaire, aucun traceur tiers",
            ].map((t) => (
              <li key={t} className="flex gap-3 rounded-xl border border-white/10 bg-white/5 p-4">
                <Lock className="mt-0.5 size-5 shrink-0 text-emerald-400" aria-hidden />
                <span className="text-slate-200">{t}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
          Tout ce qu&apos;il faut pour passer du PDF au tableur.
        </h2>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              icon: FileSpreadsheet,
              t: "7 formats d'export",
              d: "Excel avec vraies dates et vrais nombres, CSV français (point-virgule) ou international, OFX, QIF, JSON, journal 512/471 aux colonnes FEC.",
            },
            {
              icon: Files,
              t: "Plusieurs relevés d'un coup",
              d: "Déposez une année de relevés et obtenez un seul fichier trié, sans doublons entre relevés qui se chevauchent.",
            },
            {
              icon: PencilLine,
              t: "Corrections avant export",
              d: "Modifiez une date, un libellé ou un montant, inversez un signe, excluez une ligne : le contrôle du solde se met à jour.",
            },
            {
              icon: Scale,
              t: "Formats de dates et de montants",
              d: "02/08, 02.08.2026, 2 août 2026, 1 234,56 ou 1,234.56, montants signés ou colonnes débit/crédit, années manquantes complétées.",
            },
            {
              icon: Lock,
              t: "PDF protégés",
              d: "Si votre relevé a un mot de passe, vous le saisissez dans la page : il reste sur votre appareil.",
            },
            {
              icon: Building2,
              t: "Pensé pour les cabinets",
              d: "Traitement par lot, fusion, journal de banque en partie double et rapport de contrôle pour vos dossiers clients.",
            },
          ].map((f) => (
            <div key={f.t} className="rounded-2xl border border-[var(--border)] p-6">
              <f.icon className="size-6 text-brand-600 dark:text-brand-300" aria-hidden />
              <h3 className="mt-4 font-semibold">{f.t}</h3>
              <p className="mt-2 text-[0.97rem] leading-relaxed text-muted">{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Audiences */}
      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {[
            {
              icon: UserRound,
              t: "Indépendants et micro-entrepreneurs",
              d: "Préparez votre livre des recettes, votre déclaration ou le dossier de votre comptable à partir de vos relevés.",
              href: "/guides/convertir-releve-bancaire-pdf-excel",
            },
            {
              icon: Building2,
              t: "Experts-comptables et gestionnaires",
              d: "Les clients envoient des PDF ? Convertissez-les par lot, contrôlés, au format de votre logiciel.",
              href: "/cabinets-comptables",
            },
            {
              icon: FileSpreadsheet,
              t: "Particuliers",
              d: "Budget, dossier de prêt, succession, historique d'un compte clôturé : retrouvez vos opérations dans un tableur.",
              href: "/guides/recuperer-anciens-releves-bancaires",
            },
          ].map((a) => (
            <Link key={a.t} href={a.href} className="group surface flex flex-col p-6 transition-shadow hover:shadow-[var(--shadow-lift)]">
              <a.icon className="size-6 text-brand-600 dark:text-brand-300" aria-hidden />
              <h3 className="mt-4 font-semibold">{a.t}</h3>
              <p className="mt-2 flex-1 text-[0.97rem] leading-relaxed text-muted">{a.d}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-600 group-hover:gap-2 dark:text-brand-300">
                En savoir plus <ArrowRight className="size-4 transition-all" aria-hidden />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Pricing teaser */}
      <section className="border-y border-[var(--border)] bg-[var(--bg-subtle)]">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-8 px-4 py-16 sm:px-6 lg:flex-row lg:items-center">
          <div>
            <h2 className="text-balance text-3xl font-bold tracking-tight">Gratuit pour commencer. Simple ensuite.</h2>
            <p className="mt-3 max-w-2xl leading-relaxed text-muted">
              {FREE_MONTHLY_PAGES} pages gratuites chaque mois. Besoin ponctuel : {PACK.pages} pages pour {formatPrice(PACK.price)}, sans
              abonnement. Usage régulier : {PLANS.pro.name} à {formatPrice(PLANS.pro.priceMonthly)} par mois.
            </p>
          </div>
          <ButtonLink href="/tarifs" size="lg" variant="secondary" data-cta="home-pricing">
            Voir les tarifs <ArrowRight className="size-4" aria-hidden />
          </ButtonLink>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-4 py-20 sm:px-6" aria-labelledby="faq">
        <h2 id="faq" className="text-balance text-3xl font-bold tracking-tight">
          Questions fréquentes
        </h2>
        <div className="mt-8">
          <Faq items={FAQ} />
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl bg-brand-600 px-6 py-14 text-center text-white sm:px-12 dark:bg-brand-700">
          <div className="bg-grid pointer-events-none absolute inset-0 opacity-20" aria-hidden />
          <h2 className="relative text-balance text-3xl font-bold tracking-tight sm:text-4xl">Essayez sur votre prochain relevé.</h2>
          <p className="relative mx-auto mt-3 max-w-xl text-brand-100">
            Sans inscription pour voir le résultat. Sans carte bancaire pour le télécharger.
          </p>
          <div className="relative mt-8 flex justify-center">
            <ButtonLink href="/convertir" size="lg" variant="secondary" className="border-transparent" data-cta="footer-convert">
              Convertir un relevé <ArrowRight className="size-4" aria-hidden />
            </ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}
