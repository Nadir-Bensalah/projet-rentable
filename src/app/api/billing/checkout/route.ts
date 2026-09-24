import { z } from "zod";
import { PRODUCTS, isProductId } from "@/config/plans";
import { absoluteUrl } from "@/config/site";
import { trackServer } from "@/lib/analytics/server";
import { requireUser } from "@/lib/auth/guard";
import { WITHDRAWAL_CONSENT_TEXT, WITHDRAWAL_CONSENT_VERSION } from "@/config/consent";
import { currentSubscription, paymentProvider } from "@/lib/billing";
import { query, queryOne } from "@/lib/db";
import { rateLimit } from "@/lib/security/rate-limit";
import { HttpError, assertSameOrigin, handler, json, readJson } from "@/lib/security/request";

const schema = z.object({
  product: z.string().refine(isProductId, "Offre inconnue."),
  // Where the checkout was started, to bring the user back to their work afterwards.
  from: z.enum(["convertir", "tarifs"]).optional(),
  // Express request for immediate performance + acknowledgement of the loss of the withdrawal right.
  consent: z.literal(true, { error: "Cochez la case de demande d'accès immédiat pour continuer." }),
});

export const POST = handler(async (req) => {
  assertSameOrigin(req);
  const user = await requireUser();
  if (!user.emailVerified) {
    throw new HttpError(403, "Confirmez votre adresse e-mail avant de passer commande (elle recevra vos factures).", "email_unverified");
  }
  const rl = await rateLimit(`checkout:${user.id}`, 20, 3600);
  if (!rl.ok) throw new HttpError(429, "Trop de tentatives. Réessayez plus tard.", "rate_limited");
  const { product: productId, from } = await readJson(req, schema);
  const product = PRODUCTS[productId as keyof typeof PRODUCTS];
  if (product.kind === "subscription") {
    const existing = await currentSubscription(user.id);
    if (existing && existing.status !== "canceled") {
      throw new HttpError(
        409,
        "Vous avez déjà un abonnement actif. Changez d'offre depuis la gestion de votre abonnement.",
        "already_subscribed",
      );
    }
  }
  await query(`INSERT INTO checkout_consents (user_id, product, text_version, consent_text) VALUES ($1, $2, $3, $4)`, [
    user.id,
    product.id,
    WITHDRAWAL_CONSENT_VERSION,
    WITHDRAWAL_CONSENT_TEXT,
  ]);
  const provider = paymentProvider();
  // Reuse the provider customer so the portal shows every subscription and invoice.
  const customer = await queryOne<{ provider_customer_id: string }>(
    `SELECT provider_customer_id FROM subscriptions WHERE user_id = $1 AND provider = $2 AND provider_customer_id IS NOT NULL
      ORDER BY updated_at DESC LIMIT 1`,
    [user.id, provider.name],
  );
  let url: string;
  try {
    ({ url } = await provider.createCheckout({
      product,
      user: { id: user.id, email: user.email },
      customerId: customer?.provider_customer_id,
      successUrl: absoluteUrl(`/compte/abonnement?paiement=succes&offre=${product.id}${from === "convertir" ? "&retour=convertir" : ""}`),
      cancelUrl: absoluteUrl(from === "convertir" ? "/convertir?paiement=annule" : "/tarifs?paiement=annule"),
    }));
  } catch (e) {
    console.error("[checkout] provider error", e);
    throw new HttpError(502, "Le paiement est momentanément indisponible. Réessayez dans quelques minutes.", "provider_error");
  }
  await trackServer("checkout_started", { userId: user.id, props: { product: product.id, provider: provider.name } });
  return json({ url });
});
