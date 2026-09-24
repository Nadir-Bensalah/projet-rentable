import { z } from "zod";
import { requireUser } from "@/lib/auth/guard";
import { passwordProblem } from "@/lib/auth/password";
import { currentSessionToken, destroyAllSessions } from "@/lib/auth/session";
import { changePassword } from "@/lib/auth/service";
import { rateLimit } from "@/lib/security/rate-limit";
import { HttpError, assertSameOrigin, handler, json, readJson } from "@/lib/security/request";

const schema = z.object({ current: z.string().min(1).max(200), next: z.string().max(200) });

export const POST = handler(async (req) => {
  assertSameOrigin(req);
  const user = await requireUser();
  const rl = await rateLimit(`pwchange:${user.id}`, 10, 900);
  if (!rl.ok) throw new HttpError(429, "Trop de tentatives. Réessayez plus tard.", "rate_limited");
  const body = await readJson(req, schema);
  if (body.next === body.current) throw new HttpError(422, "Le nouveau mot de passe doit être différent de l'actuel.", "same_password");
  const problem = passwordProblem(body.next, user.email);
  if (problem) throw new HttpError(422, problem, "weak_password");
  const ok = await changePassword(user.id, body.current, body.next);
  if (!ok) throw new HttpError(400, "Le mot de passe actuel est incorrect.", "bad_password");
  await destroyAllSessions(user.id, await currentSessionToken());
  return json({ ok: true });
});
