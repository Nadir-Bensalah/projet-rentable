import "server-only";
import { PLANS } from "@/config/plans";
import { query, queryOne } from "@/lib/db";

/** Business dashboard metrics — all computed from real, first-party data. */
export async function loadMetrics(days: number) {
  const since = `now() - make_interval(days => ${Math.max(1, Math.min(365, Math.floor(days)))})`;
  const count = async (name: string, distinct = "anon_id") =>
    Number(
      (
        await queryOne<{ n: string }>(
          `SELECT count(DISTINCT ${distinct}) AS n FROM analytics_events WHERE name = $1 AND created_at > ${since}`,
          [name],
        )
      )?.n ?? 0,
    );
  const [visitors, landingViews, ctaClicks, filesSelected, parsed, parseFailed, exportsClicked, paywalls, checkoutsClicked] =
    await Promise.all([
      count("page_view"),
      Number(
        (
          await queryOne<{ n: string }>(
            `SELECT count(*) AS n FROM analytics_events WHERE name = 'page_view' AND path = '/' AND created_at > ${since}`,
          )
        )?.n ?? 0,
      ),
      Number(
        (await queryOne<{ n: string }>(`SELECT count(*) AS n FROM analytics_events WHERE name = 'cta_click' AND created_at > ${since}`))
          ?.n ?? 0,
      ),
      count("file_selected"),
      Number(
        (
          await queryOne<{ n: string }>(
            `SELECT count(*) AS n FROM analytics_events WHERE name = 'parse_succeeded' AND created_at > ${since}`,
          )
        )?.n ?? 0,
      ),
      Number(
        (await queryOne<{ n: string }>(`SELECT count(*) AS n FROM analytics_events WHERE name = 'parse_failed' AND created_at > ${since}`))
          ?.n ?? 0,
      ),
      count("export_clicked"),
      count("paywall_shown"),
      count("checkout_clicked"),
    ]);
  const signups = Number((await queryOne<{ n: string }>(`SELECT count(*) AS n FROM users WHERE created_at > ${since}`))?.n ?? 0);
  const verified = Number(
    (await queryOne<{ n: string }>(`SELECT count(*) AS n FROM users WHERE created_at > ${since} AND email_verified_at IS NOT NULL`))?.n ??
      0,
  );
  const activated = Number(
    (
      await queryOne<{ n: string }>(
        `SELECT count(*) AS n FROM users u WHERE u.created_at > ${since} AND EXISTS (SELECT 1 FROM usage_events e WHERE e.user_id = u.id)`,
      )
    )?.n ?? 0,
  );
  const checkoutsStarted = Number(
    (await queryOne<{ n: string }>(`SELECT count(*) AS n FROM analytics_events WHERE name = 'checkout_started' AND created_at > ${since}`))
      ?.n ?? 0,
  );
  const revenue = await query<{ currency: string; paid: string; refunded: string; orders: string }>(
    `SELECT currency,
            COALESCE(SUM(amount_cents) FILTER (WHERE status = 'paid'), 0) AS paid,
            COALESCE(SUM(amount_cents) FILTER (WHERE status = 'refunded'), 0) AS refunded,
            count(*) FILTER (WHERE status = 'paid') AS orders
       FROM orders WHERE created_at > ${since} GROUP BY currency`,
  );
  const activeSubs = await query<{ plan: "pro" | "business"; interval: string; n: string }>(
    `SELECT plan, interval, count(*) AS n FROM subscriptions
      WHERE status IN ('active','past_due') OR (status = 'canceled' AND current_period_end > now())
      GROUP BY plan, interval`,
  );
  const mrr = activeSubs.reduce(
    (s, r) => s + Number(r.n) * (r.interval === "year" ? PLANS[r.plan].priceYearly / 12 : PLANS[r.plan].priceMonthly),
    0,
  );
  const churned = Number(
    (
      await queryOne<{ n: string }>(
        `SELECT count(*) AS n FROM analytics_events WHERE name = 'subscription_canceled' AND created_at > ${since}`,
      )
    )?.n ?? 0,
  );
  const exportsCharged = await queryOne<{ n: string; pages: string }>(
    `SELECT count(*) AS n, COALESCE(SUM(pages),0) AS pages FROM usage_events WHERE created_at > ${since}`,
  );
  const reconciliation = await query<{ reconciled: string | null; n: string }>(
    `SELECT reconciled, count(*) AS n FROM usage_events WHERE created_at > ${since} GROUP BY reconciled`,
  );
  const sources = await query<{ source: string | null; n: string }>(
    `SELECT COALESCE(first_touch->>'source', '(direct)') AS source, count(*) AS n FROM users WHERE created_at > ${since} GROUP BY 1 ORDER BY 2 DESC LIMIT 10`,
  );
  const topPages = await query<{ path: string; n: string }>(
    `SELECT path, count(*) AS n FROM analytics_events WHERE name = 'page_view' AND created_at > ${since} GROUP BY path ORDER BY 2 DESC LIMIT 12`,
  );
  const layoutReports = Number(
    (await queryOne<{ n: string }>(`SELECT count(*) AS n FROM layout_reports WHERE created_at > ${since}`))?.n ?? 0,
  );
  const retention = await queryOne<{ cohort: string; returning: string }>(
    `SELECT count(DISTINCT u.id) AS cohort,
            count(DISTINCT u.id) FILTER (WHERE EXISTS (SELECT 1 FROM usage_events e WHERE e.user_id = u.id AND e.created_at > u.created_at + interval '7 days')) AS returning
       FROM users u WHERE u.created_at > ${since} - interval '30 days' AND u.created_at < now() - interval '7 days'`,
  );
  return {
    funnel: {
      visitors,
      landingViews,
      ctaClicks,
      filesSelected,
      parsed,
      parseFailed,
      exportsClicked,
      signups,
      verified,
      activated,
      paywalls,
      checkoutsClicked,
      checkoutsStarted,
    },
    revenue,
    activeSubs,
    mrr,
    churned,
    exportsCharged: { n: Number(exportsCharged?.n ?? 0), pages: Number(exportsCharged?.pages ?? 0) },
    reconciliation,
    sources,
    topPages,
    layoutReports,
    retention: { cohort: Number(retention?.cohort ?? 0), returning: Number(retention?.returning ?? 0) },
  };
}
