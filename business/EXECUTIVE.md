# Relevéo — Synthèse exécutive

*Dernière mise à jour : 24 septembre 2026. Tous les chiffres de marché ci-dessous viennent de sources publiques citées dans [MARKET.md](MARKET.md) ; aucun chiffre d'usage ou de revenu de Relevéo n'existe encore : **revenu réel = 0 €, utilisateurs réels = 0** (non lancé).*

## En une phrase
Relevéo convertit les relevés bancaires PDF en Excel, CSV, OFX, QIF ou journal comptable **dans le navigateur de l'utilisateur** (le fichier n'est jamais envoyé) et **prouve** que la conversion est complète : solde de départ + opérations = solde final, au centime.

## Pourquoi ce business
- **Besoin payant démontré** : le leader anglophone (BankStatementConverter) est rapporté entre 12,5 k$ et ~38 k$ de MRR, acquis sans publicité (SEO + Hacker News). Des concurrents facturent 15 à 99 $/mois.
- **Coût marginal quasi nul** : tout le calcul est fait chez le client (pas de serveur de conversion, pas d'API d'IA à payer). Marge brute > 90 % après frais de paiement.
- **Construisible et opérable par une IA / un solo** : pas de vente humaine, support faible, pas de stock.
- **Différenciation défendable** face à un marché de clones : (1) la preuve de complétude (contrôle au centime, par ligne et par totaux imprimés), (2) la confidentialité *vérifiable* (CSP `connect-src 'self'`, fonctionne hors ligne), (3) le workflow cabinet comptable (lots, fusion sans doublons, journal 512/471 aux colonnes FEC).

## Ce qui a été construit (V1 commercialisable)
- Moteur d'extraction PDF générique (pdf.js) avec détection de colonnes, dates FR/US/UK, montants signés ou débit/crédit, soldes, report de pages, année manquante, écarts, 7 exports.
- Application web complète : convertisseur, compte, abonnement, paywall, paiement (bac à sable + Stripe + Lemon Squeezy prêts à brancher), e-mails transactionnels et lifecycle, analytics first-party + tableau de bord, SEO (19 pages de contenu + outils gratuits), pages légales (projets à valider), sécurité, RGPD (export, suppression).
- 56 tests unitaires, 12 tests d'intégration sur Postgres, 69 tests E2E navigateur (dont accessibilité WCAG AA et mobile).

## Modèle économique
Freemium à l'usage (pages PDF exportées) : Gratuit 15 pages/mois · Pack 150 pages 15 € (sans abonnement) · Pro 12 €/mois · Cabinet 39 €/mois. Voir [PRICING.md](PRICING.md).

## Acquisition
SEO transactionnel (formats, guides, outils gratuits), lancement communautaire (Indie Hackers, Hacker News, forums/communautés FR d'indépendants et d'experts-comptables), parrainage intégré, prospection e-mail des cabinets (scripts prêts). Voir [ACQUISITION.md](ACQUISITION.md).

## Critères d'arrêt (décidés à l'avance)
À J+90 après mise en ligne : si < 10 clients payants **et** aucune progression organique mesurable (Search Console), pivot vers l'option de repli documentée dans [DECISIONS.md](DECISIONS.md).

## Ce qui reste à l'humain
Uniquement ce qui exige une identité ou un paiement : immatriculation micro-entreprise, compte Lemon Squeezy/Stripe (KYC), domaine, hébergement, e-mail d'envoi, validation juridique, accès GitHub. Liste exacte et ordre : [EXTERNAL-ACTIONS.md](EXTERNAL-ACTIONS.md).
