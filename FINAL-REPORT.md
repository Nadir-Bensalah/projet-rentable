# FINAL REPORT — Relevéo

*24 septembre 2026. Branche : `claude/projet-rentable-nsntwo`. Tout ce qui suit est vérifiable dans le dépôt ; les chiffres de marché viennent de sources publiques citées dans `business/MARKET.md` et n'ont pas été vérifiés indépendamment ; **aucun utilisateur, trafic ou revenu réel n'existe (non observé)**.*

---

## 1. Ce que j'ai créé
**Relevéo**, un business numérique complet : un convertisseur de relevés bancaires PDF (→ Excel, CSV, OFX, QIF, JSON, journal de banque 512/471 aux colonnes FEC) qui lit le PDF **dans le navigateur** (le fichier n'est jamais envoyé) et **prouve** que la conversion est complète : solde de départ + crédits − débits = solde final, au centime.

Livrables :
- Application web de production (Next.js 16, Postgres), avec comptes, facturation, e-mails, analytics, SEO, pages légales, outils gratuits, tableau de bord.
- Moteur d'extraction de relevés maison, testé sur 23 mises en page PDF (8 synthétiques + 14 construites par l'équipe QA indépendante + 1 scan).
- 17 documents business dans `business/` + 4 kits d'acquisition prêts à l'emploi dans `business/assets/`.
- Déploiement : `Dockerfile` (image construite et démarrée avec succès), `render.yaml`, CI GitHub Actions, tâche planifiée quotidienne.
- Suite de tests : 87 tests unitaires/intégration + 76 tests E2E navigateur.

## 2. Pourquoi ce business
- 4 agents de recherche ont exploré ~45 opportunités (B2B international, réglementaire FR/UE, produits numériques/lead-gen, plaintes réelles). 8 finalistes ont été soumis à une **red team business** qui a éliminé 6 idées (monitoring SSL, kit loi Le Meur, outils KML, API facture électronique, QR codes, conversion Publisher).
- Relevéo est le seul finaliste qui combine : **disposition à payer prouvée publiquement**, **coût marginal nul** (le calcul est chez le client), **construisible et opérable sans humain** (pas de vente, peu de support), et un **angle différenciant défendable** face aux clones : la preuve au centime + la confidentialité vérifiable + le workflow cabinet.
- Option de repli documentée (app Atlassian Forge) et critère d'arrêt fixé à l'avance (J+90). Détails : `business/DECISIONS.md`.

## 3. Preuves de marché trouvées
- Leader anglophone BankStatementConverter : 1 k$ MRR (2022, billet du fondateur), 12,5 k$ (nov. 2023), 16 k$ (janv. 2025), « 38–40 k$ » (2026, source secondaire) ; acquisition à 0 $ via SEO/Hacker News.
- Prix pratiqués : 29/59/99 $/mois, 15–50 $/mois, 15 $/75 pages.
- Signaux de demande : Wave a retiré l'export des comptes gratuits ; Dext facture désormais par client.
- **Contre-preuves prises en compte** : ≥ 12 outils FR, « privacy-first » déjà revendiqué, export CSV natif des banques sur 12–26 mois, IA généralistes, baisse du CTR due aux AI Overviews. D'où le recentrage sur la preuve et les cabinets.
Sources complètes : `business/MARKET.md`, `business/COMPETITORS.md`.

## 4. Concurrents
BankStatementConverter, yourbankstatementconverter, bankstmtconverter, securebankconverter, bankconverter.io, DocuClipper (EN) ; ofyx.fr, convertisseur-releve-bancaire.fr, EasyBankConvert, statementsheet, ScanCompte, macompta (FR). Substituts : export natif bancaire, synchronisation DSP2 des logiciels comptables, OCR intégrés, IA généralistes, saisie manuelle. Voir `business/COMPETITORS.md`.

