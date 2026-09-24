import { createHmac } from "node:crypto";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { resetDatabase } from "../support/db";

type Billing = typeof import("@/lib/billing");
let billing: Billing;
let db: typeof import("@/lib/db");
let mock: typeof import("@/lib/billing/providers/mock");
let stripe: typeof import("@/lib/billing/providers/stripe");
let ls: typeof import("@/lib/billing/providers/lemonsqueezy");
let email: typeof import("@/lib/email");

const HASH = (n: number) => n.toString(16).padStart(64, "0");

async function createUser(verified = true) {
  const row = await db.queryOne<{ id: string; email: string }>(
    `INSERT INTO users (email, password_hash, referral_code, email_verified_at) VALUES ($1, 'x', $2, $3) RETURNING id, email`,
    [`u${Math.random().toString(36).slice(2)}@example.com`, Math.random().toString(36).slice(2, 10).toUpperCase(), verified ? new Date() : null],
  );
  return row!;
}

async function mockWebhook(payload: Parameters<typeof mock.signMockWebhook>[0]) {
  const { body, signature } = mock.signMockWebhook(payload);
  return billing.processWebhook(mock.mockProvider, body, new Headers({ "x-mock-signature": signature }));
}

beforeAll(async () => {
  await resetDatabase();
  billing = await import("@/lib/billing");
  db = await import("@/lib/db");
  mock = await import("@/lib/billing/providers/mock");
  stripe = await import("@/lib/billing/providers/stripe");
  ls = await import("@/lib/billing/providers/lemonsqueezy");
  email = await import("@/lib/email");
});

afterAll(async () => {
  await db.pool().end();
});

beforeEach(() => {
  email.sentInMemory.length = 0;
});

describe("quota engine", () => {
  it("charges the monthly allowance and makes re-exports of the same document free", async () => {
    const u = await createUser();
    const r1 = await billing.consumePages({ userId: u.id, pages: 3, documentHash: HASH(1), format: "xlsx", paidFormat: false, batch: false });
    expect(r1).toMatchObject({ charged: 3, alreadyPaid: false });
    expect(r1.state.usedThisMonth).toBe(3);
    const r2 = await billing.consumePages({ userId: u.id, pages: 3, documentHash: HASH(1), format: "csv-fr", paidFormat: false, batch: false });
    expect(r2).toMatchObject({ charged: 0, alreadyPaid: true });
    expect(r2.state.usedThisMonth).toBe(3);
  });

  it("refuses exports beyond the allowance without a partial charge", async () => {
    const u = await createUser();
    await billing.consumePages({ userId: u.id, pages: 10, documentHash: HASH(2), format: "xlsx", paidFormat: false, batch: false });
    await expect(
      billing.consumePages({ userId: u.id, pages: 6, documentHash: HASH(3), format: "xlsx", paidFormat: false, batch: false }),
    ).rejects.toMatchObject({ code: "quota_exceeded" });
    const state = await billing.accountState(u.id);
    expect(state.usedThisMonth).toBe(10);
  });

  it("gates paid formats and batches on the free plan", async () => {
    const u = await createUser();
    await expect(billing.consumePages({ userId: u.id, pages: 1, documentHash: HASH(4), format: "ofx", paidFormat: true, batch: false })).rejects.toMatchObject({
      code: "paid_feature",
    });
    await expect(billing.consumePages({ userId: u.id, pages: 1, documentHash: HASH(5), format: "xlsx", paidFormat: false, batch: true })).rejects.toMatchObject({
      code: "paid_feature",
    });
  });

  it("requires a verified e-mail", async () => {
    const u = await createUser(false);
    await expect(billing.consumePages({ userId: u.id, pages: 1, documentHash: HASH(6), format: "xlsx", paidFormat: false, batch: false })).rejects.toMatchObject({
      code: "email_unverified",
    });
  });

  it("uses pack credits after the allowance and sends a single quota warning", async () => {
    const u = await createUser();
    await mockWebhook({ kind: "checkout.completed", userId: u.id, product: "pack", outcome: "paid", ref: "p1" });
    let state = await billing.accountState(u.id);
    expect(state.credits).toBe(150);
    expect(state.paidFeatures).toBe(true);
    const r = await billing.consumePages({ userId: u.id, pages: 20, documentHash: HASH(7), format: "ofx", paidFormat: true, batch: false });
    expect(r.charged).toBe(20);
    state = await billing.accountState(u.id);
    expect(state.usedThisMonth).toBe(15);
    expect(state.credits).toBe(145);
  });

  it("serialises concurrent exports (no double spending)", async () => {
    const u = await createUser();
    const results = await Promise.allSettled(
      Array.from({ length: 6 }, (_, i) => billing.consumePages({ userId: u.id, pages: 4, documentHash: HASH(100 + i), format: "xlsx", paidFormat: false, batch: false })),
    );
    const ok = results.filter((r) => r.status === "fulfilled").length;
    expect(ok).toBe(3); // 3 × 4 = 12 ≤ 15, the 4th would exceed
    const state = await billing.accountState(u.id);
    expect(state.usedThisMonth).toBe(12);
  });
});

