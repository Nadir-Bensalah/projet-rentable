import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { verifyEmail } from "@/lib/auth/service";
import { rateLimit } from "@/lib/security/rate-limit";
import { HttpError, assertSameOrigin, handler, ipHash, json, readJson } from "@/lib/security/request";

const schema = z.object({ token: z.string().min(10).max(100) });

export const POST = handler(async (req) => {
  assertSameOrigin(req);
  const ip = ipHash(req);
  const rl = await rateLimit(`verify:${ip}`, 20, 900);
  if (!rl.ok) throw new HttpError(429, "Trop de tentatives. Réessayez plus tard.", "rate_limited");
  const { token } = await readJson(req, schema);
  const res = await verifyEmail(token);
  if (!res) throw new HttpError(400, "Ce lien est invalide ou a expiré. Demandez un nouvel e-mail de confirmation.", "invalid_token");
  // The link only confirms the address. It never signs anyone in: a forwarded or planted
  // link must not attach the visitor's browser to someone else's account.
  const current = await getCurrentUser();
  return json({ ok: true, signedIn: current?.id === res.userId });
});