## 5. Comment le business gagne de l'argent
Freemium à l'usage (la **page PDF exportée**) : un gratuit récurrent qui acquiert et active, un **pack sans abonnement** qui monétise les besoins ponctuels, des **abonnements** qui monétisent les professionnels. Encaissement via un *merchant of record* (Lemon Squeezy recommandé : gère la TVA mondiale) ou Stripe, commutable par configuration. Coût variable par conversion : 0 € ; marge brute estimée > 90 % (`business/UNIT-ECONOMICS.md`).

## 6. Pricing
| Offre | Prix TTC | Pages | Inclus |
|---|---|---|---|
| Gratuit | 0 € | 15/mois | Excel + CSV (FR), un relevé à la fois |
| Pack 150 pages | 15 € une fois | 150, 12 mois | Tous formats, lots, fusion, rapport |
| Pro | 12 €/mois · 120 €/an | 400/mois | Tous formats, lots, fusion, rapport |
| Cabinet | 39 €/mois · 390 €/an | 2 500/mois | Tout Pro + support prioritaire |
Ré-export du même relevé gratuit pendant le mois (plafonné). Source unique : `src/config/plans.ts`.

## 7. Client cible
1. **Cabinets comptables / bookkeepers** recevant des relevés PDF de clients (revenu récurrent, plan Cabinet).
2. **Indépendants / micro-entrepreneurs** (gratuit → pack/Pro).
3. **Particuliers** à besoin ponctuel (prêt, succession, compte clôturé) (pack).
Aucun client interviewé (non observé) : hypothèses et expériences de validation dans `business/CUSTOMER.md` et `business/EXPERIMENTS.md`.

## 8. Produit construit
- **Convertisseur** (`/convertir`) : glisser-déposer jusqu'à 24 PDF, PDF protégés par mot de passe (saisi localement), progression par page, tableau éditable (modifier, inverser le sens, exclure, supprimer avec annulation, ajouter), carte de rapprochement (vérifié / écart avec montant / non vérifiable avec saisie manuelle des soldes), remarques de lecture, détection des scans et doublons, persistance locale de l'onglet, relevé d'exemple fictif, signalement anonyme de mise en page, rapport de contrôle imprimable.
- **Export** : 7 formats générés dans le navigateur ; lots fusionnés (sans doublons) ou en .zip ; journal 512/471 paramétrable.
- **Comptes** : inscription, confirmation d'e-mail (reprise automatique de l'export dans l'onglet d'origine), connexion, mot de passe oublié/réinitialisation, changement de mot de passe, déconnexion des autres appareils, profil, export RGPD (JSON), suppression de compte (résiliation incluse).
- **Monétisation** : paywall contextuel, checkout, succès/échec/annulation, portail client, renouvellement, impayé, résiliation, expiration, remboursement, factures, idempotence des webhooks, quotas transactionnels.
- **Marketing/SEO** : accueil, tarifs, cabinets, confidentialité, comparatif, 5 pages formats, 7 guides, 2 outils gratuits, parrainage, contact, 6 pages légales, sitemap, robots, JSON-LD, OG.
- **Admin** : `/admin` (entonnoir, MRR, revenus, rétention, qualité de lecture, sources).

## 9. Fonctionnalités (vérifiées par tests automatiques)
Voir la liste des tests E2E dans `tests/e2e/*.spec.ts` : chaque parcours ci-dessus est exécuté dans Chromium sur le build de production (desktop et mobile).

