# Marque

## Nom : Relevéo
- **Construction** : « relevé » (le document que tout le monde reconnaît) + suffixe « -éo » (moderne, prononçable, mémorisable). Écriture ASCII : `releveo`.
- **Vérification des conflits (septembre 2026, recherche web uniquement)** : aucune entreprise, logiciel ou marque identifiée sous ce nom dans la finance ou le logiciel. Occurrences trouvées sans lien : un compte TikTok peu actif (@releveo), un événement cycliste portoricain (« Releveo de Ciclismo »). Noms proches mais distincts : Relevia, Releva.ai, Relevium, Relevo (média sportif espagnol dissous en 2025).
- **À faire par le propriétaire avant lancement** : recherche d'antériorité INPI/EUIPO (classes 9, 36, 42), achat du domaine (releveo.fr et/ou releveo.com, disponibilité **non vérifiée** : le WHOIS n'était pas accessible depuis l'environnement). Le nom est centralisé dans `src/config/site.ts` si un changement s'impose.

## Architecture de marque
Marque unique « Relevéo » ; les offres sont descriptives (Gratuit, Pack 150 pages, Pro, Cabinet). Les outils gratuits sont des sous-pages (« Vérifier un solde », « Modèle de rapprochement ») qui renforcent la promesse de fiabilité.

## Plateforme
- **Mission** : que plus personne ne recopie un relevé bancaire à la main — ni ne se demande s'il a oublié une ligne.
- **Promesse** : « vérifié au centime ».
- **Preuve** : le contrôle de solde affiché pour chaque relevé.
- **Valeurs** : exactitude, discrétion (vos données restent chez vous), honnêteté (pas de dark patterns, résiliation simple, prix clairs).

## Ton
Clair, précis, rassurant, jamais racoleur. Phrases courtes, vocabulaire du quotidien (« relevé », « solde », « ligne ») plutôt que le jargon. On explique les limites (scans, FEC) au lieu de les cacher. Vouvoiement.

## Messages clés
- « Vos relevés bancaires PDF en Excel, vérifiés au centime. »
- « Une preuve, pas une promesse. »
- « Votre relevé ne quitte jamais votre ordinateur. »
- « Gratuit pour commencer. Simple ensuite. »

## Identité visuelle (implémentée)
- **Logo** : carré arrondi bleu encre avec un « R » tracé et une coche verte (la vérification). `src/components/logo.tsx`, `src/app/icon.svg`.
- **Couleurs** : bleu encre `#2547ea` (confiance, finance) ; vert émeraude (vérifié) ; ambre (à vérifier) ; rose (écart). Neutres ardoise. Thème sombre complet.
- **Typographie** : Inter (variable, auto-hébergée, licence OFL), chiffres tabulaires pour les montants.
- **Design system** : jetons CSS dans `src/app/globals.css` (`--bg`, `--fg`, `--border`, palette `brand-*`), composants dans `src/components/ui/` (Button, Field/Input/Select/Textarea/Checkbox, Alert, Badge, Dialog accessible, Spinner), surfaces `.surface`, typographie éditoriale `.prose-content`.
