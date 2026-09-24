# Tarifs

| Offre | Prix TTC | Pages | Formats | Lots / fusion | Rapport de contrôle |
|---|---|---|---|---|---|
| Gratuit | 0 € | 15 / mois | Excel, CSV (FR) | Non | Non |
| Pack 150 pages | 15 € une fois | 150, valables 12 mois (en plus du gratuit) | Tous | Oui | Oui |
| Pro | 12 €/mois ou 120 €/an | 400 / mois | Tous | Oui | Oui |
| Cabinet | 39 €/mois ou 390 €/an | 2 500 / mois | Tous | Oui | Oui |

Source de vérité dans le code : `src/config/plans.ts` (page Tarifs, paywall, moteur de quota et fournisseurs de paiement lisent tous ce fichier).

## Règles
- Une page = une page de PDF exportée. Ré-export du même relevé (même empreinte) gratuit pendant le mois civil.
- Ordre de consommation : forfait mensuel, puis crédits (les plus proches de l'expiration d'abord).
- Dépassement : jamais de facturation automatique ; proposition de pack ou d'upgrade.
- Abonnement résilié : accès conservé jusqu'à la fin de la période payée. Impayé : accès maintenu pendant les relances du prestataire (statut « paiement en attente »).
- Remboursement commercial (à valider juridiquement) : pack non utilisé remboursé sous 14 jours ; premier paiement d'abonnement remboursé sous 14 jours si < 20 pages exportées.

## Justification
- **Ancrage concurrentiel** : les leaders anglophones sont à 15–99 $/mois ; le marché FR a des offres gratuites limitées. Pro à 12 € reste sous le marché tout en couvrant les frais fixes dès 1–2 clients.
- **Pack à 15 €** : prix d'un « déjeuner », décision impulsive pour un besoin ponctuel ; 0,10 €/page.
- **Cabinet à 39 €** : < 1 heure de collaborateur par mois ; volume 2 500 pages ≈ 80–100 dossiers mensuels (H).
- **Annuel -17 %** : trésorerie et réduction du churn.

## Tests de prix prévus
Voir [EXPERIMENTS.md](EXPERIMENTS.md) (E3 : pack 15 € vs 19 € ; E4 : Pro 12 € vs 15 €). Aucun test n'a encore été exécuté (non observé).
