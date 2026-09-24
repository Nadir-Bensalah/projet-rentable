# Métriques

Toutes les métriques sont calculées à partir de données réelles de la base (événements first-party + tables métier) et affichées sur `/admin` (accès : e-mails listés dans `ADMIN_EMAILS`, adresse vérifiée). **Valeurs actuelles : aucune (produit non lancé).**

## Événements instrumentés
| Étape | Événement | Source |
|---|---|---|
| Acquisition | `page_view` (+ UTM, référent d'origine, page d'atterrissage) | Client (sessionStorage, sans cookie) |
| Landing / CTA | `cta_click` (attribut `data-cta` : hero-convert, hero-sample, pricing-*, guide-sidebar…) | Client |
| Usage | `file_selected`, `parse_succeeded` (pages, opérations, statut du contrôle, banque, durée), `parse_failed` (raison) | Client |
| Intention d'export | `export_clicked`, `export_completed` | Client |
| Inscription | `signup_started` (client), `signup_completed` (serveur, avec first-touch UTM) | Mixte |
| Activation | `email_verified`, `export_charged` (1er export = activé) | Serveur |
| Monétisation | `paywall_shown`, `pricing_viewed`, `checkout_clicked` (client), `checkout_started`, `purchase_completed`, `subscription_started`, `payment_succeeded`, `payment_failed` (serveur, depuis les webhooks) | Mixte |
| Rétention / churn | `login`, `export_charged` récurrents ; `subscription_canceled` | Serveur |
| Qualité | `layout_report_sent` + table `layout_reports` ; statut de contrôle des exports | Mixte |
| Outils gratuits | `free_tool_used` | Client |

Aucun événement ne contient le contenu d'un relevé (libellé, montant, nom de fichier).

## Indicateurs du tableau de bord
MRR (abonnements actifs), chiffre encaissé, abonnements actifs, résiliations, exports facturés/pages, lectures réussies/échecs, signalements de mise en page, rétention J+7 de cohorte, entonnoir complet (visiteurs → fichier déposé → clic export → inscription → e-mail confirmé → activé → paywall → clic offre → paiement commencé), sources d'inscription, pages les plus vues, répartition des contrôles (vérifié / écart / non vérifiable).

## Objectifs (hypothèses de pilotage, à ajuster sur données réelles)
| Indicateur | Cible 90 jours |
|---|---|
| Taux de lecture « vérifiée » parmi les relevés déposés | ≥ 80 % |
| Visiteur → fichier déposé | ≥ 15 % |
| Inscrit → activé (1er export) | ≥ 50 % |
| Activé → payant | ≥ 3 % |
| Clients payants | ≥ 10 (critère d'arrêt/continuation) |
| Churn mensuel Pro | ≤ 8 % |

## Outil externe optionnel
Plausible (sans cookie) peut être activé via `PLAUSIBLE_DOMAIN` ; il est servi via le domaine du site (réécriture) pour rester compatible avec la CSP.
