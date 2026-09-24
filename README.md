# Relevéo

**Vos relevés bancaires PDF, convertis et vérifiés au centime.**
Relevéo convertit des relevés bancaires PDF en Excel, CSV, OFX, QIF, JSON ou journal de banque (colonnes FEC). Le PDF est lu **dans le navigateur** (pdf.js) : il n'est jamais envoyé. Chaque relevé est contrôlé : solde de départ + crédits − débits = solde final.

- Business : [`business/`](business/) (synthèse : [`business/EXECUTIVE.md`](business/EXECUTIVE.md))
- Rapport final : [`FINAL-REPORT.md`](FINAL-REPORT.md)
- Mise en production : [`business/LAUNCH.md`](business/LAUNCH.md)
- Actions restantes du propriétaire : [`business/EXTERNAL-ACTIONS.md`](business/EXTERNAL-ACTIONS.md)

## Démarrage local
```bash
npm install                      # copie aussi le worker pdf.js dans public/
cp .env.example .env.local       # valeurs de développement : paiement "mock", e-mails dans la console
createdb releveo                 # Postgres 16 local
DATABASE_URL=postgres://postgres@localhost:5432/releveo npm run db:migrate
npm run dev                      # http://localhost:3000
```
Les e-mails (confirmation, réinitialisation…) s'affichent dans le terminal. Le paiement utilise le bac à sable (`/paiement/simulation`).

## Architecture
| Dossier | Rôle |
|---|---|
| `src/lib/statement/` | Moteur : extraction pdf.js, lignes/cellules, montants, dates, colonnes, soldes, rapprochement, exports (xlsx/csv/ofx/qif/fec/json) — s'exécute dans le navigateur |
| `src/components/converter/` | Application de conversion (dépôt, tableau éditable, contrôle, export, paywall) |
| `src/lib/auth/` | Comptes, sessions (jetons hachés, cookies `__Host-`), scrypt, e-mails de vérification/réinitialisation |
| `src/lib/billing/` | Offres, quota de pages, fournisseurs de paiement (mock / Stripe / Lemon Squeezy), webhooks idempotents |
| `src/lib/email/` | Gabarits et fournisseurs (console / SMTP / Resend) |
| `src/lib/analytics/`, `src/lib/metrics.ts` | Événements first-party sans cookie, tableau de bord `/admin` |
| `src/app/(site)/` | Pages (marketing, SEO, outils, compte, légal) |
| `src/app/api/` | API JSON (contrôle d'origine, rate limiting, validation zod) |
| `migrations/` | Schéma SQL (aucun contenu de relevé n'est stocké) |
| `tests/` | Unitaires, intégration Postgres, E2E Playwright, générateur de relevés synthétiques |

Configuration centralisée : `src/lib/env.ts` (refuse une configuration de production incomplète), offres : `src/config/plans.ts`, marque et identité légale : `src/config/site.ts`.

## Tests
```bash
npm run lint && npm run typecheck
npm test                         # unitaires + intégration (Postgres local : base releveo_test)
npm run build:e2e && npx playwright test   # E2E sur le build de production (base releveo_e2e)
npm run fixtures                 # régénère les relevés PDF synthétiques
```

## Licence
Code propriétaire. Police Inter : SIL Open Font License (`src/app/fonts/Inter-LICENSE.txt`).
