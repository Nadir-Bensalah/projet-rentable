import "server-only";
import { PRODUCTS, type ProductId } from "@/config/plans";
import { env } from "@/lib/env";
import { hmacSha256Hex, safeEqualHex, sha256 } from "@/lib/security/tokens";
import { ProviderConfigError, WebhookSignatureError, type BillingEvent, type PaymentProvider, type SubscriptionStatus } from "../types";

/**
 * Lemon Squeezy (merchant of record: collects and remits VAT worldwide, which suits a
 * French micro-entrepreneur selling to consumers across the EU).
 * One variant per product: LEMONSQUEEZY_VARIANT_*.
 */

const API = "https://api.lemonsqueezy.com/v1";

function variantMap(): Record<ProductId, string | undefined> {
  const e = env();
  return {
    pack: e.LEMONSQUEEZY_VARIANT_PACK,
    pro_monthly: e.LEMONSQUEEZY_VARIANT_PRO_MONTHLY,
    pro_yearly: e.LEMONSQUEEZY_VARIANT_PRO_YEARLY,
    business_monthly: e.LEMONSQUEEZY_VARIANT_BUSINESS_MONTHLY,
    business_yearly: e.LEMONSQUEEZY_VARIANT_BUSINESS_YEARLY,
  };
}

function productFromVariant(variantId: string | number | undefined): ProductId | undefined {
  if (variantId === undefined || variantId === null) return undefined;
  const entry = Object.entries(variantMap()).find(([, v]) => v === String(variantId));
  return entry?.[0] as ProductId | undefined;
}

