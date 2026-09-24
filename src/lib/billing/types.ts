import type { BillingInterval, PlanId, ProductId, ProductInfo } from "@/config/plans";

export type SubscriptionStatus = "active" | "past_due" | "canceled" | "expired" | "paused";

/** Provider-agnostic events produced by webhook parsing. */
export type BillingEvent =
  | {
      type: "pack.paid";
      userId: string;
      orderId: string;
      amount: number;
      currency: string;
      receiptUrl?: string;
    }
  | {
      type: "subscription.upsert";
      userId?: string;
      customerId?: string;
      subscriptionId: string;
      plan: Exclude<PlanId, "free">;
      interval: BillingInterval;
      status: SubscriptionStatus;
      currentPeriodEnd?: Date;
      cancelAtPeriodEnd: boolean;
      portalUrl?: string;
      /** Time the provider produced this state, used to discard out-of-order deliveries. */
      eventTime?: Date;
    }
  | {
      type: "subscription.payment";
      userId?: string;
      subscriptionId: string;
      orderId: string;
      amount: number;
      currency: string;
      status: "paid" | "failed";
      receiptUrl?: string;
      /** When unknown, the product is taken from the stored subscription. */
      product?: ProductId;
    }
  | { type: "order.refunded"; orderId: string; amount?: number }
  | { type: "ignored"; reason: string };

export interface ParsedWebhook {
  eventId: string;
  eventType: string;
  events: BillingEvent[];
}

export interface CheckoutInput {
  product: ProductInfo;
  user: { id: string; email: string };
  successUrl: string;
  cancelUrl: string;
}

export interface SubscriptionRef {
  providerSubscriptionId: string;
  providerCustomerId: string | null;
  portalUrl: string | null;
}

export interface PaymentProvider {
  name: "mock" | "stripe" | "lemonsqueezy";
  createCheckout(input: CheckoutInput): Promise<{ url: string }>;
  createPortal(input: { user: { id: string; email: string }; subscription: SubscriptionRef; returnUrl: string }): Promise<{ url: string }>;
  /** Immediate cancellation, used when an account is deleted. */
  cancelSubscription(subscription: SubscriptionRef): Promise<void>;
  /** Verifies the signature and normalises the payload. Throws WebhookSignatureError. */
  parseWebhook(rawBody: string, headers: Headers): Promise<ParsedWebhook>;
}

export class WebhookSignatureError extends Error {
  constructor(message = "Invalid webhook signature") {
    super(message);
    this.name = "WebhookSignatureError";
  }
}

export class ProviderConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProviderConfigError";
  }
}
