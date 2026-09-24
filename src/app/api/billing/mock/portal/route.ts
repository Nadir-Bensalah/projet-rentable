import { z } from "zod";
import { env } from "@/lib/env";
import { processWebhook } from "@/lib/billing";
import { queryOne } from "@/lib/db";
import { mockProvider, signMockWebhook, verifyMockToken } from "@/lib/billing/providers/mock";
import { getCurrentUser } from "@/lib/auth/session";
import { randomToken } from "@/lib/security/tokens";
import { HttpError, assertSameOrigin, handler, json, readJson } from "@/lib/security/request";
import type { ProductId } from "@/config/plans";

const schema = z.object({
  token: z.string().max(4000),
  action: z.enum(["cancel", "resume", "renew", "fail_renewal", "expire"]),
});

/** Simulated customer portal (sandbox only): drives the full subscription lifecycle. */
export const POST = handler(async (req) => {
  assertSameOrigin(req);
  if (env().PAYMENT_PROVIDER !== "mock") throw new HttpError(404, "Indisponible.", "not_found");
  const { token, action } = await readJson(req, schema);
  const data = verifyMockToken<{ userId: string; subscriptionId: string; returnUrl: string }>(token);
  if (!data) throw new HttpError(400, "Session expirée.", "invalid_token");
  const user = await getCurrentUser();
  if (!user || user.id !== data.userId) throw new HttpError(403, "Accès refusé.", "forbidden");
  const sub = await queryOne<{
    plan: string;
    interval: string;
    status: string;
    current_period_end: Date | null;
    cancel_at_period_end: boolean;
  }>(
    `SELECT plan, interval, status, current_period_end, cancel_at_period_end FROM subscriptions WHERE provider = 'mock' AND provider_subscription_id = $1 AND user_id = $2`,
    [data.subscriptionId, user.id],
  );
  if (!sub) throw new HttpError(404, "Abonnement introuvable.", "not_found");
  const product = `${sub.plan}_${sub.interval === "year" ? "yearly" : "monthly"}` as ProductId;
  const periodEnd = sub.current_period_end ?? new Date();
  const base = { userId: user.id, subscriptionId: data.subscriptionId, product };
  const emit = async (payload: Parameters<typeof signMockWebhook>[0]) => {
    const { body, signature } = signMockWebhook(payload);
    await processWebhook(mockProvider, body, new Headers({ "x-mock-signature": signature }));
  };
  switch (action) {
    case "cancel":
      await emit({ kind: "subscription.change", ...base, status: "active", cancelAtPeriodEnd: true, periodEnd: periodEnd.toISOString() });
      break;
    case "resume":
      await emit({ kind: "subscription.change", ...base, status: "active", cancelAtPeriodEnd: false, periodEnd: periodEnd.toISOString() });
      break;
    case "renew": {
      const next = new Date(Math.max(periodEnd.getTime(), Date.now()) + (sub.interval === "year" ? 365 : 30) * 86400_000);
      await emit({ kind: "subscription.renewal", ...base, outcome: "paid", ref: randomToken(8) });
      await emit({
        kind: "subscription.change",
        ...base,
        status: "active",
        cancelAtPeriodEnd: sub.cancel_at_period_end,
        periodEnd: next.toISOString(),
      });
      break;
    }
    case "fail_renewal":
      await emit({ kind: "subscription.renewal", ...base, outcome: "failed", ref: randomToken(8) });
      break;
    case "expire":
      await emit({
        kind: "subscription.change",
        ...base,
        status: "expired",
        cancelAtPeriodEnd: false,
        periodEnd: new Date().toISOString(),
      });
      break;
  }
  return json({ ok: true, redirect: data.returnUrl });
});
