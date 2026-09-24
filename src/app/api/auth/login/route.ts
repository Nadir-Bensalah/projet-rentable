import { z } from "zod";
import { trackServer } from "@/lib/analytics/server";
import { createSession } from "@/lib/auth/session";
import { authenticate, normaliseEmail } from "@/lib/auth/service";
import { rateLimit } from "@/lib/security/rate-limit";
import { sha256 } from "@/lib/security/tokens";
import { HttpError, assertSameOrigin, handler, ipHash, json, readJson } from "@/lib/security/request";

const schema = z.object({
  email: z.string().trim().max(254).email("Adresse e-mail invalide."),
  password: z.string().min(1, "Mot de passe requis.").max(200),
});

export const POST = handler(async (req) => {
  assertSameOrigin(req);
  const body = await readJson(req, schema);
  const ip = ipHash(req);
  const byIp = await rateLimit(`login:ip:${ip}`, 30, 900);
  const byEmail = await rateLimit(`login:email:${sha256(normaliseEmail(body.email))}`, 10, 900);
  if (!byIp.ok || !byEmail.ok) {
    const retry = Math.max(byIp.retryAfter, byEmail.retryAfter);
    throw new HttpError(429, "Trop de tentatives de connexion. Patientez quelques minutes.", "rate_limited", { "Retry-After": String(retry) });
  }
  const user = await authenticate(body.email, body.password);
  if (!user) throw new HttpError(401, "E-mail ou mot de passe incorrect.", "invalid_credentials");
  await createSession(user.id, { userAgent: req.headers.get("user-agent"), ipHash: ip });
  await trackServer("login", { userId: user.id });
  return json({ ok: true, user: { id: user.id, email: user.email, emailVerified: !!user.email_verified_at } });
});
