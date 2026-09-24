# Stratégie d'acquisition (exécutable, 0 € de budget)

Tous les actifs cités existent déjà dans le produit ou dans `business/assets/`. Aucun résultat n'a encore été mesuré (**non observé**) : les objectifs sont des cibles, pas des prévisions.

## Canaux, par ordre de priorité

### 1. SEO « outil » et contenu utile (canal principal, effet à 2–6 mois)
- Pages de conversion par format : `/formats/excel`, `/formats/csv`, `/formats/ofx`, `/formats/qif`, `/formats/ecritures-comptables`.
- Page produit transactionnelle : `/convertir` (l'outil est dans la page : c'est ce que Google classe le mieux pour des requêtes « convertir … »).
- 7 guides : `/guides/*` (pilier « convertir relevé PDF en Excel », rapprochement bancaire, OFX/QIF/CSV, anciens relevés, cabinets comptables, relevés scannés, CSV et point-virgule).
- 2 outils gratuits (aimants à liens) : `/outils/verification-solde`, `/outils/modele-rapprochement-bancaire`.
- Page comparatif honnête : `/comparatif`. Page confiance : `/securite`. Landing B2B : `/cabinets-comptables`.
- Détails techniques et plan de mots-clés : [SEO.md](SEO.md).

### 2. Lancement communautaire (semaines 1–2)
Textes prêts : [assets/launch-posts.md](assets/launch-posts.md).
- Indie Hackers et Hacker News (« Show HN ») : angle technique « conversion 100 % navigateur + preuve comptable », qui a fonctionné pour le leader du marché.
- Communautés FR d'indépendants et micro-entrepreneurs (forums, groupes, subreddits francophones). Règle : répondre à des questions existantes avec une aide réelle, lien seulement quand il est pertinent, jamais de faux comptes ni de faux avis.
- Product Hunt (optionnel, audience anglophone).
- Annuaires d'outils et de SaaS : [assets/directories.md](assets/directories.md).

### 3. Prospection directe des cabinets comptables (revenu récurrent)
- Séquence e-mail de 3 messages + message LinkedIn : [assets/outreach-firms.md](assets/outreach-firms.md).
- Cible : cabinets de 1 à 20 personnes (décisionnaire joignable). Volume réaliste : 10–20 contacts personnalisés par jour ouvré, à la main (pas d'envoi de masse, respect du RGPD B2B : intérêt légitime, désinscription, identification de l'expéditeur).
- Offre d'essai : un mois de plan Cabinet offert (via crédit de pages ajouté par l'administrateur) contre un retour d'expérience et, si le cabinet le souhaite, un signalement anonyme des relevés mal lus.

### 4. Boucles produit
- Parrainage : 30 pages offertes aux deux parties (`/parrainage`, lien dans `/compte`).
- E-mails lifecycle : confirmation, relance d'activation J+2 (cron), alerte 80 % du quota, confirmation d'achat.
- Ré-export gratuit et rapport de contrôle → recommandation naturelle chez les comptables (H).

### 5. Contenu social léger
- 12 idées de posts LinkedIn prêtes : [assets/social-posts.md](assets/social-posts.md).

## Ce que nous ne faisons pas
Pas de spam, pas d'achat de liens, pas de faux avis/témoignages, pas de pages générées en masse (pas de « relevé [banque] [ville] »), pas de publicité payante avant d'avoir mesuré la conversion organique.

## Calendrier des 30 premiers jours après mise en ligne
| Jour | Action |
|---|---|
| J0 | Mise en ligne, Search Console + sitemap, test d'achat réel à 15 € (remboursé) |
| J1–J3 | Posts Indie Hackers / Show HN / 3 communautés FR ; inscription dans 10 annuaires |
| J1–J30 | 10 prospects cabinets par jour (séquence 3 messages) |
| J7 | Premier bilan : entonnoir `/admin`, signalements de relevés mal lus |
| J14 | Publier 2 guides supplémentaires selon les requêtes réelles de Search Console |
| J30 | Décision : doubler le canal le plus efficace, couper le moins efficace ([METRICS.md](METRICS.md)) |
