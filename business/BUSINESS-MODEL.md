# Modèle économique

## Mécanique
- **Unité de valeur** : la page de relevé PDF exportée. Simple à comprendre, proportionnelle au travail évité, et comparable aux concurrents (qui facturent aussi à la page).
- **Gratuit récurrent** (15 pages/mois, Excel + CSV FR, un relevé à la fois) : produit l'acquisition (SEO « outil », bouche-à-oreille) et l'activation.
- **Pack** (150 pages, 15 €, 12 mois, tous formats) : capte les besoins ponctuels (particuliers, clôture annuelle) sans friction d'abonnement.
- **Abonnements** Pro (400 p/mois, 12 €) et Cabinet (2 500 p/mois, 39 €), mensuels ou annuels (2 mois offerts) : revenu récurrent des professionnels.
- **Leviers d'upgrade intégrés au produit** : formats OFX/QIF/écritures/JSON, lots et fusion, rapport de contrôle, quota.
- **Ré-export gratuit** du même relevé dans le mois (empreinte SHA-256) : évite la frustration de payer deux fois.
- **Parrainage** : 30 pages offertes aux deux parties après confirmation de l'e-mail du filleul (plafond 20).

## Encaissement
- Recommandé : **Lemon Squeezy (merchant of record)** — encaisse, émet les factures et reverse la TVA dans tous les pays : adapté à un micro-entrepreneur vendant à des particuliers de l'UE. Réserve : Lemon Squeezy est en cours d'intégration à Stripe (« Stripe Managed Payments ») — vérifier la disponibilité au moment de l'inscription.
- Alternative intégrée : **Stripe** (Checkout + portail client + webhooks). L'entrepreneur reste alors vendeur et doit gérer la TVA/OSS.
- Bascule par configuration (`PAYMENT_PROVIDER`, clés, identifiants de prix) : aucune modification de code. En attendant, un **bac à sable** simule paiement, échec, annulation, renouvellement, impayé et résiliation par le même pipeline de webhooks.

## Coûts
| Poste | Coût au lancement | Commentaire |
|---|---|---|
| Hébergement app | 0 € (offre gratuite Render/Koyeb) puis ~7 $/mois | Mise en veille de l'offre gratuite = démarrage lent : passer au payant dès les premiers revenus |
| Base de données | 0 € (Neon/Supabase gratuit) | Données minuscules (pas de fichiers) |
| E-mails | 0 € (Resend : quota gratuit) | |
| Domaine | ~10–15 €/an | **Seule dépense incompressible** (action humaine) |
| Paiement | ~5 % + 0,50 $ par transaction (Lemon Squeezy, à confirmer sur leur grille) ou ~1,5 % + 0,25 € (Stripe, cartes UE) | |
| Calcul de conversion | 0 € | Fait dans le navigateur du client |

## Pourquoi ce modèle résiste
- Aucun coût variable par conversion → le gratuit est soutenable même avec beaucoup d'utilisateurs.
- La récurrence vient des professionnels, pas des particuliers.
- Le pack monétise les usages ponctuels que les abonnements ratent.
