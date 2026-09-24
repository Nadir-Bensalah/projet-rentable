import "server-only";
import { z } from "zod";

/**
 * Centralised, validated server configuration.
 * Every external dependency (payments, email, analytics) is selected here
 * through a provider name + secrets, so going live is a configuration change.
 */
const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_URL: z.string().url().default("http://localhost:3000"),
  DATABASE_URL: z.string().min(1).default("postgres://postgres@localhost:5432/releveo"),
  DATABASE_SSL: z.enum(["true", "false"]).default("false"),

  // Secret used to sign internal tokens (mock checkout, etc.). 32+ chars in production.
  AUTH_SECRET: z.string().min(16).default("dev-only-insecure-secret-change-me"),

  // Payments
  PAYMENT_PROVIDER: z.enum(["mock", "stripe", "lemonsqueezy"]).default("mock"),
  // "live" ignores provider test-mode events; keep "test" while configuring the provider.
  PAYMENT_MODE: z.enum(["test", "live"]).default("test"),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_PRICE_PACK: z.string().optional(),
  STRIPE_PRICE_PRO_MONTHLY: z.string().optional(),
  STRIPE_PRICE_PRO_YEARLY: z.string().optional(),
  STRIPE_PRICE_BUSINESS_MONTHLY: z.string().optional(),
  STRIPE_PRICE_BUSINESS_YEARLY: z.string().optional(),
  LEMONSQUEEZY_API_KEY: z.string().optional(),
  LEMONSQUEEZY_STORE_ID: z.string().optional(),
  LEMONSQUEEZY_WEBHOOK_SECRET: z.string().optional(),
  LEMONSQUEEZY_VARIANT_PACK: z.string().optional(),
  LEMONSQUEEZY_VARIANT_PRO_MONTHLY: z.string().optional(),
  LEMONSQUEEZY_VARIANT_PRO_YEARLY: z.string().optional(),
  LEMONSQUEEZY_VARIANT_BUSINESS_MONTHLY: z.string().optional(),
  LEMONSQUEEZY_VARIANT_BUSINESS_YEARLY: z.string().optional(),

  // Email
  EMAIL_PROVIDER: z.enum(["console", "smtp", "resend"]).default("console"),
  EMAIL_FROM: z.string().default("Relevéo <bonjour@releveo.fr>"),
  EMAIL_REPLY_TO: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  SMTP_URL: z.string().optional(),

  // Analytics (first-party events are always stored; Plausible is optional)
  PLAUSIBLE_DOMAIN: z.string().optional(),
  PLAUSIBLE_SRC: z.string().optional(),

  // Operations
  ADMIN_EMAILS: z.string().default(""),
  CRON_SECRET: z.string().optional(),
  SUPPORT_EMAIL: z.string().default("support@releveo.fr"),
});

export type Env = z.infer<typeof schema>;

function load(): Env {
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error("Invalid environment configuration: " + parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "));
  }
  const env = parsed.data;
  if (env.NODE_ENV === "production" && process.env.NEXT_PHASE !== "phase-production-build") {
    assertProductionReady(env);
  }
  return env;
}

/** Fail fast instead of silently running production on dev defaults. */
export function assertProductionReady(env: Env) {
  const problems: string[] = [];
  if (!env.APP_URL.startsWith("https://") && process.env.ALLOW_HTTP_APP_URL !== "true") {
    problems.push("APP_URL must use https:// in production (secure cookies); set ALLOW_HTTP_APP_URL=true only for local production tests");
  }
  if (env.AUTH_SECRET.length < 32 || env.AUTH_SECRET.startsWith("dev-only")) {
    problems.push("AUTH_SECRET must be a random string of at least 32 characters");
  }
  if (env.PAYMENT_PROVIDER === "mock" && process.env.ALLOW_MOCK_PAYMENTS !== "true") {
    problems.push("PAYMENT_PROVIDER=mock is not allowed in production (set ALLOW_MOCK_PAYMENTS=true for a staging demo)");
  }
  if (env.PAYMENT_PROVIDER === "stripe" && (!env.STRIPE_SECRET_KEY || !env.STRIPE_WEBHOOK_SECRET)) {
    problems.push("Stripe requires STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET");
  }
  if (
    env.PAYMENT_PROVIDER === "lemonsqueezy" &&
    (!env.LEMONSQUEEZY_API_KEY || !env.LEMONSQUEEZY_STORE_ID || !env.LEMONSQUEEZY_WEBHOOK_SECRET)
  ) {
    problems.push("Lemon Squeezy requires LEMONSQUEEZY_API_KEY, LEMONSQUEEZY_STORE_ID and LEMONSQUEEZY_WEBHOOK_SECRET");
  }
  if (env.EMAIL_PROVIDER === "resend" && !env.RESEND_API_KEY) problems.push("RESEND_API_KEY missing");
  if (env.EMAIL_PROVIDER === "smtp" && !env.SMTP_URL) problems.push("SMTP_URL missing");
  if (problems.length) {
    throw new Error("Production configuration incomplete:\n- " + problems.join("\n- "));
  }
}

let cached: Env | undefined;
export function env(): Env {
  if (!cached) cached = load();
  return cached;
}

export function isAdminEmail(email: string): boolean {
  return env()
    .ADMIN_EMAILS.split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
    .includes(email.toLowerCase());
}
