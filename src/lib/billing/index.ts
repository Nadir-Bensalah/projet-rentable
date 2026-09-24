import "server-only";
import type { PoolClient } from "pg";
import { PACK, PLANS, PRODUCTS, type PlanId } from "@/config/plans";
import { absoluteUrl } from "@/config/site";
import { env } from "@/lib/env";
import { query, queryOne, transaction } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { trackServer } from "@/lib/analytics/server";
import { mockProvider } from "./providers/mock";
import { stripeProvider } from "./providers/stripe";
import { lemonSqueezyProvider } from "./providers/lemonsqueezy";
import type { BillingEvent, PaymentProvider, SubscriptionRef } from "./types";

export function paymentProvider(name = env().PAYMENT_PROVIDER): PaymentProvider {
  switch (name) {
    case "stripe":
      return stripeProvider;
    case "lemonsqueezy":
      return lemonSqueezyProvider;
    default:
      return mockProvider;
  }
}

export interface SubscriptionRow {
  id: string;
  user_id: string;
  provider: string;
  provider_subscription_id: string;
  provider_customer_id: string | null;
  plan: Exclude<PlanId, "free">;
  interval: "month" | "year";
  status: string;
  current_period_end: Date | null;
  cancel_at_period_end: boolean;
  portal_url: string | null;
}

export function toRef(s: SubscriptionRow): SubscriptionRef {
  return { providerSubscriptionId: s.provider_subscription_id, providerCustomerId: s.provider_customer_id, portalUrl: s.portal_url };
}

/** The subscription that currently grants access, if any. */
export async function currentSubscription(userId: string, db: Pick<PoolClient, "query"> | null = null): Promise<SubscriptionRow | null> {
  const sql = `SELECT * FROM subscriptions
     WHERE user_id = $1
       AND (status IN ('active', 'past_due')
            OR (status = 'canceled' AND current_period_end > now()))
     ORDER BY CASE plan WHEN 'business' THEN 0 ELSE 1 END, updated_at DESC
     LIMIT 1`;
  if (db) return ((await db.query(sql, [userId])).rows[0] as SubscriptionRow | undefined) ?? null;
  return queryOne<SubscriptionRow & Record<string, unknown>>(sql, [userId]);
}

export async function latestSubscription(userId: string): Promise<SubscriptionRow | null> {
  return queryOne<SubscriptionRow & Record<string, unknown>>(
    `SELECT * FROM subscriptions WHERE user_id = $1 ORDER BY updated_at DESC LIMIT 1`,
    [userId],
  );
}

export function currentPeriod(d = new Date()) {
  return `${d.getUTCFullYear()}-${(d.getUTCMonth() + 1).toString().padStart(2, "0")}`;
}

export interface AccountState {
  plan: PlanId;
  subscription: SubscriptionRow | null;
  period: string;
  monthlyLimit: number;
  usedThisMonth: number;
  allowanceRemaining: number;
  credits: number;
  creditsNextExpiry: Date | null;
  paidFeatures: boolean;
  totalAvailable: number;
}

export async function accountState(userId: string, db: Pick<PoolClient, "query"> | null = null): Promise<AccountState> {
  const run = async <T>(sql: string, params: unknown[]): Promise<T[]> =>
    db ? ((await db.query(sql, params)).rows as T[]) : ((await query(sql, params)) as T[]);
  const period = currentPeriod();
  const sub = await currentSubscription(userId, db);
  const plan: PlanId = sub ? sub.plan : "free";
  const [used] = await run<{ pages: string | null }>(
    `SELECT COALESCE(SUM(from_allowance), 0) AS pages FROM usage_events WHERE user_id = $1 AND period = $2`,
    [userId, period],
  );
  const [credits] = await run<{ remaining: string | null; paid_remaining: string | null; next_expiry: Date | null }>(
    `SELECT COALESCE(SUM(remaining), 0) AS remaining,
            COALESCE(SUM(remaining) FILTER (WHERE source <> 'referral'), 0) AS paid_remaining,
            MIN(expires_at) AS next_expiry
       FROM credit_grants WHERE user_id = $1 AND remaining > 0 AND (expires_at IS NULL OR expires_at > now())`,
    [userId],
  );
  const monthlyLimit = PLANS[plan].monthlyPages;
  const usedThisMonth = Number(used?.pages ?? 0);
  const creditCount = Number(credits?.remaining ?? 0);
  const allowanceRemaining = Math.max(0, monthlyLimit - usedThisMonth);
  return {
    plan,
    subscription: sub,
    period,
    monthlyLimit,
    usedThisMonth,
    allowanceRemaining,
    credits: creditCount,
    creditsNextExpiry: credits?.next_expiry ?? null,
    // Referral pages add volume but do not unlock paid formats (prevents self-referral farming).
    paidFeatures: plan !== "free" || Number(credits?.paid_remaining ?? 0) > 0,
    totalAvailable: allowanceRemaining + creditCount,
  };
}

