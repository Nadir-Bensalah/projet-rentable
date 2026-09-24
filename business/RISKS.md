# Risques

| # | Risque | Probabilité | Impact | Mitigation en place | Reste à faire |
|---|---|---|---|---|---|
| R1 | Marché saturé de clones, pas de différenciation perçue | Élevée | Élevé | Positionnement « preuve » + cabinets ; outils gratuits ; honnêteté | Mesurer E1/E2 ; pivot à J+90 si échec |
| R2 | Lecture incorrecte de certains relevés réels (non testés ici) | Élevée | Élevé | Moteur générique, contrôle au centime qui signale tout écart, édition des lignes, signalement anonyme | Collecter les signalements, corriger par banque (E7) |
| R3 | Contournement du quota (le navigateur calcule le fichier) | Moyenne | Moyen | Consommation côté serveur avant export, empreinte + plafond de ré-exports, nombre de pages borné, verrouillage en base | **Risque accepté** : une personne technique peut appeler le générateur d'export depuis la console. C'est le prix du « rien n'est envoyé ». Surveiller le ratio ré-exports/exports dans `/admin` |
| R4 | Référencement lent (domaine neuf, AI Overviews) | Élevée | Élevé | Outil dans la page, contenus utiles, communautés, prospection directe | Suivi Search Console |
| R5 | Merchant of record indisponible pour un micro-entrepreneur (Lemon Squeezy en transition vers Stripe) | Moyenne | Élevé | Stripe intégré en alternative ; bascule par configuration | Vérifier l'éligibilité à l'inscription |
| R6 | Juridique : textes non validés, identité manquante | Certaine tant que non fait | Élevé | Identité lue à l'exécution, démarrage refusé en production si incomplète ; consentement de rétractation recueilli et confirmé ; rappel de reconduction annuelle automatique | Validation par un juriste (EXTERNAL-ACTIONS) |
| R7 | Responsabilité en cas de chiffres faux | Faible | Élevé | Contrôle au centime, CGU « aide à la transcription », avertissements d'écart | Validation juridique des CGU |
| R8 | Offre d'hébergement gratuite en veille (démarrage lent) | Élevée | Moyen | Pages statiques légères | Passer à ~7 $/mois dès les premiers revenus |
| R9 | Abus du parrainage | Moyenne | Faible | Adresses canoniques, IP d'inscription, plafond 20, crédits de parrainage sans formats payants | Surveiller `/admin` |
| R10 | Sécurité | Faible | Élevé | Audit indépendant corrigé, tests de non-régression, CSP, en-têtes, rate limiting | Garder le déploiement derrière un proxy qui renseigne X-Forwarded-For ; revoir `TRUSTED_PROXY_HOPS` selon l'hébergeur |
| R11 | Envoi d'e-mails bloqué/spam (domaine neuf) | Moyenne | Moyen | Fournisseur transactionnel (Resend), textes sobres | Configurer SPF/DKIM/DMARC |
| R12 | Dépendance à pdf.js | Faible | Moyen | Version maintenue (Mozilla), `isEvalSupported:false` | Mettre à jour régulièrement (`npm audit` en CI) |
| R13 | Changement de conditions d'une banque (format PDF) | Moyenne | Faible | Moteur générique, pas de modèle figé par banque | — |
| R14 | Facturation : comportements réels des prestataires non testés contre leurs API (portail, remboursements, impayés) | Moyenne | Élevé | Webhooks idempotents, double abonnement résilié automatiquement, alertes e-mail au propriétaire, impayés sans accès après 14 jours, tests d'intégration sur des charges utiles documentées | Parcours de test complet en mode test avant `live` (LAUNCH.md, étape 4) |

## Risques de sécurité acceptés (documentés)
- **CSP `script-src 'unsafe-inline'`** : nécessaire pour garder les pages statiques (les nonces imposeraient un rendu dynamique). Aucune injection HTML utilisateur n'existe ; audit sans XSS trouvé.
- **Divulgation d'existence de compte à l'inscription (409)** : choix d'ergonomie ; limité par un rate limit par IP.
- **Navigation de premier niveau non bridée par la CSP** : un script injecté pourrait théoriquement exfiltrer via une navigation ; pas de vecteur d'injection connu. La page `/securite` ne prétend plus que la CSP rend toute fuite impossible.
