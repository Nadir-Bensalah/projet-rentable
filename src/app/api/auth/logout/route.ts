import { destroySession } from "@/lib/auth/session";
import { assertSameOrigin, handler, json } from "@/lib/security/request";

export const POST = handler(async (req) => {
  assertSameOrigin(req);
  await destroySession();
  return json({ ok: true });
});
