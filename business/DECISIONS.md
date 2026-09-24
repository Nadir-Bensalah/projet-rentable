# Journal des décisions

| # | Date | Décision | Raison | Réversible ? |
|---|---|---|---|---|
| D1 | 2026-09-24 | Lancer 4 agents de recherche indépendants avant tout code | Consigne : ne pas commencer par coder ; couvrir B2B, réglementaire FR/UE, produits numériques, plaintes réelles | — |
| D2 | 2026-09-24 | Soumettre 8 finalistes à une red team indépendante | Éliminer les idées qui ne résistent pas | — |
| D3 | 2026-09-24 | **Choix : convertisseur de relevés bancaires PDF, recentré sur la preuve (contrôle au centime) et les cabinets** | Seul finaliste avec disposition à payer prouvée publiquement, coût marginal nul, construisible et opérable sans humain ; red team : 5/10 « survit avec un angle net » | Oui (pivot possible) |
| D4 | 2026-09-24 | Option de repli : app Atlassian Forge de niche | 2e survivant (4/10) : distribution intégrée | — |
| D5 | 2026-09-24 | Traitement 100 % navigateur (pdf.js), pas d'upload | Confidentialité vérifiable, coût serveur nul, pas de sous-traitance de données bancaires | Non souhaité |
| D6 | 2026-09-24 | Pas d'OCR en V1 ; message clair pour les scans | OCR navigateur peu fiable ; éviter des chiffres faux | Oui (V2) |
| D7 | 2026-09-24 | Moteur générique + contrôle des soldes plutôt que modèles par banque | Impossible d'obtenir de vrais relevés ici ; le contrôle détecte les lectures incomplètes | Oui |
| D8 | 2026-09-24 | Pas de pages SEO par banque en V1 | Contenu non vérifiable = risque d'inexactitude et de « scaled content abuse » ; à créer quand des signalements réels valideront chaque banque | Oui |
| D9 | 2026-09-24 | Tarification à la page : Gratuit 15 / Pack 150 à 15 € / Pro 12 € / Cabinet 39 € | Voir PRICING.md | Oui |
| D10 | 2026-09-24 | Next.js 16 + Postgres (SQL paramétré, sans ORM) + migrations SQL | Portabilité (Docker, tout hébergeur), transparence, 0 dépendance vulnérable | — |
| D11 | 2026-09-24 | Couche de paiement abstraite : mock (bac à sable), Stripe, Lemon Squeezy | Aucun compte de paiement disponible (KYC) ; bascule par configuration | Oui |
| D12 | 2026-09-24 | Lemon Squeezy recommandé (merchant of record) | Un micro-entrepreneur évite la gestion de la TVA OSS ; réserve sur l'intégration à Stripe | Oui |
| D13 | 2026-09-24 | Analytics first-party sans cookie (sessionStorage), Plausible optionnel | Pas de bannière de consentement (exemption CNIL à confirmer), CSP stricte | Oui |
| D14 | 2026-09-24 | Mots de passe scrypt (Node natif) plutôt qu'argon2 natif | Compatible avec tous les hébergeurs sans binaire natif | Oui |
| D15 | 2026-09-24 | CSP `script-src 'unsafe-inline'` sans nonce | Les nonces forceraient le rendu dynamique de toutes les pages (perte du statique/SEO) ; risque XSS faible (pas de HTML utilisateur) ; `connect-src 'self'` garantit la promesse de confidentialité | Oui |
| D16 | 2026-09-24 | Vérification d'e-mail obligatoire avant le premier téléchargement | Anti-abus du quota gratuit ; la page attend la confirmation et reprend l'export automatiquement | Oui |
| D17 | 2026-09-24 | Interface en français uniquement en V1 | Qualité > couverture ; le moteur gère déjà les formats US/UK (expérience E6) | Oui |
| D18 | 2026-09-24 | Identité légale lue à l'exécution ; démarrage refusé en production si incomplète | Red team finale : les pages légales pré-rendues au build gardaient les placeholders malgré la configuration | Oui |
| D19 | 2026-09-24 | Case obligatoire de demande d'exécution immédiate / renonciation à la rétractation avant tout paiement, consentement horodaté et confirmé par e-mail | Sans elle, chaque vente reste remboursable 14 jours même après usage (L221-28) ; ce n'est pas un dark pattern : texte clair, lien vers les CGV | Oui |
| D20 | 2026-09-24 | En cas de double abonnement, le plus récent est conservé, l'autre résilié automatiquement, le propriétaire alerté pour rembourser le prorata | Éviter toute double facturation sans intervention humaine immédiate | Oui |
| D21 | 2026-09-24 | Accès maintenu 14 jours après l'échéance en cas d'échec de paiement, puis coupé | Laisse le temps des relances du prestataire sans accès gratuit illimité | Oui |
