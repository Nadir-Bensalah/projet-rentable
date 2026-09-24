import { absoluteUrl } from "@/config/site";
import { requireUser } from "@/lib/auth/guard";
import { latestSubscription, paymentProvider, toRef } from "@/lib/billing";
import { HttpError, assertSameOrigin, handler, json } from "@/lib/security/request";

export const POST = handler(async (req) => {
  assertSameOrigin(req);
  const user = await requireUser();
  const sub = await latestSubscription(user.id);
  if (!sub) throw new HttpError(404, "Aucun abonnement à gérer.", "no_subscription");
  try {
    const { url } = await paymentProvider(sub.provider as "mock" | "stripe" | "lemonsqueezy").createPortal({
      user: { id: user.id, email: user.email },
      subscription: toRef(sub),
      returnUrl: absoluteUrl("/compte/abonnement"),
    });
    return json({ url });
  } catch (e) {
    console.error("[portal] provider error", e);
    throw new HttpError(502, "La gestion de l'abonnement est momentanément indisponible.", "provider_error");
  }
});
