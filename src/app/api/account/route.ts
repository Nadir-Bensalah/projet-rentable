import { z } from "zod";
import { requireUser } from "@/lib/auth/guard";
import { query } from "@/lib/db";
import { assertSameOrigin, handler, json, readJson } from "@/lib/security/request";

const schema = z.object({
  name: z.string().trim().max(80).nullable().optional(),
  marketingOptIn: z.boolean().optional(),
});

export const PATCH = handler(async (req) => {
  assertSameOrigin(req);
  const user = await requireUser();
  const body = await readJson(req, schema);
  await query(
    `UPDATE users SET name = CASE WHEN $2::boolean THEN $3 ELSE name END,
                      marketing_opt_in = COALESCE($4, marketing_opt_in), updated_at = now()
      WHERE id = $1`,
    [user.id, body.name !== undefined, body.name || null, body.marketingOptIn ?? null],
  );
  return json({ ok: true });
});
