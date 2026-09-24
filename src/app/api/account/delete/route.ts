import { z } from "zod";
import { requireUser } from "@/lib/auth/guard";
import { destroySession } from "@/lib/auth/session";
import { deleteAccount } from "@/lib/auth/service";
import { rateLimit } from "@/lib/security/rate-limit";
import { HttpError, assertSameOrigin, handler, json, readJson } from "@/lib/security/request";

const schema = z.object({ password: z.string().min(1, "Mot de passe requis.").max(200), confirm: z.literal("SUPPRIMER", { message: "Tapez SUPPRIMER pour confirmer." }) });

export const POST = handler(async (req) => {
  assertSameOrigin(req);
  const user = await requireUser();
  const rl = await rateLimit(`delete:${user.id}`, 5, 900);
  if (!rl.ok) throw new HttpError(429, "Trop de tentatives. Réessayez plus tard.", "rate_limited");
  const body = await readJson(req, schema);
  let result: "ok" | "bad_password";
  try {
    result = await deleteAccount(user.id, body.password);
  } catch (e) {
    throw new HttpError(502, e instanceof Error ? e.message : "Suppression impossible pour le moment.", "provider_error");
  }
  if (result === "bad_password") throw new HttpError(400, "Mot de passe incorrect.", "bad_password");
  await destroySession();
  return json({ ok: true });
});
