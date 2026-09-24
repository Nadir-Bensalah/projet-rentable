import "server-only";
import { PRODUCTS, type ProductId } from "@/config/plans";
import { env } from "@/lib/env";
import { hmacSha256Hex, safeEqualHex } from "@/lib/security/tokens";
import { ProviderConfigError, WebhookSignatureError, type BillingEvent, type PaymentProvider, type SubscriptionStatus } from "../types";

/**
 * Stripe integration through the REST API (no SDK needed).
 * Configure one Price per product and set the STRIPE_PRICE_* variables.
 */

const API = "https://api.stripe.com/v1";
const TOLERANCE_SECONDS = 300;

function priceMap(): Record<ProductId, string | undefined> {
  const e = env();
  return {
    pack: e.STRIPE_PRICE_PACK,
    pro_monthly: e.STRIPE_PRICE_PRO_MONTHLY,
    pro_yearly: e.STRIPE_PRICE_PRO_YEARLY,
    business_monthly: e.STRIPE_PRICE_BUSINESS_MONTHLY,
    business_yearly: e.STRIPE_PRICE_BUSINESS_YEARLY,
  };
}

function productFromPrice(priceId: string | undefined): ProductId | undefined {
  if (!priceId) return undefined;
  const entry = Object.entries(priceMap()).find(([, v]) => v === priceId);
  return entry?.[0] as ProductId | undefined;
}

function form(data: Record<string, string | number | boolean | undefined>): string {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(data)) if (v !== undefined) p.append(k, String(v));
  return p.toString();
}

async function stripe<T>(
  method: "GET" | "POST" | "DELETE",
  path: string,
  body?: Record<string, string | number | boolean | undefined>,
  idempotencyKey?: string,
): Promise<T> {
  const key = env().STRIPE_SECRET_KEY;
  if (!key) throw new ProviderConfigError("STRIPE_SECRET_KEY is not configured");
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/x-www-form-urlencoded",
      ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
    },
    body: body ? form(body) : undefined,
    signal: AbortSignal.timeout(15_000),
  });
  const json = (await res.json()) as T & { error?: { message?: string } };
  if (!res.ok) throw new Error(`Stripe ${method} ${path} failed: ${json.error?.message ?? res.status}`);
  return json;
}

/** Verifies the Stripe-Signature header (t=timestamp, v1=HMAC-SHA256("t.payload")). */
export function verifyStripeSignature(rawBody: string, header: string | null, secret: string, nowSeconds = Date.now() / 1000) {
  if (!header) throw new WebhookSignatureError("Missing Stripe-Signature");
  const parts = header.split(",").map((p) => p.split("=") as [string, string]);
  const t = parts.find(([k]) => k === "t")?.[1];
  const sigs = parts.filter(([k]) => k === "v1").map(([, v]) => v);
  if (!t || !sigs.length) throw new WebhookSignatureError("Malformed Stripe-Signature");
  if (Math.abs(nowSeconds - Number(t)) > TOLERANCE_SECONDS) throw new WebhookSignatureError("Timestamp outside tolerance");
  const expected = hmacSha256Hex(secret, `${t}.${rawBody}`);
  if (!sigs.some((s) => safeEqualHex(s, expected))) throw new WebhookSignatureError();
}

function mapStatus(s: string): SubscriptionStatus {
  switch (s) {
    case "active":
    case "trialing":
      return "active";
    case "past_due":
    case "unpaid":
      return "past_due";
    case "paused":
      return "paused";
    case "canceled":
      return "canceled";
    default:
      return "expired"; // incomplete_expired, incomplete
  }
}

interface StripeSubscription {
  id: string;
  customer: string;
  status: string;
  cancel_at_period_end: boolean;
  current_period_end?: number;
  metadata?: Record<string, string>;
  items?: { data?: { price?: { id?: string }; current_period_end?: number }[] };
}

function subscriptionEvent(sub: StripeSubscription, eventTime?: Date): BillingEvent {
  const item = sub.items?.data?.[0];
  const product = productFromPrice(item?.price?.id) ?? (sub.metadata?.product as ProductId | undefined);
  const info = product ? PRODUCTS[product] : undefined;
  if (!info || info.kind !== "subscription") return { type: "ignored", reason: `unknown price ${item?.price?.id}` };
  // Newer API versions expose the period end on the subscription item.
  const end = sub.current_period_end ?? item?.current_period_end;
  return {
    type: "subscription.upsert",
    userId: sub.metadata?.user_id,
    customerId: sub.customer,
    subscriptionId: sub.id,
    plan: info.plan!,
    interval: info.interval!,
    status: mapStatus(sub.status),
    currentPeriodEnd: end ? new Date(end * 1000) : undefined,
    cancelAtPeriodEnd: !!sub.cancel_at_period_end,
    eventTime,
  };
}

