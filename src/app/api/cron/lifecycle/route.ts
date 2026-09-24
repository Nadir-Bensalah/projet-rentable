import { PLANS, formatPrice } from "@/config/plans";
import { absoluteUrl } from "@/config/site";
import { PAST_DUE_GRACE_DAYS } from "@/lib/billing";
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

  // Activation nudge: verified users who accepted non-essential e-mails, signed up 2–7 days ago
  // and never exported.
  const inactive = await query<{ id: string; email: string }>(
    `SELECT u.id, u.email FROM users u
      WHERE u.email_verified_at IS NOT NULL AND u.marketing_opt_in
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

  // Yearly renewal notice, required between 3 and 1 month before a consumer contract renews
  // (art. L215-1 C. conso). Sent once per renewal date, around 7 weeks ahead.
  const renewing = await query<{ user_id: string; email: string; plan: "pro" | "business"; current_period_end: Date }>(
    `SELECT s.user_id, u.email, s.plan, s.current_period_end FROM subscriptions s JOIN users u ON u.id = s.user_id
      WHERE s.status = 'active' AND s.interval = 'year' AND NOT s.cancel_at_period_end
        AND s.current_period_end BETWEEN now() + interval '35 days' AND now() + interval '85 days'
      LIMIT 500`,
  );
  let renewalReminders = 0;
  for (const r of renewing) {
    const date = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeZone: "Europe/Paris" }).format(r.current_period_end);
    if (
      await sendEmail(
        "renewal_reminder",
        r.email,
        {
          planName: PLANS[r.plan].name,
          amount: formatPrice(PLANS[r.plan].priceYearly),
          date,
          billingUrl: absoluteUrl("/compte/abonnement"),
        },
        { userId: r.user_id, dedupeKey: `renewal:${r.user_id}:${r.current_period_end.toISOString().slice(0, 10)}` },
      )
    )
      renewalReminders++;
  }

  // Housekeeping.
  const cleaned = {
    sessions: (await query(`DELETE FROM sessions WHERE expires_at < now() RETURNING 1`)).length,
    tokens: (await query(`DELETE FROM email_tokens WHERE expires_at < now() - interval '7 days' RETURNING 1`)).length,
    rateLimits: (await query(`DELETE FROM rate_limits WHERE reset_at < now() - interval '1 day' RETURNING 1`)).length,
    // Analytics retention: 13 months (CNIL guidance for audience measurement).
    analytics: (await query(`DELETE FROM analytics_events WHERE created_at < now() - interval '13 months' RETURNING 1`)).length,
    // Retention periods published in the privacy policy.
    emailLog: (await query(`DELETE FROM email_log WHERE created_at < now() - interval '13 months' RETURNING 1`)).length,
    contactMessages: (await query(`DELETE FROM contact_messages WHERE created_at < now() - interval '3 years' RETURNING 1`)).length,
    layoutReports: (await query(`DELETE FROM layout_reports WHERE created_at < now() - interval '3 years' RETURNING 1`)).length,
    webhookEvents: (
      await query(`DELETE FROM webhook_events WHERE processed_at IS NOT NULL AND received_at < now() - interval '13 months' RETURNING 1`)
    ).length,
    // Payment still failing after the grace period: access stops.
    subscriptionsUnpaid: (
      await query(
        `UPDATE subscriptions SET status = 'unpaid', updated_at = now()
          WHERE status = 'past_due' AND current_period_end < now() - make_interval(days => $1) RETURNING 1`,
        [PAST_DUE_GRACE_DAYS],
      )
    ).length,
    subscriptionsExpired: (
      await query(
        `UPDATE subscriptions SET status = 'expired', updated_at = now()
          WHERE status = 'canceled' AND current_period_end < now() RETURNING 1`,
      )
    ).length,
  };
  return Response.json({ ok: true, nudged, renewalReminders, cleaned });
}
