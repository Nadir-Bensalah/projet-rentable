# Économie unitaire

*Tout est hypothétique tant qu'aucun client n'a payé : revenu réel à ce jour = 0 €. Les calculs servent à fixer des seuils de décision.*

## Coûts variables par client
- Conversion : **0 €** (navigateur du client).
- Base de données : quelques Ko par client (compte + compteurs) → négligeable.
- E-mails : 3 à 6 par client et par mois → dans le quota gratuit jusqu'à plusieurs milliers de clients (H, selon l'offre Resend en vigueur).
- Frais de paiement (hypothèse merchant of record à ~5 % + 0,50 $) :
  - Pack 15 € → frais ≈ 1,25 € → **marge ≈ 13,75 €** (≈ 92 %)
  - Pro 12 € → frais ≈ 1,10 € → **marge ≈ 10,90 €/mois** (≈ 91 %)
  - Cabinet 39 € → frais ≈ 2,45 € → **marge ≈ 36,55 €/mois** (≈ 94 %)
  - Avec Stripe (cartes UE ~1,5 % + 0,25 €) les marges sont supérieures, mais la TVA OSS devient à la charge du vendeur.

## Coûts fixes
| Scénario | Coût mensuel |
|---|---|
| Lancement 100 % gratuit | ≈ 1 €/mois (domaine amorti) |
| Après premiers revenus (hébergement sans mise en veille) | ≈ 8–10 €/mois |

**Point mort** : 1 abonnement Pro couvre le scénario payant ; ~3 packs par mois aussi.

## Valeur vie client (hypothèses à valider)
- Pro : churn mensuel supposé 8 % → durée ≈ 12,5 mois → LTV ≈ 136 € de marge.
- Cabinet : churn supposé 4 % → durée ≈ 25 mois → LTV ≈ 914 € de marge.
- Pack : achat unique, réachat inconnu (non observé).

## Coût d'acquisition
- Canaux prévus sans dépense : SEO, communautés, prospection e-mail manuelle, parrainage → CAC monétaire ≈ 0 €, coût en temps du propriétaire.
- Garde-fou : ne pas lancer de publicité payante avant d'avoir mesuré un taux visiteur → payant réel (Search Console + tableau de bord /admin).

## Métriques qui valideront le modèle
Taux d'activation (1er export / inscrits), conversion gratuit → payant, part pack vs abonnement, churn mensuel, pages consommées par client Cabinet. Définitions dans [METRICS.md](METRICS.md).
