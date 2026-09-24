# Marché

*Méthode : 4 agents de recherche indépendants (B2B international, réglementation FR/UE, produits numériques, remontée de plaintes réelles) puis une red team. Accès web limité à la recherche (les pages étaient souvent inaccessibles en lecture directe) : les chiffres ci-dessous proviennent d'extraits de résultats de recherche et sont **rapportés par les sources citées**, non vérifiés indépendamment. Les hypothèses sont marquées (H).*

## 1. Portefeuille d'opportunités étudiées (~45 idées, 8 finalistes)

| Opportunité | Verdict | Raison principale |
|---|---|---|
| **Convertisseur de relevés bancaires PDF (Relevéo)** | **Retenue** | Seule à survivre à la red team (5/10) avec une preuve de disposition à payer et un coût marginal nul |
| App Atlassian Forge (niche Confluence/Jira) | Repli (4/10) | Distribution intégrée, mais Atlassian absorbe les manques (Verified Pages) et dépendance plateforme |
| Monitoring SSL/domaines (certificats 47 jours) | Éliminée (3/10) | Certimon gratuit illimité ; alertes manquées = perte de confiance ; support 24/7 impossible |
| Kit conformité meublés de tourisme (loi Le Meur) | Éliminée (3/10) | Airbnb collecte la taxe de séjour et bloque les 120 nuits ; données ouvertes non téléchargeables ici |
| Boîte à outils KML (fin de Google Earth Pro) | Éliminée (2/10) | Alternatives gratuites illimitées ; migration « douce » |
| API facturation électronique UE | Éliminée (2/10) | 166 plateformes agréées en France (dont gratuites) ; Mustang/facturx-engine open source |
| QR codes dynamiques « honnêtes » | Éliminée (1/10) | Gratuits ailleurs (Hovercode) ; modération anti-quishing impossible sans humain |
| Conversion Microsoft Publisher | Éliminée (1/10) | Fin le 1er oct. 2026 : fenêtre fermée ; outils gratuits |
| Générateur DUERP, REP/PPWR, syndic bénévole, e-invoicing Factur-X, cookies/RGPD, templates, job board, annuaires, affiliation… | Éliminées au premier tri | Saturation par des clones gratuits (souvent eux-mêmes générés par IA), régulation, ou acquisition trop lente |

Détails et sources : voir sections suivantes et [COMPETITORS.md](COMPETITORS.md).

## 2. Preuves pour le marché retenu

**Disposition à payer (preuves publiques)**
- BankStatementConverter : 1 k$ MRR en 2022 (billet du fondateur : https://bankstatementconverter.com/blog/posts/2022-02-25-zero-to-one-thousand-mrr/), 12,5 k$ (nov. 2023), 16 k$ (janv. 2025, https://founderreports.com/interview/bank-statement-converter/), « 38–40 k$ » en 2026 selon une source secondaire (https://superframeworks.com/blog/bankconverter). Acquisition annoncée à 0 $ (SEO + HN) : https://www.starterstory.com/stories/bankstatementconverter
- Prix pratiqués : 29/59/99 $/mois (https://bankstatementconverter.org/pricing), 15–50 $/mois (yourbankstatementconverter), 15 $ pour 75 pages (bankstmtconverter).
- Signal de demande : Wave a retiré l'export des transactions des comptes gratuits (https://www.eonebill.ai/blog/is-wave-accounting-still-free-2026), Dext est passé à une tarification par client (bookkeepers).

**Contre-preuves (red team) — prises en compte**
- Au moins 12 outils FR existent (ofyx.fr, convertisseur-releve-bancaire.fr, EasyBankConvert, statementsheet, ScanCompte, macompta gratuit…) ; « privacy-first dans le navigateur » est déjà revendiqué (securebankconverter, bankconverter.io).
- Les banques françaises exportent nativement en CSV/OFX/QIF sur 12 à 26 mois (ex. Banque Populaire : https://www.banquepopulaire.fr/faq-particuliers/comptes-et-documents/operations/comment-exporter-mes-operations/). Le besoin réel se concentre donc sur : historique ancien, comptes clôturés, PDF transmis par des clients à leur comptable, banques étrangères/néobanques, dossiers de prêt (H).
- Les IA généralistes servent de substitut pour les besoins ponctuels.
- Les AI Overviews réduisent le CTR (−58 % en position 1 selon Ahrefs : https://ahrefs.com/blog/ai-overviews-reduce-clicks-update/) ; les requêtes « outil » semblent moins touchées (H).

## 3. Taille et fréquence (hypothèses, non mesurées)
- Cibles récurrentes : cabinets d'expertise comptable et gestionnaires (réception de relevés PDF clients chaque mois), indépendants/micro-entrepreneurs, associations. Nombre exact de cabinets non vérifié ici (H : ~20 000 cabinets en France, à confirmer via l'Ordre des experts-comptables).
- Cibles ponctuelles : particuliers (prêt, succession, litige), qui achètent plutôt un pack.
- Marché international anglophone nettement plus grand (le leader est anglophone) : le moteur gère déjà les formats US/UK ; l'interface est en français en V1 (voir [EXPERIMENTS.md](EXPERIMENTS.md), expérience E6).

## 4. Tendances
- Pression réglementaire sur la dématérialisation (facturation électronique 2026-2027) : accroît l'importance de données bancaires propres pour les TPE (H).
- Méfiance croissante envers l'envoi de documents sensibles à des IA/serveurs tiers : favorable au positionnement « local » (H, à tester : [EXPERIMENTS.md](EXPERIMENTS.md) E2).
