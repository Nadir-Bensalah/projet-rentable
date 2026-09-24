# Base de prospection Capmedia

Tableau de bord en direct (privé) : https://claude.ai/artifact/7nbPQ3qDTULnyZY9sf4A8y

## Résultat de cette session
- Collecte en cours par passages successifs, objectif 1 000 fiches validées. Chiffres à jour dans `statistiques.md` et sur le tableau de bord.
- Chaque fiche comporte un email et un téléphone vus à la source (URLs citées), des faits datés et sourcés, un score détaillé, un email personnalisé, une accroche téléphonique et un angle de relance.
- Le volume est faible pour deux raisons, décrites dans `methodologie.md` : le proxy de l'environnement bloquait l'accès direct aux sites, et le quota de 200 recherches web de la session a été épuisé en quelques minutes.

## Fichiers
| Fichier | Contenu |
|---|---|
| `prospects.csv` | Base principale pour un CRM (séparateur `;`, encodage UTF-8 avec BOM, compatible Excel) |
| `prospects.json` | Même base, avec les faits structurés |
| `top-100.md` | Fiches complètes par ordre de priorité, avec la raison de contacter chaque entreprise en premier |
| `top-500.md` | Vue condensée |
| `rejetes.csv` | Chaque entreprise écartée, avec l'étape et la raison |
| `sources.md` | Nature et domaines des sources |
| `statistiques.md` | Chiffres de la collecte |
| `methodologie.md` | Pipeline, score, limites, marche à suivre pour passer à l'échelle |
| `pistes-a-reprendre.md` | Signaux repérés mais non qualifiés (à ne pas contacter en l'état) |
| `opposition.csv` | Liste d'opposition, à compléter à chaque demande « stop » |
| `qa-overrides.json` | Décisions du contrôle qualité manuel |
| `brief-equipes.md` | Consignes données aux équipes de recherche |
| `tableau-de-bord.html` | Source du tableau de bord |
| `tools/` | `merge.py` (contrôle, déduplication, opposition), `export.py` (génération des livrables) |

## Avant d'appeler
Vérifiez le numéro sur le site de l'entreprise le jour de l'appel. Les coordonnées ont été lues dans des résultats de recherche le 24/09/2026, pas sur la page d'origine.
