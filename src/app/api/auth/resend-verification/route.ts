import { requireUser } from "@/lib/auth/guard";
import { sendVerificationEmail } from "@/lib/auth/service";
import { rateLimit } from "@/lib/security/rate-limit";
import { HttpError, assertSameOrigin, handler, json } from "@/lib/security/request";

export const POST = handler(async (req) => {
  assertSameOrigin(req);
  const user = await requireUser();
  if (user.emailVerified) return json({ ok: true, alreadyVerified: true });
  const rl = await rateLimit(`resend:${user.id}`, 3, 3600);
  if (!rl.ok) throw new HttpError(429, "Vous avez déjà demandé plusieurs e-mails. Vérifiez vos courriers indésirables, puis réessayez dans une heure.", "rate_limited");
  await sendVerificationEmail(user);
  return json({ ok: true });
});
