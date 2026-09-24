import { z } from "zod";
import { env } from "@/lib/env";
import { processWebhook } from "@/lib/billing";
import { mockProvider, signMockWebhook, verifyMockToken, type MockCheckoutToken } from "@/lib/billing/providers/mock";
import { getCurrentUser } from "@/lib/auth/session";
import { HttpError, assertSameOrigin, handler, json, readJson } from "@/lib/security/request";

const schema = z.object({ token: z.string().max(4000), outcome: z.enum(["paid", "failed", "canceled"]) });

/** Simulated checkout completion (sandbox only). Emits a signed webhook through the normal pipeline. */
export const POST = handler(async (req) => {
  assertSameOrigin(req);
  if (env().PAYMENT_PROVIDER !== "mock") throw new HttpError(404, "Indisponible.", "not_found");
  const { token, outcome } = await readJson(req, schema);
  const data = verifyMockToken<MockCheckoutToken>(token, "checkout");
  if (!data) throw new HttpError(400, "Session de paiement expirée. Recommencez depuis la page Tarifs.", "invalid_token");
  const user = await getCurrentUser();
  if (!user || user.id !== data.userId) throw new HttpError(403, "Cette session de paiement appartient à un autre compte.", "forbidden");
  if (outcome === "canceled") return json({ redirect: data.cancelUrl });
  if (outcome === "failed")
    return json({ error: "Paiement refusé par la banque (simulation). Aucun montant n'a été débité.", code: "payment_failed" }, 402);
  const { body, signature } = signMockWebhook({
    kind: "checkout.completed",
    userId: data.userId,
    product: data.product,
    outcome: "paid",
    ref: data.nonce,
  });
  await processWebhook(mockProvider, body, new Headers({ "x-mock-signature": signature }));
  return json({ redirect: data.successUrl });
});
