import { z } from "zod";
import { passwordProblem } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { resetPassword } from "@/lib/auth/service";
import { rateLimit } from "@/lib/security/rate-limit";
import { HttpError, assertSameOrigin, handler, ipHash, json, readJson } from "@/lib/security/request";

const schema = z.object({ token: z.string().min(10).max(100), password: z.string().max(200) });

export const POST = handler(async (req) => {
  assertSameOrigin(req);
  const ip = ipHash(req);
  const rl = await rateLimit(`reset:${ip}`, 10, 900);
  if (!rl.ok) throw new HttpError(429, "Trop de tentatives. Réessayez plus tard.", "rate_limited");
  const body = await readJson(req, schema);
  const problem = passwordProblem(body.password);
  if (problem) throw new HttpError(422, problem, "weak_password");
  const user = await resetPassword(body.token, body.password);
  if (!user) throw new HttpError(400, "Ce lien est invalide ou a expiré. Refaites une demande de réinitialisation.", "invalid_token");
  await createSession(user.id, { userAgent: req.headers.get("user-agent"), ipHash: ip });
  return json({ ok: true });
});
