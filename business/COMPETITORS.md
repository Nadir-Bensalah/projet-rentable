# Concurrence

*Sources : extraits de recherche web (septembre 2026). Les prix et chiffres sont ceux affichés ou rapportés par les sources ; ils peuvent avoir changé.*

## Concurrents directs (convertisseurs de relevés)
| Acteur | Positionnement | Prix observés | Ce qu'on en retient |
|---|---|---|---|
| BankStatementConverter (.com/.org) | Leader anglophone, upload serveur | 29 / 59 / 99 $/mois (https://bankstatementconverter.org/pricing) | Prouve la demande et l'acquisition SEO à 0 $ |
| yourbankstatementconverter | Upload serveur | 15–50 $/mois | Pression prix |
| bankstmtconverter | Crédits | 15 $ / 75 pages | Modèle au pack |
| securebankconverter, bankconverter.io, Digital Tool Pad, QuickBankConvert… | « Ne quitte pas votre appareil » | Variables | L'argument confidentialité seul ne différencie plus |
| Outils FR : ofyx.fr, convertisseur-releve-bancaire.fr, EasyBankConvert (2/jour gratuits), statementsheet, bankstatementwizard/fr, ofxpress.fr, bankgpt.io/fr, ScanCompte, macompta (gratuit) | Marché FR | Gratuit à quelques €/mois | Marché occupé mais aucun n'a été observé mettant en avant un contrôle de solde au centime *et* un journal 512/471 (H, non vérifié exhaustivement) |

## Substituts
- **Export CSV/OFX natif de la banque** : gratuit, mais limité dans le temps (12–26 mois selon les banques) et indisponible pour un compte clôturé ou un relevé transmis en PDF.
- **Synchronisation bancaire des logiciels comptables (DSP2)** : excellente pour l'avenir, inopérante pour l'historique en PDF et les banques non couvertes.
- **OCR intégrés aux logiciels comptables** : existent, mais sans preuve d'exhaustivité (H).
- **IA généraliste** : pratique ponctuellement ; envoie le document à un tiers, pas de contrôle, risque d'hallucination.
- **Saisie manuelle / copier-coller** : le statu quo.

## Où Relevéo gagne
1. **Preuve** : badge « Vérifié au centime », contrôle ligne à ligne sur solde courant, comparaison aux totaux imprimés, rapport imprimable.
2. **Confidentialité vérifiable** : pas d'upload, CSP interdisant toute connexion tierce, fonctionne hors ligne une fois la page chargée.
3. **Workflow cabinet** : lots, fusion sans doublons, journal 512/471 paramétrable aux colonnes FEC.
4. **Prix** : pack sans abonnement (15 €) et Pro à 12 €/mois, sous les prix anglophones.

## Où Relevéo perd (assumé)
- Pas d'OCR pour les scans (V1) — les concurrents avec OCR serveur prennent ce segment.
- Domaine neuf sans autorité SEO face à des sites installés.
- Aucune validation à ce jour sur de vrais relevés de chaque banque (les tests utilisent des relevés synthétiques) : le contrôle des soldes et les signalements anonymes servent de filet de sécurité.
