# Mise en production

## Prérequis
Actions 1 à 7 de [EXTERNAL-ACTIONS.md](EXTERNAL-ACTIONS.md) effectuées. Node 22, un Postgres 16 accessible.

## Variables d'environnement de production
| Variable | Valeur |
|---|---|
| `APP_URL`, `NEXT_PUBLIC_APP_URL` | `https://{domaine}` (**aussi au moment du build** : les pages statiques contiennent les URL canoniques) |
| `DATABASE_URL` | chaîne Neon (`?sslmode=require`) ; `DATABASE_SSL=true` |
| `AUTH_SECRET` | `openssl rand -base64 48` |
| `CRON_SECRET` | `openssl rand -hex 32` |
| `TRUSTED_PROXY_HOPS` | `1` sur Render/Koyeb (un proxy devant l'app) |
| `PAYMENT_PROVIDER` | `lemonsqueezy` (ou `stripe`) ; `PAYMENT_MODE=test` pendant les essais, puis `live` |
| `LEMONSQUEEZY_*` ou `STRIPE_*` | clés, secret de webhook, identifiants de variantes/prix |
| `EMAIL_PROVIDER=resend`, `RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_REPLY_TO`, `SUPPORT_EMAIL`, `NEXT_PUBLIC_SUPPORT_EMAIL` | |
| `ADMIN_EMAILS` | votre e-mail (accès à `/admin`) |
| `LEGAL_NAME`, `LEGAL_SIREN`, `LEGAL_ADDRESS`, `LEGAL_HOST`, `LEGAL_DB_HOST`, `LEGAL_MEDIATOR` (+ `LEGAL_STATUS`, `LEGAL_VAT`, `LEGAL_DIRECTOR` facultatifs) | identité légale, **lue à l'exécution** (pas besoin de reconstruire l'image) |
| `PLAUSIBLE_DOMAIN`, `PLAUSIBLE_HOST` (facultatif) | **variables de build** (build args Docker) |

Au démarrage, le serveur vérifie la configuration (`src/instrumentation.ts`) et **s'arrête avec la liste des problèmes** si elle est incomplète ou dangereuse : secret faible, bac à sable de paiement, APP_URL non https, clés manquantes, identité légale incomplète, e-mails en console avec des paiements réels. `/api/health` renvoie 503 `configuration: invalid` dans le même cas. Pour une préproduction privée seulement : `ALLOW_MOCK_PAYMENTS`, `ALLOW_HTTP_APP_URL`, `ALLOW_INCOMPLETE_LEGAL`.

Variables de build (figées dans l'image) : `APP_URL`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_SUPPORT_EMAIL`, `PLAUSIBLE_*` (URL canoniques, sitemap, robots, proxy Plausible). Render transmet les variables du service comme build args ; ailleurs, passez-les avec `--build-arg`. Toutes les autres variables sont lues à l'exécution.

## Option A — Render (Blueprint, recommandé pour démarrer gratuitement)
1. Render → New → Blueprint → sélectionner le dépôt (le fichier `render.yaml` est détecté).
2. Renseigner les variables marquées `sync: false` (dont les `LEGAL_*`). Le plan `free` s'endort après 15 min (≈ 50 s de réveil ; les prestataires réessaient les webhooks) : acceptable pendant les essais en `PAYMENT_MODE=test`, passer au plan `starter` avant `PAYMENT_MODE=live`.
3. Déployer. Le conteneur exécute les migrations (`scripts/migrate.mjs`) puis démarre `server.js`.
4. Settings → Custom Domain → ajouter le domaine, créer l'enregistrement DNS indiqué.
5. Vérifier : `curl https://{domaine}/api/health` → `{"status":"ok"}`.

## Option B — Docker sur n'importe quel hôte
```bash
docker build \
  --build-arg APP_URL=https://{domaine} \
  --build-arg NEXT_PUBLIC_APP_URL=https://{domaine} \
  --build-arg NEXT_PUBLIC_SUPPORT_EMAIL=support@{domaine} \
  -t releveo .
docker run -d --name releveo -p 3000:3000 --env-file .env.production releveo
curl -fsS http://localhost:3000/api/health
```
(Placer un proxy HTTPS — Caddy, Traefik, nginx — devant le conteneur et garder `TRUSTED_PROXY_HOPS=1`.)

## Option C — Node sans Docker
```bash
npm ci
APP_URL=https://{domaine} NEXT_PUBLIC_APP_URL=https://{domaine} npm run build
DATABASE_URL=... npm run db:migrate
./scripts/start-standalone.sh   # lit PORT, HOSTNAME et toutes les variables d'environnement
```

## Après le premier déploiement (ordre exact)
1. `/api/health` répond `ok`.
2. Créer votre compte sur le site avec l'e-mail listé dans `ADMIN_EMAILS`, confirmer l'e-mail (vérifie l'envoi réel), ouvrir `/admin`.
3. Webhook du prestataire : envoyer un événement de test depuis son tableau de bord → réponse 200 (sinon vérifier le secret).
4. **En mode test** (`PAYMENT_MODE=test`, cartes de test du prestataire), dérouler le parcours complet : pack (crédits, e-mail avec confirmation du consentement), pack avec code promo, abonnement Pro, portail client **le lendemain** (le lien doit toujours fonctionner), résiliation, remboursement d'un pack et d'une échéance d'abonnement (statut « Remboursé »), échec de paiement puis passage en impayé, suppression d'un compte abonné (abonnement résilié chez le prestataire, aucune erreur 500 sur les webhooks suivants). Consulter `webhook_events.error` : seules des notes d'information doivent y figurer.
5. Passer `PAYMENT_MODE=live` (et le plan Render `starter`), redéployer, faire un achat réel du pack (15 €) puis le rembourser.
6. Search Console : soumettre `https://{domaine}/sitemap.xml`.
7. Secrets GitHub `APP_URL` + `CRON_SECRET` pour la tâche quotidienne.

## Vérifications automatiques disponibles
```bash
npm run lint && npm run typecheck && npm test          # unitaires + intégration (Postgres local requis)
npm run build:e2e && npx playwright test               # 78 tests navigateur sur le build de production
```
La CI GitHub (`.github/workflows/ci.yml`) exécute tout cela à chaque push.

## Retour arrière
Redéployer le commit précédent (Render : « Rollback »). Les migrations sont additives (pas de suppression de colonnes).
