import { absoluteUrl } from "@/config/site";
import { env } from "@/lib/env";
import { query } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { safeEqualString } from "@/lib/security/tokens";

/**
 * Daily maintenance + lifecycle e-mails. Call with: Authorization: Bearer $CRON_SECRET
 * (e.g. from a free scheduler such as a GitHub Actions cron or cron-job.org).
 */
export async function POST(req: Request) {
  const secret = env().CRON_SECRET;
  const auth = req.headers.get("authorization") ?? "";
  if (!secret || !safeEqualString(auth, `Bearer ${secret}`)) return new Response("Unauthorized", { status: 401 });

  // Activation nudge: verified users who signed up 2–7 days ago and never exported.
  const inactive = await query<{ id: string; email: string }>(
    `SELECT u.id, u.email FROM users u
      WHERE u.email_verified_at IS NOT NULL
        AND u.created_at < now() - interval '2 days' AND u.created_at > now() - interval '7 days'
        AND NOT EXISTS (SELECT 1 FROM usage_events e WHERE e.user_id = u.id)
      LIMIT 500`,
  );
  let nudged = 0;
  for (const u of inactive) {
    if (
      await sendEmail("activation_nudge", u.email, { appUrl: absoluteUrl("/convertir") }, { userId: u.id, dedupeKey: `activation:${u.id}` })
    )
      nudged++;
  }

  // Housekeeping.
  const cleaned = {
    sessions: (await query(`DELETE FROM sessions WHERE expires_at < now() RETURNING 1`)).length,
    tokens: (await query(`DELETE FROM email_tokens WHERE expires_at < now() - interval '7 days' RETURNING 1`)).length,
    rateLimits: (await query(`DELETE FROM rate_limits WHERE reset_at < now() - interval '1 day' RETURNING 1`)).length,
    // Analytics retention: 13 months (CNIL guidance for audience measurement).
    analytics: (await query(`DELETE FROM analytics_events WHERE created_at < now() - interval '13 months' RETURNING 1`)).length,
    subscriptionsExpired: (
      await query(
        `UPDATE subscriptions SET status = 'expired', updated_at = now()
          WHERE status = 'canceled' AND current_period_end < now() RETURNING 1`,
      )
    ).length,
  };
  return Response.json({ ok: true, nudged, cleaned });
}
