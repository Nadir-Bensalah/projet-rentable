import { requireUser } from "@/lib/auth/guard";
import { currentSessionToken, destroyAllSessions } from "@/lib/auth/session";
import { assertSameOrigin, handler, json } from "@/lib/security/request";

/** Signs out every other device. */
export const DELETE = handler(async (req) => {
  assertSameOrigin(req);
  const user = await requireUser();
  await destroyAllSessions(user.id, await currentSessionToken());
  return json({ ok: true });
});
