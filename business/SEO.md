# SEO

## Architecture (implémentée)
| Type | URL | Intention | Rendu |
|---|---|---|---|
| Accueil | `/` | Marque + « convertir relevé bancaire pdf » | Statique |
| Outil | `/convertir` | Transactionnelle (outil dans la page) | Statique + client |
| Formats | `/formats/{excel,csv,ofx,qif,ecritures-comptables}` | « relevé bancaire pdf en excel/csv/ofx… » | Statique (SSG) |
| Guides | `/guides/{7 slugs}` | Informationnelle (pilier + grappe) | SSG |
| Outils gratuits | `/outils/verification-solde`, `/outils/modele-rapprochement-bancaire` | « vérifier solde », « modèle rapprochement bancaire excel » | Statique |
| Commerciales | `/tarifs`, `/cabinets-comptables`, `/comparatif`, `/securite` | Comparaison / confiance / B2B | Statique |
| Légales | `/mentions-legales`, `/confidentialite`, `/cookies`, `/cgu`, `/cgv`, `/remboursement` | — | SSG |

## Technique (implémenté et testé automatiquement)
- `title` ≤ 75 caractères et `meta description` 50–175 caractères **uniques** par page (test E2E).
- Canonical absolu sur chaque page ; un seul `h1` par page (test E2E).
- `sitemap.xml` (toutes les pages indexables, chaque URL renvoie 200 — test E2E), `robots.txt` (exclut `/api`, `/compte`, `/admin`, `/paiement`).
- `X-Robots-Tag: noindex` sur les espaces privés ; `noindex` sur les pages d'authentification secondaires.
- Données structurées JSON-LD : `SoftwareApplication` (avec offres), `Organization`, `FAQPage`, `BreadcrumbList`, `Article`.
- Open Graph + image OG générée (`/opengraph-image`), manifest, icône SVG.
- Performance : pages marketing pré-rendues statiquement, police auto-hébergée, pdf.js chargé à la demande uniquement dans le convertisseur (voir [../FINAL-REPORT.md](../FINAL-REPORT.md) §17 pour les mesures).
- Maillage : footer (formats, ressources, légal), liens contextuels dans les guides, « À lire aussi », CTA vers `/convertir` dans chaque contenu.

## Cluster de mots-clés ciblés (FR) — volumes non mesurés
Aucun outil de volume (Google Keyword Planner, Ahrefs…) n'était accessible : les priorités sont qualitatives et **à valider dans Search Console** après 4 à 6 semaines.
- Pilier : convertir relevé bancaire pdf en excel · relevé bancaire pdf excel · relevé de compte pdf en excel
- Formats : relevé bancaire pdf en csv · convertir relevé bancaire en ofx · fichier qif relevé · relevé bancaire écritures comptables
- Comptabilité : rapprochement bancaire (définition, méthode, exemple, modèle excel) · importer relevé bancaire logiciel comptable · journal de banque 512 471
- Problèmes : csv excel une seule colonne · csv point virgule virgule décimale · relevé bancaire scanné excel · récupérer anciens relevés bancaires · relevés compte clôturé
- B2B : relevés bancaires pdf clients expert-comptable · saisie relevés bancaires cabinet

## Règles éditoriales
- Une page = une intention réelle, un contenu utile même sans le produit.
- Aucune page générée en masse (pas de combinaisons banque × ville). Pages par banque seulement après validation de la lecture sur de vrais relevés (décision D8).
- Pas d'affirmation invérifiable sur les banques ou les logiciels tiers.
- Mise à jour datée visible (`updated`).

## Actions après mise en ligne (propriétaire, 30 min)
1. Déclarer le domaine dans Google Search Console et Bing Webmaster Tools (vérification DNS).
2. Soumettre `https://{domaine}/sitemap.xml`.
3. Demander l'indexation de `/`, `/convertir`, `/formats/excel`, `/guides/convertir-releve-bancaire-pdf-excel`.
