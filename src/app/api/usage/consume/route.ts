import { z } from "zod";
import { pages } from "@/config/plans";
import { formatInfo, type ExportFormat } from "@/lib/statement/export";
import { trackServer } from "@/lib/analytics/server";
import { loadAccountView } from "@/lib/account-view";
import { requireUser } from "@/lib/auth/guard";
import { QuotaError, accountState, consumePages } from "@/lib/billing";
import { query } from "@/lib/db";
import { rateLimit } from "@/lib/security/rate-limit";
import { HttpError, assertSameOrigin, handler, json, readJson } from "@/lib/security/request";

const FORMATS = ["csv-fr", "csv-intl", "xlsx", "ofx", "qif", "fec", "json"] as const;

const schema = z.object({
  documents: z
    .array(
      z.object({
        hash: z.string().regex(/^[0-9a-f]{64}$/, "Empreinte de document invalide."),
        pages: z.number().int().min(1).max(200),
        bankId: z
          .string()
          .max(40)
          .regex(/^[a-z0-9-]*$/)
          .optional()
          .nullable(),
        reconciled: z.enum(["verified", "mismatch", "unverifiable"]).optional().nullable(),
      }),
    )
    .min(1)
    .max(50),
  format: z.enum(FORMATS),
});

/**
 * Called by the browser right before it builds an export file. The server never sees
 * the statement: only its page count and a SHA-256 fingerprint (for free re-exports).
 */
export const POST = handler(async (req) => {
  assertSameOrigin(req);
  const user = await requireUser();
  const rl = await rateLimit(`consume:${user.id}`, 120, 3600);
  if (!rl.ok) throw new HttpError(429, "Trop d'exports en peu de temps. Patientez un instant.", "rate_limited");
  const body = await readJson(req, schema);
  const info = formatInfo(body.format as ExportFormat);
  const batch = body.documents.length > 1;
  let charged = 0;
  let reExports = 0;
  if (batch) {
    const state = await accountState(user.id);
    const paid = await query<{ document_hash: string }>(
      `SELECT document_hash FROM usage_events WHERE user_id = $1 AND period = $2 AND document_hash = ANY($3::text[])`,
      [user.id, state.period, body.documents.map((d) => d.hash)],
    );
    const paidSet = new Set(paid.map((p) => p.document_hash));
    const needed = body.documents.filter((d) => !paidSet.has(d.hash)).reduce((s, d) => s + d.pages, 0);
    if (state.paidFeatures && needed > state.totalAvailable) {
      return json(
        {
          error: `Ces relevés comptent ${pages(needed)} et il vous en reste ${state.totalAvailable}. Achetez un pack ou changez d'offre pour continuer.`,
          code: "quota_exceeded",
          charged: 0,
          account: await loadAccountView(user),
        },
        402,
      );
    }
  }
  try {
    // Documents are charged one by one so a re-exported statement stays free even inside a batch.
    // The whole batch is checked up-front against the available pages to avoid partial charges.
    for (const d of body.documents) {
      const r = await consumePages({
        userId: user.id,
        pages: d.pages,
        documentHash: d.hash,
        format: body.format,
        paidFormat: !info.free,
        batch,
        bankId: d.bankId ?? undefined,
        reconciled: d.reconciled ?? undefined,
      });
      charged += r.charged;
      if (r.alreadyPaid) reExports++;
    }
  } catch (e) {
    if (e instanceof QuotaError) {
      const status = e.code === "email_unverified" ? 403 : 402;
      return json({ error: e.message, code: e.code, charged, account: await loadAccountView(user) }, status);
    }
    throw e;
  }
  await trackServer("export_charged", {
    userId: user.id,
    props: { format: body.format, documents: body.documents.length, pages: charged, reExports },
  });
  return json({ ok: true, charged, reExports, account: await loadAccountView(user) });
});