/** Free re-exports of the same document per month before it is charged again. */
export const MAX_FREE_REEXPORTS = 10;

export class QuotaError extends Error {
  constructor(
    public code: "quota_exceeded" | "paid_feature" | "email_unverified",
    message: string,
  ) {
    super(message);
  }
}

export interface ConsumeInput {
  userId: string;
  pages: number;
  documentHash: string;
  format: string;
  paidFormat: boolean;
  batch: boolean;
  bankId?: string;
  reconciled?: string;
}

/**
 * Charges an export against the monthly allowance first, then prepaid credits.
 * Exporting the same document again in the same month is free (idempotent on the document hash).
 * Runs in a transaction with a row lock on the user to prevent double spending.
 */
export async function consumePages(input: ConsumeInput): Promise<{ charged: number; alreadyPaid: boolean; state: AccountState }> {
  const result = await transaction(async (db) => {
    const user = (await db.query(`SELECT id, email, email_verified_at FROM users WHERE id = $1 FOR UPDATE`, [input.userId])).rows[0] as
      | { id: string; email: string; email_verified_at: Date | null }
      | undefined;
    if (!user) throw new QuotaError("quota_exceeded", "Compte introuvable.");
    if (!user.email_verified_at) {
      throw new QuotaError("email_unverified", "Confirmez votre adresse e-mail pour télécharger vos fichiers.");
    }
    const state = await accountState(input.userId, db);
    if ((input.paidFormat || input.batch) && !state.paidFeatures) {
      throw new QuotaError(
        "paid_feature",
        input.batch
          ? "La conversion de plusieurs relevés et la fusion sont incluses dans les offres payantes."
          : "Ce format est inclus dans les offres payantes. Excel et CSV restent gratuits.",
      );
    }
    const period = state.period;
    const existing = (
      await db.query(`SELECT id, pages, reexports FROM usage_events WHERE user_id = $1 AND document_hash = $2 AND period = $3 FOR UPDATE`, [
        input.userId,
        input.documentHash,
        period,
      ])
    ).rows[0] as { id: string; pages: number; reexports: number } | undefined;
    // A document already charged this month can be re-exported for free, but only up to the
    // page count first charged (the page count comes from the browser) and a limited number of times.
    let toCharge = input.pages;
    if (existing) {
      toCharge = existing.reexports >= MAX_FREE_REEXPORTS ? input.pages : Math.max(0, input.pages - existing.pages);
      if (toCharge === 0) {
        await db.query(`UPDATE usage_events SET reexports = reexports + 1 WHERE id = $1`, [existing.id]);
        return { charged: 0, alreadyPaid: true, email: user.email };
      }
    }

    const fromAllowance = Math.min(toCharge, state.allowanceRemaining);
    let rest = toCharge - fromAllowance;
    if (rest > state.credits) {
      throw new QuotaError(
        "quota_exceeded",
        `Ce relevé compte ${toCharge} page(s) à décompter et il vous en reste ${state.totalAvailable}. Achetez un pack ou changez d'offre pour continuer.`,
      );
    }
    const fromCredits = rest;
    if (rest > 0) {
      const grants = (
        await db.query(
          `SELECT id, remaining FROM credit_grants
            WHERE user_id = $1 AND remaining > 0 AND (expires_at IS NULL OR expires_at > now())
            ORDER BY expires_at ASC NULLS LAST, created_at ASC FOR UPDATE`,
          [input.userId],
        )
      ).rows as { id: string; remaining: number }[];
      for (const g of grants) {
        if (rest <= 0) break;
        const take = Math.min(rest, g.remaining);
        await db.query(`UPDATE credit_grants SET remaining = remaining - $2 WHERE id = $1`, [g.id, take]);
        rest -= take;
      }
    }
    if (existing) {
      await db.query(
        `UPDATE usage_events SET pages = GREATEST(pages, $2), from_allowance = from_allowance + $3, from_credits = from_credits + $4,
                reexports = reexports + 1, format = $5
          WHERE id = $1`,
        [existing.id, input.pages, fromAllowance, fromCredits, input.format],
      );
    } else {
      await db.query(
        `INSERT INTO usage_events (user_id, period, pages, from_allowance, from_credits, document_hash, format, bank_id, reconciled)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          input.userId,
          period,
          input.pages,
          fromAllowance,
          fromCredits,
          input.documentHash,
          input.format,
          input.bankId ?? null,
          input.reconciled ?? null,
        ],
      );
    }
    return { charged: toCharge, alreadyPaid: false, email: user.email };
  });
  const state = await accountState(input.userId);
  // Lifecycle: warn once per month at 80 % of the allowance (not for users with credits left).
  if (!result.alreadyPaid && state.monthlyLimit > 0 && state.usedThisMonth >= state.monthlyLimit * 0.8 && state.credits === 0) {
    await sendEmail(
      "quota_warning",
      result.email,
      { used: state.usedThisMonth, limit: state.monthlyLimit, pricingUrl: absoluteUrl("/tarifs") },
      { userId: input.userId, dedupeKey: `quota_warning:${input.userId}:${state.period}` },
    );
  }
  return { charged: result.charged, alreadyPaid: result.alreadyPaid, state };
}

export async function grantCredits(
  db: Pick<PoolClient, "query">,
  userId: string,
  pages: number,
  source: string,
  reference: string,
  months = 12,
): Promise<boolean> {
  const res = await db.query(
    `INSERT INTO credit_grants (user_id, pages, remaining, source, reference, expires_at)
     VALUES ($1, $2, $2, $3, $4, now() + make_interval(months => $5))
     ON CONFLICT (source, reference) DO NOTHING RETURNING id`,
    [userId, pages, source, reference, months],
  );
  return res.rows.length > 0;
}

function frDate(d: Date | null | undefined) {
  return d ? new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeZone: "Europe/Paris" }).format(d) : null;
}

/**
 * Applies provider-agnostic billing events. Each webhook delivery is recorded in
 * webhook_events; a delivery already processed is acknowledged without side effects.
 */
export async function processWebhook(provider: PaymentProvider, rawBody: string, headers: Headers): Promise<{ duplicate: boolean }> {
  const parsed = await provider.parseWebhook(rawBody, headers);
  const claimed = await query(
    `INSERT INTO webhook_events (provider, event_id, event_type) VALUES ($1, $2, $3)
     ON CONFLICT (provider, event_id) DO UPDATE SET received_at = now()
     WHERE webhook_events.processed_at IS NULL
     RETURNING processed_at`,
    [provider.name, parsed.eventId, parsed.eventType],
  );
  if (!claimed.length) return { duplicate: true };

  const emails: (() => Promise<unknown>)[] = [];
  try {
    await transaction(async (db) => {
      for (const ev of parsed.events) await applyEvent(db, provider.name, ev, emails);
      await db.query(`UPDATE webhook_events SET processed_at = now(), error = NULL WHERE provider = $1 AND event_id = $2`, [
        provider.name,
        parsed.eventId,
      ]);
    });
  } catch (e) {
    await query(`UPDATE webhook_events SET error = $3 WHERE provider = $1 AND event_id = $2`, [
      provider.name,
      parsed.eventId,
      e instanceof Error ? e.message.slice(0, 500) : "error",
    ]);
    throw e;
  }
  // Side effects (e-mails) only after the transaction committed.
  for (const send of emails) await send().catch((e) => console.error("[billing] email failed", e));
  return { duplicate: false };
}

async function resolveUser(db: Pick<PoolClient, "query">, userId: string | undefined, providerName: string, subscriptionId?: string) {
  if (userId) {
    const u = (await db.query(`SELECT id, email FROM users WHERE id = $1`, [userId])).rows[0];
    if (u) return u as { id: string; email: string };
  }
  if (subscriptionId) {
    const u = (
      await db.query(
        `SELECT u.id, u.email FROM subscriptions s JOIN users u ON u.id = s.user_id WHERE s.provider = $1 AND s.provider_subscription_id = $2`,
        [providerName, subscriptionId],
      )
    ).rows[0];
    if (u) return u as { id: string; email: string };
  }
  return null;
}

async function applyEvent(db: PoolClient, providerName: string, ev: BillingEvent, emails: (() => Promise<unknown>)[]) {
  switch (ev.type) {
    case "ignored":
      return;
    case "pack.paid": {
      const user = await resolveUser(db, ev.userId, providerName);
      if (!user) throw new Error(`pack.paid for unknown user ${ev.userId}`);
      const inserted = await db.query(
        `INSERT INTO orders (user_id, provider, provider_order_id, kind, product, amount_cents, currency, status, receipt_url)
         VALUES ($1, $2, $3, 'pack', 'pack', $4, $5, 'paid', $6)
         ON CONFLICT (provider, provider_order_id) DO NOTHING RETURNING id`,
        [user.id, providerName, ev.orderId, ev.amount, ev.currency, ev.receiptUrl ?? null],
      );
      const granted = await grantCredits(db, user.id, PACK.pages, "pack", `${providerName}:${ev.orderId}`, PACK.validityMonths);
      if (inserted.rows.length && granted) {
        const expires = new Date(Date.now() + PACK.validityMonths * 30.5 * 86400_000);
        emails.push(() =>
          sendEmail(
            "pack_purchased",
            user.email,
            { pages: PACK.pages, expires: frDate(expires)!, appUrl: absoluteUrl("/convertir") },
            { userId: user.id, dedupeKey: `pack:${providerName}:${ev.orderId}` },
          ),
        );
        emails.push(() =>
          trackServer("purchase_completed", {
            userId: user.id,
            props: { product: "pack", amount: ev.amount, currency: ev.currency, provider: providerName },
          }),
        );
      }
      return;
    }
    case "subscription.upsert": {
      const user = await resolveUser(db, ev.userId, providerName, ev.subscriptionId);
      if (!user) throw new Error(`subscription event for unknown user (${ev.subscriptionId})`);
      const before = (
        await db.query(`SELECT status, cancel_at_period_end FROM subscriptions WHERE provider = $1 AND provider_subscription_id = $2`, [
          providerName,
          ev.subscriptionId,
        ])
      ).rows[0] as { status: string; cancel_at_period_end: boolean } | undefined;
      await db.query(
        `INSERT INTO subscriptions (user_id, provider, provider_subscription_id, provider_customer_id, plan, interval, status, current_period_end, cancel_at_period_end, portal_url, last_event_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         ON CONFLICT (provider, provider_subscription_id) DO UPDATE SET
           provider_customer_id = COALESCE(EXCLUDED.provider_customer_id, subscriptions.provider_customer_id),
           plan = EXCLUDED.plan, interval = EXCLUDED.interval, status = EXCLUDED.status,
           current_period_end = COALESCE(EXCLUDED.current_period_end, subscriptions.current_period_end),
           cancel_at_period_end = EXCLUDED.cancel_at_period_end,
           portal_url = COALESCE(EXCLUDED.portal_url, subscriptions.portal_url),
           last_event_at = COALESCE(EXCLUDED.last_event_at, subscriptions.last_event_at),
           updated_at = now()
         -- Providers do not guarantee delivery order: never let an older event overwrite a newer state.
         WHERE subscriptions.last_event_at IS NULL OR EXCLUDED.last_event_at IS NULL OR EXCLUDED.last_event_at >= subscriptions.last_event_at`,
        [
          user.id,
          providerName,
          ev.subscriptionId,
          ev.customerId ?? null,
          ev.plan,
          ev.interval,
          ev.status,
          ev.currentPeriodEnd ?? null,
          ev.cancelAtPeriodEnd,
          ev.portalUrl ?? null,
          ev.eventTime ?? null,
        ],
      );
      const planName = PLANS[ev.plan].name;
      if (!before && ev.status === "active") {
        emails.push(() =>
          sendEmail(
            "subscription_started",
            user.email,
            { planName, pages: PLANS[ev.plan].monthlyPages, appUrl: absoluteUrl("/convertir") },
            { userId: user.id, dedupeKey: `sub_started:${providerName}:${ev.subscriptionId}` },
          ),
        );
        emails.push(() =>
          trackServer("subscription_started", { userId: user.id, props: { plan: ev.plan, interval: ev.interval, provider: providerName } }),
        );
      }
      const nowCanceling =
        (ev.cancelAtPeriodEnd || ev.status === "canceled") && !(before?.cancel_at_period_end || before?.status === "canceled");
      if (before && nowCanceling) {
        emails.push(() =>
          sendEmail(
            "subscription_canceled",
            user.email,
            { planName, endDate: frDate(ev.currentPeriodEnd), billingUrl: absoluteUrl("/compte/abonnement") },
            { userId: user.id, dedupeKey: `sub_canceled:${providerName}:${ev.subscriptionId}:${ev.currentPeriodEnd?.toISOString() ?? ""}` },
          ),
        );
        emails.push(() => trackServer("subscription_canceled", { userId: user.id, props: { plan: ev.plan, provider: providerName } }));
      }
      return;
    }
    case "subscription.payment": {
      const user = await resolveUser(db, ev.userId, providerName, ev.subscriptionId);
      if (!user) throw new Error(`subscription payment for unknown subscription ${ev.subscriptionId}`);
      const sub = (
        await db.query(`SELECT plan, interval FROM subscriptions WHERE provider = $1 AND provider_subscription_id = $2`, [
          providerName,
          ev.subscriptionId,
        ])
      ).rows[0] as { plan: "pro" | "business"; interval: "month" | "year" } | undefined;
      const product = ev.product ?? (sub ? (`${sub.plan}_${sub.interval === "year" ? "yearly" : "monthly"}` as const) : "subscription");
      await db.query(
        `INSERT INTO orders (user_id, provider, provider_order_id, kind, product, amount_cents, currency, status, receipt_url)
         VALUES ($1, $2, $3, 'subscription_payment', $4, $5, $6, $7, $8)
         ON CONFLICT (provider, provider_order_id) DO UPDATE SET status = EXCLUDED.status, receipt_url = COALESCE(EXCLUDED.receipt_url, orders.receipt_url)`,
        [user.id, providerName, ev.orderId, product, ev.amount, ev.currency, ev.status, ev.receiptUrl ?? null],
      );
      if (ev.status === "failed") {
        await db.query(
          `UPDATE subscriptions SET status = 'past_due', updated_at = now() WHERE provider = $1 AND provider_subscription_id = $2 AND status = 'active'`,
          [providerName, ev.subscriptionId],
        );
        const planName = sub ? PLANS[sub.plan].name : "Relevéo";
        emails.push(() =>
          sendEmail(
            "payment_failed",
            user.email,
            { planName, billingUrl: absoluteUrl("/compte/abonnement") },
            { userId: user.id, dedupeKey: `payment_failed:${providerName}:${ev.orderId}` },
          ),
        );
        emails.push(() => trackServer("payment_failed", { userId: user.id, props: { provider: providerName } }));
      } else {
        await db.query(
          `UPDATE subscriptions SET status = 'active', updated_at = now() WHERE provider = $1 AND provider_subscription_id = $2 AND status = 'past_due'`,
          [providerName, ev.subscriptionId],
        );
        emails.push(() =>
          trackServer("payment_succeeded", {
            userId: user.id,
            props: { amount: ev.amount, currency: ev.currency, product, provider: providerName },
          }),
        );
      }
      return;
    }
    case "order.refunded": {
      if (!ev.orderId) return;
      const order = (
        await db.query(`UPDATE orders SET status = 'refunded' WHERE provider = $1 AND provider_order_id = $2 RETURNING user_id, kind`, [
          providerName,
          ev.orderId,
        ])
      ).rows[0] as { user_id: string; kind: string } | undefined;
      if (order?.kind === "pack") {
        // Remove the unused part of the refunded pack.
        await db.query(`UPDATE credit_grants SET remaining = 0 WHERE source = 'pack' AND reference = $1`, [
          `${providerName}:${ev.orderId}`,
        ]);
      }
      return;
    }
  }
}

export { PRODUCTS };