## 10. Architecture
- **Front + API** : Next.js 16 (App Router), React 19, Tailwind 4 ; pages marketing pré-rendues statiquement ; convertisseur client.
- **Moteur** (`src/lib/statement/`) : pdf.js (worker auto-hébergé) → items positionnés → lignes/cellules (re-jointure des milliers) → détection des en-têtes, dates (FR/US/UK, années manquantes), montants (virgule/point, signes, parenthèses, CR/DB), colonnes (clustering + recherche d'attribution validée par le solde), soldes, sous-totaux, libellés multi-lignes (centrés/alignés, sauts de page) → rapprochement → exports.
- **Données** : Postgres, SQL paramétré sans ORM, migrations SQL (`migrations/`). Aucun contenu de relevé stocké.
- **Couches remplaçables par configuration** : paiement (`mock` | `stripe` | `lemonsqueezy`), e-mail (`console` | `smtp` | `resend`), analytics (first-party + Plausible optionnel).
- **Sécurité** : scrypt (concurrence bornée), sessions à jeton haché + cookie `__Host-`, contrôle d'origine strict, rate limiting Postgres, CSP (`connect-src 'self'`), en-têtes durcis, clés dérivées par usage, refus de démarrer en production mal configurée.

## 11. Acquisition
Plan à 0 € et actifs prêts : SEO transactionnel + contenus, outils gratuits (aimants à liens), posts de lancement (Show HN, Indie Hackers, communautés FR, LinkedIn), séquence de prospection cabinets (3 e-mails + LinkedIn + objections), liste d'annuaires, 12 posts sociaux, parrainage intégré, e-mails lifecycle. Calendrier des 30 premiers jours : `business/ACQUISITION.md`.

## 12. SEO
Architecture par intention (outil, formats, guides, outils, commercial), métadonnées uniques testées, canonicals, sitemap validé (toutes URL en 200), robots, noindex des espaces privés, JSON-LD (SoftwareApplication, Organization, FAQPage, BreadcrumbList, Article), OG image, maillage interne. Pas de pages générées en masse. Volumes de mots-clés **non mesurés** (aucun outil accessible) : à valider dans Search Console. `business/SEO.md`.

## 13. Tests effectués
| Niveau | Contenu | Résultat |
|---|---|---|
| Unitaires | montants, dates, banques, rapprochement, exports (CSV/XLSX/OFX/QIF/FEC/JSON, injection de formules, noms de fichiers), 9 PDF synthétiques, 14 PDF QA | ✅ |
| Intégration (Postgres réel) | quotas, concurrence (verrous), ré-exports, webhooks mock/Stripe/Lemon Squeezy (signatures, idempotence, ordre, mode test), cycle d'abonnement, remboursements, parrainage | ✅ |
| **Total Vitest** | **87 tests** | **87/87** |
| E2E Playwright (build de production) | conversion, édition, uploads, doublons, persistance, non-envoi du PDF, inscription dans la boîte de dialogue + reprise après confirmation, paywall, achat pack, abonnement + portail, fusion, auth, reset, RGPD, suppression, admin, sécurité (en-têtes, CSRF, rate limiting, webhooks, redirections, jetons), SEO (20 pages), accessibilité axe WCAG 2.1 AA (clair/sombre), clavier, mobile 360–412 px | **76/76** |
| Docker | image construite et démarrée, migrations appliquées, `/api/health` OK | ✅ |
| Lighthouse (mobile) | voir §17 | ✅ |

## 14. Résultats QA
Équipe QA indépendante (sans supposer que le produit fonctionne) : **20 défauts** remontés (5 majeurs, 14 mineurs, 1 cosmétique) sur le moteur (sous-totaux de page, milliers séparés, devise, colonnes d'en-tête alignées à gauche, libellés centrés, parenthèses), les pages légales (identité vide, Markdown brut), l'UX (effacement sans confirmation, suppression sans annulation), le mobile (débordements), l'accessibilité clavier, l'affichage de la facturation et des textes. **Tous corrigés** ; les PDF de la QA sont devenus des tests de non-régression (`tests/fixtures/qa/`). Un seul écart de « vérité terrain » QA a été jugé erroné (texte réellement imprimé dans un libellé) et documenté dans le test.

## 15. Audit sécurité
Audit indépendant (code + tests dynamiques sur le build de production). **0 critique, 1 haute, 5 moyennes, 7 basses, 9 théoriques/info.** Corrigés : redirection ouverte (caractères de contrôle), verrouillage de compte par un tiers, usurpation d'IP via X-Forwarded-For, lien de vérification servant de connexion (login CSRF), abus du parrainage, rejeu de jetons du bac à sable, limites de taille de corps en streaming, analytics acceptées d'autres origines, suppression/export RGPD incomplets, Host header dans le contrôle d'origine, fuite de messages d'erreur, remboursements Stripe non rattachés, webhooks hors ordre, produit Lemon Squeezy dérivé de données personnalisables, événements en mode test, timing du « mot de passe oublié », nom affiché dans l'e-mail de vérification, dérivation des clés, https obligatoire en production, `worker-src blob:`, liens `//hôte`.
**Risque accepté et documenté** : le calcul étant local, une personne technique peut générer un export sans passer par le serveur (atténué : décompte serveur avant export, empreinte + plafond de ré-exports, pages bornées). C'est la contrepartie directe de la promesse « rien n'est envoyé ». `npm audit` : 0 vulnérabilité.

## 16. Red Team
[Section complétée après la Red Team finale — voir plus bas.]

## 17. Performance
Lighthouse 13 (profil mobile, réseau et CPU bridés), build de production :
| Page | Perf. | Access. | Bonnes pratiques | SEO | FCP | LCP | CLS | TBT |
|---|---|---|---|---|---|---|---|---|
| `/` | 93 | 100 | 100 | 100 | 0,9 s | 3,1 s | 0 | 130 ms |
| `/convertir` | 96 | 100 | 100 | 100 | 0,8 s | 2,7 s | 0 | 60 ms |
| `/tarifs` | 94 | 100 | 100 | 100 | 0,8 s | 2,9 s | 0 | 70 ms |
| `/cabinets-comptables` | 96 | 100 | 100 | 100 | 0,8 s | 2,8 s | 0 | 60 ms |
| `/guides/rapprochement-bancaire` | 95 | 100 | 100 | 100 | 0,9 s | 2,9 s | 0 | 40 ms |
| `/outils/verification-solde` | 95 | 100 | 100 | 100 | 0,8 s | 2,9 s | 0 | 40 ms |
Moteur : un relevé de 28 pages / 1 250 opérations est lu en ~2,5 s (mesure QA) ; pdf.js n'est chargé que dans le convertisseur.

## 18. État prod-ready
[Section complétée après la Red Team finale.]

## 19. Ce qui est réellement mesuré
- **Mesuré dans cet environnement** : résultats de tests, temps de lecture de PDF synthétiques, scores Lighthouse, taille de l'image Docker (357 Mo), absence de requête transportant le PDF (test E2E).
- **Instrumenté mais jamais observé** (aucun trafic) : visiteurs, CTA, fichiers déposés, lectures réussies/échouées, inscriptions, activation, paywall, checkout, paiements, MRR, churn, rétention, sources. Le tableau de bord `/admin` les calculera à partir de données réelles dès la mise en ligne.
- **Non mesuré** : volumes de recherche, taux de conversion, taux de lecture sur de vrais relevés bancaires (aucun vrai relevé disponible).

## 20. Revenu réel
**0 €.** Aucun paiement réel n'a eu lieu (paiements exécutés uniquement dans le bac à sable de test).

## 21. Actions externes strictement impossibles à effectuer par l'agent
Détail et ordre : `business/EXTERNAL-ACTIONS.md`.
1. **Autoriser l'accès GitHub** (push refusé en 403 : l'app GitHub de Claude n'est pas installée/connectée pour ce dépôt) — ou pousser vous-même la branche.
2. Immatriculer la micro-entreprise (identité, SIREN).
3. Acheter le domaine + recherche d'antériorité de marque (paiement, identité).
4. Créer la base Postgres (Neon) et l'hébergement (Render) — comptes à votre nom.
5. Ouvrir le compte de paiement (Lemon Squeezy ou Stripe : KYC), créer les produits/prix et le webhook.
6. Créer le compte d'envoi d'e-mails (Resend) et configurer SPF/DKIM/DMARC.
7. Compléter l'identité légale (variables `NEXT_PUBLIC_LEGAL_*`), faire valider les 6 pages légales, désigner un médiateur de la consommation.
8. Test d'achat réel puis remboursement ; Search Console ; secrets GitHub du cron.
9. Publier les posts et envoyer la prospection sous votre identité.

## 22. Instructions de mise en production (ordre exact)
```bash
# 0. Récupérer le code (après avoir rétabli l'accès GitHub)
git clone https://github.com/Nadir-Bensalah/projet-rentable && cd projet-rentable
git checkout claude/projet-rentable-nsntwo

# 1. Vérifications locales (Postgres 16 local)
npm ci
createdb releveo_test && createdb releveo_e2e
npm run lint && npm run typecheck && npm test
npm run build:e2e && npx playwright test

# 2. Secrets
openssl rand -base64 48   # -> AUTH_SECRET
openssl rand -hex 32      # -> CRON_SECRET
```
3. **Neon** : créer le projet (région UE) → copier `DATABASE_URL` (`sslmode=require`).
4. **Lemon Squeezy** : produits « Pack 150 pages » (15 €) et abonnement (variantes 12 €/mois, 120 €/an, 39 €/mois, 390 €/an) ; clé API ; webhook `https://{domaine}/api/webhooks/lemonsqueezy` (order_created, order_refunded, subscription_created/updated/cancelled/resumed/expired/paused/unpaused, subscription_payment_success/failed/recovered) → noter store id, 5 variant ids, secret.
5. **Resend** : domaine d'envoi vérifié (SPF/DKIM/DMARC) → `RESEND_API_KEY`.
6. **Render** : New → Blueprint → ce dépôt (`render.yaml`) → renseigner les variables (liste complète : `business/LAUNCH.md`) avec `PAYMENT_MODE=test` → Deploy (le conteneur applique les migrations puis démarre).
7. Domaine personnalisé sur Render + DNS ; mettre `APP_URL`/`NEXT_PUBLIC_APP_URL=https://{domaine}` puis redéployer (les pages statiques embarquent l'URL canonique au build).
8. `curl https://{domaine}/api/health` → `{"status":"ok"}`.
9. Créer votre compte avec l'e-mail de `ADMIN_EMAILS`, confirmer l'e-mail, ouvrir `/admin`.
10. Envoyer un webhook de test depuis Lemon Squeezy → 200. Acheter le pack en mode test, vérifier crédits/e-mail/commande ; tester abonnement + portail.
11. Passer `PAYMENT_MODE=live`, redéployer, achat réel à 15 € puis remboursement → crédits retirés.
12. Search Console : soumettre `https://{domaine}/sitemap.xml`.
13. GitHub → Settings → Secrets : `APP_URL`, `CRON_SECRET` (tâche `.github/workflows/cron.yml`).
14. Lancer l'acquisition (`business/ACQUISITION.md`, textes dans `business/assets/`).

## 23. Temps humain minimal estimé pour les actions externes
**≈ 5 à 7 heures** de travail effectif (hors délais d'immatriculation et hors relecture par un juriste), puis ~30 min/jour de prospection pendant le premier mois.

## 24. Prochaine étape économique recommandée
Mettre en ligne en mode test sous 48 h, puis **acquérir les 10 premiers cabinets clients par prospection directe** (séquence prête, mois d'essai Cabinet offert) : c'est le canal le plus rapide vers un revenu récurrent (39 €/mois chacun) et la seule source de *vrais relevés* pour valider la lecture banque par banque (signalements anonymes). En parallèle : Show HN + Indie Hackers la première semaine, Search Console dès J0, décision de continuation à J+90 selon le critère documenté (≥ 10 clients payants ou progression organique mesurable).