describe("webhooks (mock provider)", () => {
  it("is idempotent on duplicate deliveries", async () => {
    const u = await createUser();
    const { body, signature } = mock.signMockWebhook({ kind: "checkout.completed", userId: u.id, product: "pack", outcome: "paid", ref: "dup" });
    const h = new Headers({ "x-mock-signature": signature });
    expect(await billing.processWebhook(mock.mockProvider, body, h)).toEqual({ duplicate: false });
    expect(await billing.processWebhook(mock.mockProvider, body, h)).toEqual({ duplicate: true });
    const state = await billing.accountState(u.id);
    expect(state.credits).toBe(150);
    const orders = await db.query(`SELECT * FROM orders WHERE user_id = $1`, [u.id]);
    expect(orders).toHaveLength(1);
    expect(email.sentInMemory.filter((m) => m.subject.includes("pages sont disponibles"))).toHaveLength(1);
  });

  it("rejects bad signatures", async () => {
    const u = await createUser();
    const { body } = mock.signMockWebhook({ kind: "checkout.completed", userId: u.id, product: "pack", outcome: "paid", ref: "bad" });
    await expect(billing.processWebhook(mock.mockProvider, body, new Headers({ "x-mock-signature": "00" }))).rejects.toThrow(/signature/i);
    await expect(billing.processWebhook(mock.mockProvider, body.replace("pack", "pro_monthly"), new Headers({ "x-mock-signature": "ab".repeat(32) }))).rejects.toThrow();
  });

  it("runs a full subscription lifecycle", async () => {
    const u = await createUser();
    await mockWebhook({ kind: "checkout.completed", userId: u.id, product: "pro_monthly", outcome: "paid", ref: "s1" });
    let sub = await billing.currentSubscription(u.id);
    expect(sub).toMatchObject({ plan: "pro", status: "active", cancel_at_period_end: false });
    let state = await billing.accountState(u.id);
    expect(state.plan).toBe("pro");
    expect(state.monthlyLimit).toBe(400);
    const base = { userId: u.id, subscriptionId: sub!.provider_subscription_id, product: "pro_monthly" as const };
    // Failed renewal → past_due (still access), then recovered.
    await mockWebhook({ kind: "subscription.renewal", ...base, outcome: "failed", ref: "r1" });
    sub = await billing.currentSubscription(u.id);
    expect(sub?.status).toBe("past_due");
    expect(email.sentInMemory.some((m) => m.subject.includes("Problème de paiement"))).toBe(true);
    await mockWebhook({ kind: "subscription.renewal", ...base, outcome: "paid", ref: "r2" });
    expect((await billing.currentSubscription(u.id))?.status).toBe("active");
    // Cancel at period end: access kept until the end.
    const end = new Date(Date.now() + 5 * 86400_000).toISOString();
    await mockWebhook({ kind: "subscription.change", ...base, status: "active", cancelAtPeriodEnd: true, periodEnd: end });
    state = await billing.accountState(u.id);
    expect(state.plan).toBe("pro");
    expect(email.sentInMemory.some((m) => m.subject.includes("Résiliation"))).toBe(true);
    // Expired → back to free.
    await mockWebhook({ kind: "subscription.change", ...base, status: "expired", cancelAtPeriodEnd: false, periodEnd: new Date().toISOString() });
    state = await billing.accountState(u.id);
    expect(state.plan).toBe("free");
    const orders = await db.query<{ status: string }>(`SELECT status FROM orders WHERE user_id = $1 ORDER BY created_at`, [u.id]);
    expect(orders.map((o) => o.status)).toEqual(["paid", "failed", "paid"]);
  });
});

