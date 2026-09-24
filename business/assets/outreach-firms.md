# Prospection des cabinets comptables — scripts

> Règles : envoi manuel et personnalisé, adresse professionnelle trouvée publiquement (site du cabinet), une ligne de désinscription, identité complète de l'expéditeur. Jamais d'envoi de masse ni d'adresse achetée.

## E-mail 1 — Premier contact
**Objet :** Relevés bancaires en PDF de vos clients

Bonjour {Prénom},

Je me permets de vous écrire car de nombreux cabinets reçoivent encore des relevés bancaires en PDF (comptes non synchronisés, historique à reprendre, associations…).

J'ai conçu **Relevéo**, un outil qui convertit ces PDF en écritures (journal 512 / 471 aux colonnes du FEC), en OFX ou en Excel, et qui **vérifie chaque relevé au centime** : solde de départ + mouvements = solde final. Si une ligne manque, vous le voyez avant l'import.

Point important pour le secret professionnel : le relevé est lu dans votre navigateur, **il n'est jamais envoyé** à nos serveurs.

Vous pouvez l'essayer en 30 secondes sur un relevé fictif : {APP_URL}/convertir?exemple=1

Si cela vous intéresse, je vous offre un mois du plan Cabinet en échange de vos remarques.

Bien cordialement,
{Nom} — Relevéo
{APP_URL} · Pour ne plus recevoir de message de ma part, répondez simplement « stop ».

## E-mail 2 — Relance J+4
**Objet :** Re: Relevés bancaires en PDF de vos clients

Bonjour {Prénom},

Une précision qui intéresse souvent les cabinets : Relevéo traite une année de relevés d'un coup et les fusionne en un seul fichier, sans doublons entre relevés qui se chevauchent. Le rapport de contrôle imprimable peut être joint au dossier.

Voulez-vous que je vous active le mois d'essai du plan Cabinet ?

{Nom}

## E-mail 3 — Dernier message J+10
**Objet :** Je clos le sujet

Bonjour {Prénom},

Je ne vous relancerai plus. Si un jour un client vous envoie ses relevés en PDF, l'outil reste disponible gratuitement jusqu'à 15 pages par mois : {APP_URL}

Bonne continuation,
{Nom}

## Message LinkedIn (≤ 300 caractères)
Bonjour {Prénom}, je développe Relevéo : relevés bancaires PDF → écritures 512/471, OFX ou Excel, contrôlés au centime et sans envoi du fichier (traitement dans le navigateur). Seriez-vous d'accord pour le tester sur un dossier et me donner votre avis ?

## Réponses aux objections
- **« Notre logiciel fait déjà l'OCR »** → Relevéo ne remplace pas votre logiciel : il sert quand vous n'avez qu'un PDF, et il prouve l'exhaustivité (contrôle de solde), ce que l'OCR ne fait pas.
- **« Confidentialité »** → Aucun envoi : vérifiable dans l'onglet Réseau du navigateur, et le site fonctionne même hors ligne une fois chargé.
- **« Prix »** → 39 €/mois sans engagement pour 2 500 pages ; moins d'une heure de saisie évitée par mois suffit.
