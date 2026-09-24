import { z } from "zod";
import { trackServer } from "@/lib/analytics/server";
import { createSession } from "@/lib/auth/session";
import { authenticate, canonicalEmail } from "@/lib/auth/service";
import { peekRateLimit, rateLimit, resetRateLimit } from "@/lib/security/rate-limit";
import { sha256 } from "@/lib/security/tokens";
import { HttpError, assertSameOrigin, handler, ipHash, json, readJson } from "@/lib/security/request";

const schema = z.object({
  email: z.string().trim().max(254).email("Adresse e-mail invalide."),
  password: z.string().min(1, "Mot de passe requis.").max(200),
});

const PER_EMAIL_IP_FAILURES = 10; // per 15 min, per (account, IP)
const PER_EMAIL_FAILURES = 100; // per hour, all IPs: slows distributed guessing without letting anyone lock the owner out quickly

export const POST = handler(async (req) => {
  assertSameOrigin(req);
  const body = await readJson(req, schema);
  const ip = ipHash(req);
  const emailKey = sha256(canonicalEmail(body.email));
  const tooMany = (retry: number) =>
    new HttpError(429, "Trop de tentatives de connexion. Patientez quelques minutes.", "rate_limited", { "Retry-After": String(retry) });

  const byIp = await rateLimit(`login:ip:${ip}`, 30, 900);
  if (!byIp.ok) throw tooMany(byIp.retryAfter);
  const pairKey = `login:fail:${emailKey}:${ip}`;
  const globalKey = `login:fail:${emailKey}`;
  const [pair, global] = await Promise.all([peekRateLimit(pairKey), peekRateLimit(globalKey)]);
  if (pair.count >= PER_EMAIL_IP_FAILURES) throw tooMany(pair.retryAfter);
  if (global.count >= PER_EMAIL_FAILURES) throw tooMany(global.retryAfter);

  const user = await authenticate(body.email, body.password);
  if (!user) {
    // Only failures count against the account, so a correct password is never blocked by others' noise.
    await rateLimit(pairKey, PER_EMAIL_IP_FAILURES, 900);
    await rateLimit(globalKey, PER_EMAIL_FAILURES, 3600);
    throw new HttpError(401, "E-mail ou mot de passe incorrect.", "invalid_credentials");
  }
  await resetRateLimit(pairKey);
  await createSession(user.id, { userAgent: req.headers.get("user-agent"), ipHash: ip });
  await trackServer("login", { userId: user.id });
  return json({ ok: true, user: { id: user.id, email: user.email, emailVerified: !!user.email_verified_at } });
});