async function ls<T>(method: "GET" | "POST" | "DELETE", path: string, body?: unknown): Promise<T> {
  const key = env().LEMONSQUEEZY_API_KEY;
  if (!key) throw new ProviderConfigError("LEMONSQUEEZY_API_KEY is not configured");
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${key}`,
      Accept: "application/vnd.api+json",
      "Content-Type": "application/vnd.api+json",
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(15_000),
  });
  const json = (await res.json().catch(() => ({}))) as T & { errors?: { detail?: string }[] };
  if (!res.ok) throw new Error(`Lemon Squeezy ${method} ${path} failed: ${json.errors?.[0]?.detail ?? res.status}`);
  return json;
}

export function verifyLemonSignature(rawBody: string, signature: string | null, secret: string) {
  if (!signature) throw new WebhookSignatureError("Missing X-Signature");
  if (!safeEqualHex(signature, hmacSha256Hex(secret, rawBody))) throw new WebhookSignatureError();
}

function mapStatus(s: string): SubscriptionStatus {
  switch (s) {
    case "active":
    case "on_trial":
      return "active";
    case "past_due":
      return "past_due";
    // Dunning is over and the payment still failed: no access.
    case "unpaid":
      return "unpaid";
    case "paused":
      return "paused";
    case "cancelled":
      return "canceled";
    default:
      return "expired";
  }
}

export const lemonSqueezyProvider: PaymentProvider = {
  name: "lemonsqueezy",

  async createCheckout({ product, user, successUrl }) {
    const variant = variantMap()[product.id];
    const store = env().LEMONSQUEEZY_STORE_ID;
    if (!variant || !store) throw new ProviderConfigError(`No Lemon Squeezy variant configured for ${product.id}`);
    const res = await ls<{ data: { attributes: { url: string } } }>("POST", "/checkouts", {
      data: {
        type: "checkouts",
        attributes: {
          checkout_data: { email: user.email, custom: { user_id: user.id, product: product.id } },
          checkout_options: { embed: false },
          product_options: { redirect_url: successUrl, enabled_variants: [Number(variant)] },
          expires_at: new Date(Date.now() + 3600_000).toISOString(),
        },
        relationships: {
          store: { data: { type: "stores", id: String(store) } },
          variant: { data: { type: "variants", id: String(variant) } },
        },
      },
    });
    return { url: res.data.attributes.url };
  },

  async createPortal({ subscription }) {
    // The signed portal URL expires (24 h), so a fresh one is fetched on every request;
    // the URL stored from the last webhook is only a fallback when the API is unreachable.
    try {
      const res = await ls<{ data: { attributes: { urls: { customer_portal: string } } } }>(
        "GET",
        `/subscriptions/${encodeURIComponent(subscription.providerSubscriptionId)}`,
      );
      return { url: res.data.attributes.urls.customer_portal };
    } catch (e) {
      if (subscription.portalUrl) return { url: subscription.portalUrl };
      throw e;
    }
  },

  async cancelSubscription(subscription) {
    await ls("DELETE", `/subscriptions/${encodeURIComponent(subscription.providerSubscriptionId)}`);
  },

  async parseWebhook(rawBody, headers) {
    const secret = env().LEMONSQUEEZY_WEBHOOK_SECRET;
    if (!secret) throw new ProviderConfigError("LEMONSQUEEZY_WEBHOOK_SECRET is not configured");
    verifyLemonSignature(rawBody, headers.get("x-signature"), secret);
    const body = JSON.parse(rawBody) as {
      meta: { event_name: string; test_mode?: boolean; custom_data?: Record<string, string> };
      data: { id: string; attributes: Record<string, unknown> };
    };
    const name = body.meta.event_name;
    const a = body.data.attributes;
    const userId = body.meta.custom_data?.user_id;
    const events: BillingEvent[] = [];
    const eventId = `${name}:${sha256(rawBody).slice(0, 32)}`;
    if (env().PAYMENT_MODE === "live" && body.meta.test_mode) {
      return { eventId, eventType: name, events: [{ type: "ignored", reason: "test-mode event in live mode" }] };
    }
    // Only events of our own store count (custom data can be set by anyone on a public checkout).
    const storeId = env().LEMONSQUEEZY_STORE_ID;
    if (storeId && a.store_id !== undefined && String(a.store_id) !== String(storeId)) {
      return { eventId, eventType: name, events: [{ type: "ignored", reason: "other store" }] };
    }
    const eventTime = typeof a.updated_at === "string" ? new Date(a.updated_at) : undefined;
    switch (name) {
      case "order_created": {
        const item = a.first_order_item as { variant_id?: number } | undefined;
        // The product is derived from the configured variant only — never from custom data.
        const product = productFromVariant(item?.variant_id);
        // The variant identifies the product; the amount may be lower with a discount code.
        if (a.status === "paid" && product === "pack" && userId) {
          events.push({
            type: "pack.paid",
            userId,
            orderId: body.data.id,
            amount: Number(a.total),
            currency: String(a.currency ?? "EUR").toUpperCase(),
            receiptUrl: (a.urls as { receipt?: string } | undefined)?.receipt,
          });
        } else {
          events.push({ type: "ignored", reason: `order ${String(a.status)} ${product}` });
        }
        break;
      }
      case "subscription_created":
      case "subscription_updated":
      case "subscription_cancelled":
      case "subscription_resumed":
      case "subscription_expired":
      case "subscription_paused":
      case "subscription_unpaused": {
        const product = productFromVariant(a.variant_id as number);
        const info = product ? PRODUCTS[product] : undefined;
        if (!info || info.kind !== "subscription") {
          events.push({ type: "ignored", reason: "unknown variant" });
          break;
        }
        const status = mapStatus(String(a.status));
        const end = (a.ends_at as string | null) ?? (a.renews_at as string | null);
        events.push({
          type: "subscription.upsert",
          userId,
          customerId: String(a.customer_id),
          subscriptionId: body.data.id,
          plan: info.plan!,
          interval: info.interval!,
          status,
          currentPeriodEnd: end ? new Date(end) : undefined,
          cancelAtPeriodEnd: !!a.cancelled && status !== "expired",
          portalUrl: (a.urls as { customer_portal?: string } | undefined)?.customer_portal,
          eventTime,
        });
        break;
      }
      case "subscription_payment_success":
      case "subscription_payment_failed":
      case "subscription_payment_recovered": {
        const subscriptionId = String(a.subscription_id);
        // Product label comes from the stored subscription (see billing service).
        const product: ProductId | undefined = undefined;
        events.push({
          type: "subscription.payment",
          userId,
          subscriptionId,
          orderId: `inv_${body.data.id}`,
          amount: Number(a.total),
          currency: String(a.currency ?? "EUR").toUpperCase(),
          status: name === "subscription_payment_failed" ? "failed" : "paid",
          receiptUrl: (a.urls as { invoice_url?: string } | undefined)?.invoice_url,
          product: product && PRODUCTS[product] ? product : undefined,
        });
        break;
      }
      case "order_refunded":
        events.push({ type: "order.refunded", orderId: body.data.id, amount: Number(a.refunded_amount ?? a.total) });
        break;
      // Subscription payments are stored as inv_<subscription invoice id>.
      case "subscription_payment_refunded":
        events.push({ type: "order.refunded", orderId: `inv_${body.data.id}`, amount: Number(a.refunded_amount ?? a.total) });
        break;
      default:
        events.push({ type: "ignored", reason: name });
    }
    // Lemon Squeezy does not send an event id: the body hash makes retries idempotent.
    return { eventId, eventType: name, events };
  },
};
