# Actions externes restantes (propriétaire uniquement)

Uniquement ce qui exige une identité, un contrat, un paiement ou un accès que l'agent n'a pas. Tout le reste est fait. Ordre recommandé, temps estimé entre parenthèses.

| # | Action | Pourquoi l'agent ne peut pas | Temps |
|---|---|---|---|
| 1 | **Donner l'accès GitHub** : connecter GitHub à claude.ai et installer l'app Claude sur le dépôt (https://claude.ai/connect-github), ou pousser la branche vous-même | Push refusé (403) : droit du propriétaire du dépôt | 5 min |
| 2 | **Immatriculer la micro-entreprise** (guichet unique INPI : procedures.inpi.fr), obtenir le SIREN | Identité légale | 30 min + délai administratif |
| 3 | **Acheter le domaine** (ex. releveo.fr / releveo.com, ~10–15 €/an) après vérification de disponibilité et **recherche d'antériorité de marque** INPI/EUIPO | Paiement + identité | 20 min |
| 4 | **Créer la base Postgres** gratuite (Neon, région UE) et copier la chaîne de connexion | Création de compte | 5 min |
| 5 | **Créer le compte Lemon Squeezy** (KYC, compte de versement) ; créer 1 produit « Pack 150 pages » (15 €, paiement unique) et 1 produit abonnement avec 4 variantes (Pro mensuel 12 €, Pro annuel 120 €, Cabinet mensuel 39 €, Cabinet annuel 390 €) ; créer une clé API et un webhook vers `https://{domaine}/api/webhooks/lemonsqueezy` (événements : order_created, order_refunded, subscription_*) ; relever store id, variant ids, secret. *Alternative* : Stripe (5 prix, webhook vers `/api/webhooks/stripe`, portail client activé) | KYC, contrat | 45 min |
| 6 | **Créer le compte Resend** (ou SMTP), vérifier le domaine d'envoi (enregistrements SPF/DKIM/DMARC chez le registrar), créer une clé API | Compte + DNS | 20 min |
| 7 | **Créer le service d'hébergement** (Render : « New Blueprint » sur le dépôt avec `render.yaml`) et saisir les variables d'environnement (voir LAUNCH.md) ; relier le domaine | Compte | 20 min |
| 8 | **Compléter l'identité légale** via les variables `LEGAL_*` (lues à l'exécution ; le serveur refuse de démarrer tant qu'elles manquent) et **faire valider les 6 pages légales** par un professionnel (liste des points ci-dessous) ; désigner un **médiateur de la consommation** (obligatoire pour vendre aux particuliers) | Validation juridique, contrat de médiation | 1–3 h + coût éventuel du juriste/médiateur |
| 9 | **Test d'achat réel** de 15 € avec votre carte, vérifier crédit + e-mail + facture, puis rembourser depuis le tableau de bord du prestataire | Paiement réel | 10 min |
| 10 | **Search Console / Bing Webmaster** : vérifier le domaine, soumettre le sitemap | Propriété du domaine | 15 min |
| 11 | **Secrets GitHub** `APP_URL` et `CRON_SECRET` pour la tâche quotidienne (`.github/workflows/cron.yml`) | Accès au dépôt | 5 min |
| 12 | **Publier les posts de lancement** et commencer la prospection (textes prêts dans `assets/`) avec votre identité | Comptes personnels, identité d'expéditeur | 1 h puis 30 min/jour |

**Temps humain minimal estimé : ≈ 6 à 8 heures** (dont ~1 h de parcours de facturation en mode test) (hors délais administratifs d'immatriculation et hors relecture juridique externe).

## Points juridiques à valider (issus de la rédaction des pages légales)
1. Identité complète (nom, statut, SIREN, adresse, directeur de publication, e-mail de contact).
2. Régime de TVA (franchise art. 293 B) et cohérence avec des prix affichés TTC ; si merchant of record, réécrire les articles 1, 4 et 5 des CGV (le vendeur légal est alors le prestataire).
3. Hébergeurs (application, base) : nom, adresse, téléphone, région UE.
4. Transferts hors UE (prestataire de paiement, e-mail) et garanties.
5. Bases légales RGPD du tableau des traitements.
6. Durées de conservation (messages de contact, signalements, commandes 10 ans).
7. Exemption de consentement CNIL pour la mesure d'audience interne.
8. Clause de rétractation (L221-28 1° / 13°) et **texte de la case de consentement** désormais obligatoire avant le paiement (`src/config/consent.ts`, consentement horodaté en base et confirmé par e-mail), formulaire type de rétractation.
9. Politique de remboursement commerciale (14 jours, seuil de 20 pages).
10. Médiateur de la consommation.
11. Juridiction compétente et plafond de responsabilité B2B.
12. Informations de reconduction (L215-1 / L215-1-1) et garantie de conformité numérique (L224-25-1).
13. Plateforme européenne de règlement en ligne des litiges : toujours applicable ?
14. Relecture complète par un professionnel.
