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
| `NEXT_PUBLIC_LEGAL_*` | identité légale |

L'application **refuse de démarrer en production** si la configuration est incomplète ou dangereuse (secret faible, bac à sable de paiement, APP_URL non https, clés manquantes) — voir `src/lib/env.ts`.

## Option A — Render (Blueprint, recommandé pour démarrer gratuitement)
1. Render → New → Blueprint → sélectionner le dépôt (le fichier `render.yaml` est détecté).
2. Renseigner les variables marquées `sync: false`.
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
4. Achat réel du pack (15 €) → crédits visibles dans `/compte`, e-mail reçu, commande dans `/compte/abonnement` → rembourser depuis le prestataire → crédits retirés.
5. Abonnement Pro en mode test (`PAYMENT_MODE=test`) : souscrire, résilier depuis le portail, vérifier les statuts ; puis passer `PAYMENT_MODE=live`.
6. Search Console : soumettre `https://{domaine}/sitemap.xml`.
7. Secrets GitHub `APP_URL` + `CRON_SECRET` pour la tâche quotidienne.

## Vérifications automatiques disponibles
```bash
npm run lint && npm run typecheck && npm test          # unitaires + intégration (Postgres local requis)
npm run build:e2e && npx playwright test               # 70+ tests navigateur sur le build de production
```
La CI GitHub (`.github/workflows/ci.yml`) exécute tout cela à chaque push.

## Retour arrière
Redéployer le commit précédent (Render : « Rollback »). Les migrations sont additives (pas de suppression de colonnes).