export const stripeProvider: PaymentProvider = {
  name: "stripe",

  async createCheckout({ product, user, successUrl, cancelUrl }) {
    const price = priceMap()[product.id];
    if (!price) throw new ProviderConfigError(`No Stripe price configured for ${product.id}`);
    const isSub = product.kind === "subscription";
    const session = await stripe<{ url: string }>("POST", "/checkout/sessions", {
      mode: isSub ? "subscription" : "payment",
      "line_items[0][price]": price,
      "line_items[0][quantity]": 1,
      client_reference_id: user.id,
      customer_email: user.email,
      "metadata[user_id]": user.id,
      "metadata[product]": product.id,
      ...(isSub
        ? { "subscription_data[metadata][user_id]": user.id, "subscription_data[metadata][product]": product.id }
        : {
            "payment_intent_data[metadata][user_id]": user.id,
            "payment_intent_data[metadata][product]": product.id,
            "invoice_creation[enabled]": true,
          }),
      allow_promotion_codes: true,
      locale: "fr",
      success_url: successUrl,
      cancel_url: cancelUrl,
      ...(process.env.STRIPE_AUTOMATIC_TAX === "true" ? { "automatic_tax[enabled]": true } : {}),
    });
    return { url: session.url };
  },

  async createPortal({ subscription, returnUrl }) {
    if (!subscription.providerCustomerId) throw new ProviderConfigError("Missing Stripe customer id");
    const s = await stripe<{ url: string }>("POST", "/billing_portal/sessions", {
      customer: subscription.providerCustomerId,
      return_url: returnUrl,
      locale: "fr",
    });
    return { url: s.url };
  },

  async cancelSubscription(subscription) {
    await stripe("DELETE", `/subscriptions/${encodeURIComponent(subscription.providerSubscriptionId)}`);
  },

  async parseWebhook(rawBody, headers) {
    const secret = env().STRIPE_WEBHOOK_SECRET;
    if (!secret) throw new ProviderConfigError("STRIPE_WEBHOOK_SECRET is not configured");
    verifyStripeSignature(rawBody, headers.get("stripe-signature"), secret);
    const evt = JSON.parse(rawBody) as { id: string; type: string; created?: number; livemode?: boolean; data: { object: Record<string, unknown> } };
    const obj = evt.data.object;
    const events: BillingEvent[] = [];
    // In live mode, test-mode events (sent with test keys) must never grant anything.
    if (env().PAYMENT_MODE === "live" && evt.livemode === false) {
      return { eventId: evt.id, eventType: evt.type, events: [{ type: "ignored", reason: "test-mode event in live mode" }] };
    }
    const eventTime = evt.created ? new Date(evt.created * 1000) : undefined;
    switch (evt.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        const s = obj as {
          id: string;
          mode: string;
          payment_status: string;
          amount_total: number;
          currency: string;
          metadata?: Record<string, string>;
          client_reference_id?: string;
          payment_intent?: string | null;
        };
        const userId = s.metadata?.user_id ?? s.client_reference_id;
        if (s.mode === "payment" && s.payment_status === "paid" && userId && s.metadata?.product === "pack") {
          // Stored under the PaymentIntent id so that charge.refunded events match the order.
          events.push({ type: "pack.paid", userId, orderId: s.payment_intent ?? s.id, amount: s.amount_total, currency: s.currency.toUpperCase() });
        } else {
          events.push({ type: "ignored", reason: `checkout ${s.mode} ${s.payment_status}` });
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
      case "customer.subscription.paused":
      case "customer.subscription.resumed":
        events.push(subscriptionEvent(obj as unknown as StripeSubscription, eventTime));
        break;
      case "invoice.paid":
      case "invoice.payment_failed": {
        const inv = obj as {
          id: string;
          amount_paid: number;
          amount_due: number;
          currency: string;
          hosted_invoice_url?: string;
          subscription?: string;
          parent?: { subscription_details?: { subscription?: string; metadata?: Record<string, string> } };
          lines?: { data?: { pricing?: { price_details?: { price?: string } }; price?: { id?: string } }[] };
        };
        const subscriptionId = inv.subscription ?? inv.parent?.subscription_details?.subscription;
        if (!subscriptionId) {
          events.push({ type: "ignored", reason: "invoice without subscription" });
          break;
        }
        const line = inv.lines?.data?.[0];
        const product =
          productFromPrice(line?.price?.id ?? line?.pricing?.price_details?.price) ??
          (inv.parent?.subscription_details?.metadata?.product as ProductId | undefined);
        if (!product) {
          events.push({ type: "ignored", reason: "invoice with unknown price" });
          break;
        }
        const paid = evt.type === "invoice.paid";
        events.push({
          type: "subscription.payment",
          subscriptionId,
          userId: inv.parent?.subscription_details?.metadata?.user_id,
          orderId: inv.id,
          amount: paid ? inv.amount_paid : inv.amount_due,
          currency: inv.currency.toUpperCase(),
          status: paid ? "paid" : "failed",
          receiptUrl: inv.hosted_invoice_url,
          product,
        });
        break;
      }
      case "charge.refunded": {
        const ch = obj as { payment_intent?: string; invoice?: string; amount_refunded: number };
        // Packs are stored by checkout session id; refunds are matched by the admin via the provider dashboard.
        events.push({ type: "order.refunded", orderId: ch.invoice ?? ch.payment_intent ?? "", amount: ch.amount_refunded });
        break;
      }
      default:
        events.push({ type: "ignored", reason: evt.type });
    }
    return { eventId: evt.id, eventType: evt.type, events };
  },
};
