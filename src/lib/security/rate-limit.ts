import "server-only";
import { queryOne } from "@/lib/db";

/**
 * Fixed-window rate limiter stored in Postgres, so it works across instances
 * and survives restarts. Returns true when the request is allowed.
 */
export async function rateLimit(key: string, limit: number, windowSeconds: number): Promise<{ ok: boolean; retryAfter: number }> {
  const row = await queryOne<{ count: number; reset_at: Date }>(
    `INSERT INTO rate_limits (key, count, reset_at)
     VALUES ($1, 1, now() + make_interval(secs => $2))
     ON CONFLICT (key) DO UPDATE SET
       count = CASE WHEN rate_limits.reset_at < now() THEN 1 ELSE rate_limits.count + 1 END,
       reset_at = CASE WHEN rate_limits.reset_at < now() THEN now() + make_interval(secs => $2) ELSE rate_limits.reset_at END
     RETURNING count, reset_at`,
    [key, windowSeconds],
  );
  const count = row?.count ?? 0;
  const retryAfter = row ? Math.max(1, Math.ceil((new Date(row.reset_at).getTime() - Date.now()) / 1000)) : 0;
  return { ok: count <= limit, retryAfter };
}
