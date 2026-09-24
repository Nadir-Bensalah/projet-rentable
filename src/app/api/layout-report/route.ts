import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { query } from "@/lib/db";
import { rateLimit } from "@/lib/security/rate-limit";
import { HttpError, assertSameOrigin, handler, ipHash, json, readJson } from "@/lib/security/request";

/**
 * Opt-in report sent when a statement is not read correctly. It contains only the
 * structure of the result (counts, detected columns, warnings) — never text or amounts.
 */
const schema = z.object({
  summary: z.object({
    bankId: z.string().max(40).nullable().optional(),
    pageCount: z.number().int().min(0).max(500),
    transactionCount: z.number().int().min(0).max(100000),
    columns: z.array(z.string().max(20)).max(10),
    status: z.enum(["verified", "mismatch", "unverifiable"]),
    kind: z.enum(["text", "scanned", "empty"]),
    dateOrder: z.string().max(4),
    decimalSeparator: z.string().max(1),
    currency: z.string().max(3),
    warningCodes: z.array(z.string().max(160)).max(10),
  }),
  comment: z.string().trim().max(1000).optional().nullable(),
});

export const POST = handler(async (req) => {
  assertSameOrigin(req);
  const rl = await rateLimit(`layout:${ipHash(req)}`, 10, 3600);
  if (!rl.ok) throw new HttpError(429, "Trop de signalements. Merci, réessayez plus tard.", "rate_limited");
  const body = await readJson(req, schema);
  const user = await getCurrentUser();
  await query(`INSERT INTO layout_reports (user_id, bank_id, summary, comment) VALUES ($1, $2, $3, $4)`, [
    user?.id ?? null,
    body.summary.bankId ?? null,
    JSON.stringify(body.summary),
    body.comment ?? null,
  ]);
  return json({ ok: true });
});
