import { env } from "@/lib/env";
import { paymentProvider, processWebhook } from "@/lib/billing";
import { ProviderConfigError, WebhookSignatureError } from "@/lib/billing/types";

const MAX_BODY = 512 * 1024;

/**
 * Payment provider webhooks. Only the configured provider is accepted.
 * Responds 2xx once the event is durably processed (or was already processed),
 * 400 on bad signatures, and 500 on processing errors so the provider retries.
 */
export async function POST(req: Request, ctx: { params: Promise<{ provider: string }> }) {
  const { provider: name } = await ctx.params;
  const configured = env().PAYMENT_PROVIDER;
  if (name !== configured) return new Response("Unknown provider", { status: 404 });
  const len = Number(req.headers.get("content-length") ?? "0");
  if (len > MAX_BODY) return new Response("Payload too large", { status: 413 });
  const raw = await req.text();
  if (raw.length > MAX_BODY) return new Response("Payload too large", { status: 413 });
  try {
    const res = await processWebhook(paymentProvider(configured), raw, req.headers);
    return Response.json({ received: true, duplicate: res.duplicate });
  } catch (e) {
    if (e instanceof WebhookSignatureError) return new Response("Invalid signature", { status: 400 });
    if (e instanceof SyntaxError) return new Response("Invalid JSON", { status: 400 });
    if (e instanceof ProviderConfigError) {
      console.error("[webhook] configuration error", e.message);
      return new Response("Not configured", { status: 500 });
    }
    console.error("[webhook] processing failed", e);
    return new Response("Processing failed", { status: 500 });
  }
}
