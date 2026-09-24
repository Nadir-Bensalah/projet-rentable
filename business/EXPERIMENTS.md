# Expériences

Aucune expérience n'a encore été exécutée (pas de trafic). Chaque hypothèse a un protocole, une métrique et un seuil de décision.

| # | Hypothèse | Protocole | Métrique | Décision |
|---|---|---|---|---|
| E1 | Le contrôle « vérifié au centime » est la raison n°1 de choisir Relevéo | Variante du hero (preuve vs confidentialité) sur 2 × 2 semaines | Taux visiteur → fichier déposé | Garder le message gagnant (+20 % relatif minimum) |
| E2 | Le traitement local augmente la confiance | Question en fin d'export (1 clic) « Qu'est-ce qui vous a décidé ? » | Répartition des réponses | Réordonner les messages |
| E3 | Le pack à 15 € convertit mieux qu'à 19 € sans baisser le revenu | Changer `PACK.price` pendant 4 semaines | Revenu par visiteur du paywall | Garder le prix au revenu le plus élevé |
| E4 | Pro à 15 € ne dégrade pas la conversion | Idem sur `PLANS.pro.priceMonthly` | Conversion paywall → Pro | Idem |
| E5 | Les cabinets répondent à la prospection | 100 e-mails personnalisés (séquence 3 messages) | Taux de réponse, essais, conversions | Continuer si ≥ 5 % de réponses |
| E6 | Le marché anglophone est accessible avec le même moteur | Landing EN minimale + traduction de l'interface du convertisseur | Inscriptions EN / FR | Internationaliser si ≥ 30 % du volume FR |
| E7 | Les relevés réels des principales banques FR sont lus « vérifiés » | Suivi du statut de contrôle par banque reconnue (`bank_id`) + signalements | % vérifié par banque | Corriger le moteur pour toute banque < 80 % |
| E8 | Un OCR navigateur rendrait les scans exploitables sans dégrader la confiance | Prototype tesseract.js derrière un flag, marqué « à vérifier » | Taux de vérification des scans | Livrer si ≥ 70 % vérifiés |

Critère global (décidé avant lancement) : à J+90, < 10 clients payants **et** pas de progression organique mesurable → bascule vers l'option de repli (D4).
