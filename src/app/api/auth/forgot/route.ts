import { z } from "zod";
import { normaliseEmail, requestPasswordReset } from "@/lib/auth/service";
import { rateLimit } from "@/lib/security/rate-limit";
import { sha256 } from "@/lib/security/tokens";
import { HttpError, assertSameOrigin, handler, ipHash, json, readJson } from "@/lib/security/request";

const schema = z.object({ email: z.string().trim().max(254).email("Adresse e-mail invalide.") });

export const POST = handler(async (req) => {
  assertSameOrigin(req);
  const { email } = await readJson(req, schema);
  const byIp = await rateLimit(`forgot:ip:${ipHash(req)}`, 10, 3600);
  const byEmail = await rateLimit(`forgot:email:${sha256(normaliseEmail(email))}`, 3, 3600);
  if (!byIp.ok) throw new HttpError(429, "Trop de demandes. Réessayez plus tard.", "rate_limited");
  // Same answer whether or not the account exists (no account enumeration).
  if (byEmail.ok) await requestPasswordReset(email);
  return json({ ok: true });
});
