import { env } from "@/lib/env";
import { paymentProvider, processWebhook } from "@/lib/billing";
import { ProviderConfigError, WebhookSignatureError } from "@/lib/billing/types";
import { HttpError, readBodyLimited } from "@/lib/security/request";

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
  let raw: string;
  try {
    raw = await readBodyLimited(req, MAX_BODY);
  } catch (e) {
    return new Response(e instanceof HttpError ? e.message : "Bad request", { status: e instanceof HttpError ? e.status : 400 });
  }
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