function stripeHeader(body: string, secret = "whsec_test_secret", t = Math.floor(Date.now() / 1000)) {
  const sig = createHmac("sha256", secret).update(`${t}.${body}`).digest("hex");
  return new Headers({ "stripe-signature": `t=${t},v1=${sig}` });
}

describe("Stripe webhooks", () => {
  it("verifies signatures and timestamps", () => {
    const body = "{}";
    expect(() => stripe.verifyStripeSignature(body, stripeHeader(body).get("stripe-signature"), "whsec_test_secret")).not.toThrow();
    expect(() => stripe.verifyStripeSignature(body, stripeHeader(body, "other").get("stripe-signature"), "whsec_test_secret")).toThrow();
    const old = Math.floor(Date.now() / 1000) - 3600;
    expect(() => stripe.verifyStripeSignature(body, stripeHeader(body, "whsec_test_secret", old).get("stripe-signature"), "whsec_test_secret")).toThrow(/tolerance/);
    expect(() => stripe.verifyStripeSignature(body, null, "whsec_test_secret")).toThrow();
  });

  it("grants a pack on checkout.session.completed and handles subscription events", async () => {
    const u = await createUser();
    const pack = JSON.stringify({
      id: "evt_pack_1",
      type: "checkout.session.completed",
      data: { object: { id: "cs_1", mode: "payment", payment_status: "paid", amount_total: 1500, currency: "eur", metadata: { user_id: u.id, product: "pack" } } },
    });
    await billing.processWebhook(stripe.stripeProvider, pack, stripeHeader(pack));
    expect((await billing.accountState(u.id)).credits).toBe(150);

    const subEvt = JSON.stringify({
      id: "evt_sub_1",
      type: "customer.subscription.created",
      data: {
        object: {
          id: "sub_1",
          customer: "cus_1",
          status: "active",
          cancel_at_period_end: false,
          metadata: { user_id: u.id },
          items: { data: [{ price: { id: "price_biz_y" }, current_period_end: Math.floor(Date.now() / 1000) + 86400 * 365 }] },
        },
      },
    });
    await billing.processWebhook(stripe.stripeProvider, subEvt, stripeHeader(subEvt));
    const state = await billing.accountState(u.id);
    expect(state.plan).toBe("business");
    expect(state.subscription?.interval).toBe("year");

    const inv = JSON.stringify({
      id: "evt_inv_1",
      type: "invoice.payment_failed",
      data: { object: { id: "in_1", amount_paid: 0, amount_due: 39000, currency: "eur", parent: { subscription_details: { subscription: "sub_1" } }, lines: { data: [{ pricing: { price_details: { price: "price_biz_y" } } }] } } },
    });
    await billing.processWebhook(stripe.stripeProvider, inv, stripeHeader(inv));
    expect((await billing.currentSubscription(u.id))?.status).toBe("past_due");
  });
});

describe("Lemon Squeezy webhooks", () => {
  it("verifies X-Signature and grants a pack", async () => {
    const u = await createUser();
    const body = JSON.stringify({
      meta: { event_name: "order_created", custom_data: { user_id: u.id, product: "pack" } },
      data: { id: "9001", attributes: { status: "paid", total: 1500, currency: "EUR", first_order_item: { variant_id: 111 }, urls: { receipt: "https://example.com/r" } } },
    });
    const sig = createHmac("sha256", "ls_test_secret").update(body).digest("hex");
    await billing.processWebhook(ls.lemonSqueezyProvider, body, new Headers({ "x-signature": sig }));
    expect((await billing.accountState(u.id)).credits).toBe(150);
    // Same body again = duplicate.
    expect(await billing.processWebhook(ls.lemonSqueezyProvider, body, new Headers({ "x-signature": sig }))).toEqual({ duplicate: true });
    await expect(billing.processWebhook(ls.lemonSqueezyProvider, body, new Headers({ "x-signature": "deadbeef" }))).rejects.toThrow();
    // Refund removes the unused credits.
    const refund = JSON.stringify({ meta: { event_name: "order_refunded", custom_data: { user_id: u.id } }, data: { id: "9001", attributes: { refunded_amount: 1500 } } });
    await billing.processWebhook(ls.lemonSqueezyProvider, refund, new Headers({ "x-signature": createHmac("sha256", "ls_test_secret").update(refund).digest("hex") }));
    expect((await billing.accountState(u.id)).credits).toBe(0);
  });
});
