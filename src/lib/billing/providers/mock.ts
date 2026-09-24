import "server-only";
import { PRODUCTS, isProductId, type ProductId } from "@/config/plans";
import { deriveKey } from "@/lib/security/request";
import { hmacSha256Hex, randomToken, safeEqualHex, sha256 } from "@/lib/security/tokens";
import { WebhookSignatureError, type BillingEvent, type PaymentProvider, type SubscriptionStatus } from "../types";

/**
 * Sandbox payment provider. It never moves money: it renders a local simulated
 * checkout and emits signed webhooks through exactly the same processing path
 * as the real providers. Refused in production unless ALLOW_MOCK_PAYMENTS=true.
 */

function secret() {
  return deriveKey("mock-payments");
}

export interface MockCheckoutToken {
  userId: string;
  email: string;
  product: ProductId;
  successUrl: string;
  cancelUrl: string;
  exp: number;
  nonce: string;
}

export function signMockToken(payload: object): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${hmacSha256Hex(secret(), body)}`;
}

export function verifyMockToken<T>(token: string, typ: "checkout" | "portal"): T | null {
  const [body, sig] = token.split(".");
  if (!body || !sig || !safeEqualHex(sig, hmacSha256Hex(secret(), body))) return null;
  try {
    const data = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as T & { exp?: number; typ?: string };
    if (data.typ !== typ) return null;
    if (!data.exp || data.exp < Date.now()) return null;
    return data;
  } catch {
    return null;
  }
}

export type MockWebhookPayload =
  | { kind: "checkout.completed"; userId: string; product: ProductId; outcome: "paid"; ref: string }
  | {
      kind: "subscription.change";
      userId: string;
      subscriptionId: string;
      product: ProductId;
      status: SubscriptionStatus;
      cancelAtPeriodEnd: boolean;
      periodEnd: string;
    }
  | { kind: "subscription.renewal"; userId: string; subscriptionId: string; product: ProductId; outcome: "paid" | "failed"; ref: string };

export function signMockWebhook(payload: MockWebhookPayload): { body: string; signature: string } {
  const body = JSON.stringify({ id: `evt_mock_${randomToken(12)}`, created: Date.now(), payload });
  return { body, signature: hmacSha256Hex(secret(), body) };
}

export const mockProvider: PaymentProvider = {
  name: "mock",

  async createCheckout({ product, user, successUrl, cancelUrl }) {
    const token = signMockToken({
      typ: "checkout",
      userId: user.id,
      email: user.email,
      product: product.id,
      successUrl,
      cancelUrl,
      exp: Date.now() + 30 * 60_000,
      nonce: randomToken(8),
    } satisfies MockCheckoutToken & { typ: string });
    return { url: `/paiement/simulation?token=${encodeURIComponent(token)}` };
  },

  async createPortal({ user, subscription, returnUrl }) {
    const token = signMockToken({
      typ: "portal",
      userId: user.id,
      subscriptionId: subscription.providerSubscriptionId,
      returnUrl,
      exp: Date.now() + 30 * 60_000,
    });
    return { url: `/paiement/simulation/portail?token=${encodeURIComponent(token)}` };
  },

  async cancelSubscription() {
    // Nothing to call: the local subscription row is updated by the caller.
  },

  async parseWebhook(rawBody, headers) {
    const sig = headers.get("x-mock-signature") ?? "";
    if (!safeEqualHex(sig, hmacSha256Hex(secret(), rawBody))) throw new WebhookSignatureError();
    const parsed = JSON.parse(rawBody) as { id: string; created?: number; payload: MockWebhookPayload };
    const eventTime = parsed.created ? new Date(parsed.created) : undefined;
    const p = parsed.payload;
    if (!isProductId(p.product)) return { eventId: parsed.id, eventType: p.kind, events: [{ type: "ignored", reason: "unknown product" }] };
    const product = PRODUCTS[p.product];
    const events: BillingEvent[] = [];
    if (p.kind === "checkout.completed") {
      if (product.kind === "pack") {
        events.push({ type: "pack.paid", userId: p.userId, orderId: `mock_order_${p.ref}`, amount: product.price, currency: "EUR" });
      } else {
        const subscriptionId = `mock_sub_${sha256(p.userId + p.ref).slice(0, 16)}`;
        const end = new Date(Date.now() + (product.interval === "year" ? 365 : 30) * 86400_000);
        events.push({
          type: "subscription.upsert",
          userId: p.userId,
          customerId: `mock_cus_${p.userId.slice(0, 8)}`,
          subscriptionId,
          plan: product.plan!,
          interval: product.interval!,
          status: "active",
          currentPeriodEnd: end,
          cancelAtPeriodEnd: false,
          eventTime,
        });
        events.push({
          type: "subscription.payment",
          userId: p.userId,
          subscriptionId,
          orderId: `mock_inv_${p.ref}`,
          amount: product.price,
          currency: "EUR",
          status: "paid",
          product: product.id,
        });
      }
    } else if (p.kind === "subscription.change") {
      events.push({
        type: "subscription.upsert",
        userId: p.userId,
        subscriptionId: p.subscriptionId,
        plan: product.plan!,
        interval: product.interval!,
        status: p.status,
        currentPeriodEnd: new Date(p.periodEnd),
        cancelAtPeriodEnd: p.cancelAtPeriodEnd,
        eventTime,
      });
    } else if (p.kind === "subscription.renewal") {
      events.push({
        type: "subscription.payment",
        userId: p.userId,
        subscriptionId: p.subscriptionId,
        orderId: `mock_inv_${p.ref}`,
        amount: product.price,
        currency: "EUR",
        status: p.outcome,
        product: product.id,
      });
    }
    return { eventId: parsed.id, eventType: p.kind, events };
  },
};
