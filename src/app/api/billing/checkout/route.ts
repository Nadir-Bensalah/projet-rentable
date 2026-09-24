import { z } from "zod";
import { PRODUCTS, isProductId } from "@/config/plans";
import { absoluteUrl } from "@/config/site";
import { trackServer } from "@/lib/analytics/server";
import { requireUser } from "@/lib/auth/guard";
import { currentSubscription, paymentProvider } from "@/lib/billing";
import { rateLimit } from "@/lib/security/rate-limit";
import { HttpError, assertSameOrigin, handler, json, readJson } from "@/lib/security/request";

const schema = z.object({ product: z.string().refine(isProductId, "Offre inconnue.") });

export const POST = handler(async (req) => {
  assertSameOrigin(req);
  const user = await requireUser();
  if (!user.emailVerified) {
    throw new HttpError(403, "Confirmez votre adresse e-mail avant de passer commande (elle recevra vos factures).", "email_unverified");
  }
  const rl = await rateLimit(`checkout:${user.id}`, 20, 3600);
  if (!rl.ok) throw new HttpError(429, "Trop de tentatives. Réessayez plus tard.", "rate_limited");
  const { product: productId } = await readJson(req, schema);
  const product = PRODUCTS[productId as keyof typeof PRODUCTS];
  if (product.kind === "subscription") {
    const existing = await currentSubscription(user.id);
    if (existing && existing.status !== "canceled") {
      throw new HttpError(409, "Vous avez déjà un abonnement actif. Changez d'offre depuis la gestion de votre abonnement.", "already_subscribed");
    }
  }
  const provider = paymentProvider();
  let url: string;
  try {
    ({ url } = await provider.createCheckout({
      product,
      user: { id: user.id, email: user.email },
      successUrl: absoluteUrl(`/compte/abonnement?paiement=succes&offre=${product.id}`),
      cancelUrl: absoluteUrl(`/tarifs?paiement=annule`),
    }));
  } catch (e) {
    console.error("[checkout] provider error", e);
    throw new HttpError(502, "Le paiement est momentanément indisponible. Réessayez dans quelques minutes.", "provider_error");
  }
  await trackServer("checkout_started", { userId: user.id, props: { product: product.id, provider: provider.name } });
  return json({ url });
});
