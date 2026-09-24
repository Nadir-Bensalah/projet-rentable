# Méthodologie

## Pipeline appliqué à chaque entreprise
Découverte par signal d'achat → entreprise privée ? → email professionnel trouvé tel quel ? → téléphone professionnel trouvé tel quel ? → besoin observable sourcé ? → preuves suffisantes ? → score ≥ 70 ? → enrichissement → rédaction → contrôle qualité → base finale.
Un seul « non » entraîne le rejet. Chaque rejet est consigné dans `rejetes.csv` avec son étape.

## Organisation
Huit équipes ont travaillé en parallèle, chacune sur un type de signal. Chaque équipe réalisait elle-même découverte, contacts, qualification et rédaction, dans cet ordre : aucun email n'était rédigé avant validation des coordonnées et du score.

| Équipe | Signal |
|---|---|
| T01 | Recrutement digital (développeur, alternant, chef de projet web) dans une entreprise non-tech |
| T02 | Recherche explicite de prestataire / appel d'offres privé |
| T03 | Levée de fonds, rachat, nouvelle marque, lancement e-commerce |
| T04 | Réseaux de franchise en expansion |
| T05 | Application mobile existante en difficulté (notes, avis, bugs) |
| T06 | Tourisme, hôtellerie, loisirs : ouverture ou rachat |
| T07 | Entreprises de terrain : croissance, rachats, recrutement massif |
| T08 | Services, santé privée, formation, immobilier |

Le contrôle qualité a été fait séparément, par relecture de chaque fiche retenue (voir `qa-overrides.json`), puis par un contrôle automatique (`tools/merge.py`). Ce contrôle vérifie le format de l'email, la présence du téléphone, la traçabilité des sources, la somme du score, la présence de la ligne d'opposition et l'identification de Capmedia. Il déduplique aussi les fiches par SIREN, domaine, téléphone, email et raison sociale.

## Grille de score (/100)
Besoin observable /25 · Urgence-timing /20 · Adéquation Capmedia /20 · Capacité économique /10 · Accessibilité du contact /10 · Qualité des preuves /15.
Niveaux : 90-100 TRÈS CHAUD · 80-89 CHAUD · 70-79 QUALIFIÉ · moins de 70 rejeté.

## Règles de coordonnées
- L'email et le téléphone doivent tous deux avoir été lus tels quels dans une source identifiée, dont l'URL est citée.
- Aucun email n'a été déduit d'un nom de domaine.
- Les adresses des plateformes (Indeed, Malt…) sont refusées.
- Une coordonnée dont la source est ambiguë ou qui se contredit entre deux sources est rejetée au contrôle qualité. C'est le cas de Capitole Taxi et de Cinsens.

## Limites techniques de cette session — À LIRE
1. **Accès web restreint.** Le proxy réseau de l'environnement cloud bloquait l'ouverture directe des sites : sites d'entreprises, Pappers, societe.com, annuaire-entreprises, Indeed, PagesJaunes, App Store, Google Play. La seule source était le moteur de recherche web, via les résumés et les URLs de résultats.
   - Conséquence 1 : aucun audit direct de site n'a été possible (responsive, HTTPS, formulaires, performance). Aucune fiche n'affirme donc un défaut de site non lu dans un résultat.
   - Conséquence 2 : la note « qualité des preuves » plafonne vers 10-11/15, d'où l'absence de fiches 80+.
2. **Quota de recherche.** La session est limitée à 200 recherches web au total, partagées entre toutes les équipes. Il a été épuisé en quelques minutes, après 15 à 35 recherches par équipe, alors que 150 étaient prévues.
3. **Rendement observé.** 80 entreprises analysées pour 6 retenues, soit environ 1 fiche validée pour 30 recherches. L'email est le premier point de blocage : beaucoup de PME n'exposent qu'un formulaire de contact.

## Pour passer à l'échelle
- Autoriser dans la politique réseau de l'environnement au moins les domaines suivants : les sites d'entreprises (accès « complet ») ou, à défaut, `recherche-entreprises.api.gouv.fr`, `apps.apple.com`, `itunes.apple.com`, `play.google.com`, `www.hellowork.com`, `www.lejournaldesentreprises.com`, `www.franchise-magazine.com`. Cela permettrait l'audit réel des sites et apps, la lecture des mentions légales (email et téléphone à la source) et l'enrichissement SIREN.
- Relever le quota de recherches web de la session, ou répartir la collecte sur plusieurs sessions.
- Repartir des pistes déjà identifiées dans `pistes-a-reprendre.md`.

## Conformité
- Prospection B2B uniquement, sur des coordonnées professionnelles publiées par les entreprises elles-mêmes ou par des annuaires professionnels.
- Aucune adresse personnelle, aucune donnée sensible.
- Chaque message identifie Capmedia et propose une désinscription simple (« répondez stop »).
- `opposition.csv` doit être complété à chaque demande. `tools/merge.py` exclut automatiquement toute entreprise, tout domaine, tout email ou tout téléphone présents dans la liste d'opposition (`opposition.json` dans le dossier d'état).
- Aucun email n'a été envoyé, aucun appel passé, aucun formulaire rempli.
