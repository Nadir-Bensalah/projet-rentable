import "server-only";
import { cookies } from "next/headers";
import { cache } from "react";
import { env } from "@/lib/env";
import { query, queryOne } from "@/lib/db";
import { randomToken, sha256 } from "@/lib/security/tokens";

const SESSION_DAYS = 30;

export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
  emailVerified: boolean;
  referralCode: string;
  createdAt: Date;
}

export function sessionCookieName() {
  // The __Host- prefix forces Secure, Path=/ and no Domain: the cookie cannot be set by subdomains.
  return env().APP_URL.startsWith("https://") ? "__Host-rv_session" : "rv_session";
}

function cookieOptions(expires: Date) {
  return {
    httpOnly: true,
    secure: env().APP_URL.startsWith("https://"),
    sameSite: "lax" as const,
    path: "/",
    expires,
  };
}

export async function createSession(userId: string, meta: { userAgent?: string | null; ipHash?: string }) {
  const token = randomToken(32);
  const expires = new Date(Date.now() + SESSION_DAYS * 86400_000);
  await query(`INSERT INTO sessions (id, user_id, expires_at, user_agent, ip_hash) VALUES ($1, $2, $3, $4, $5)`, [
    sha256(token),
    userId,
    expires,
    meta.userAgent?.slice(0, 300) ?? null,
    meta.ipHash ?? null,
  ]);
  await query(`UPDATE users SET last_login_at = now() WHERE id = $1`, [userId]);
  // Opportunistic cleanup of expired sessions.
  await query(`DELETE FROM sessions WHERE expires_at < now() - interval '1 day'`);
  const jar = await cookies();
  jar.set(sessionCookieName(), token, cookieOptions(expires));
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(sessionCookieName())?.value;
  if (token) await query(`DELETE FROM sessions WHERE id = $1`, [sha256(token)]);
  jar.set(sessionCookieName(), "", { ...cookieOptions(new Date(0)), maxAge: 0 });
}

export async function destroyAllSessions(userId: string, exceptToken?: string) {
  if (exceptToken) {
    await query(`DELETE FROM sessions WHERE user_id = $1 AND id <> $2`, [userId, sha256(exceptToken)]);
  } else {
    await query(`DELETE FROM sessions WHERE user_id = $1`, [userId]);
  }
}

export async function currentSessionToken(): Promise<string | undefined> {
  const jar = await cookies();
  return jar.get(sessionCookieName())?.value;
}

/** Returns the signed-in user, or null. Memoised per request. */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const token = await currentSessionToken();
  if (!token || token.length > 100) return null;
  const row = await queryOne<{
    id: string;
    email: string;
    name: string | null;
    email_verified_at: Date | null;
    referral_code: string;
    created_at: Date;
    last_seen_at: Date;
  }>(
    `SELECT u.id, u.email, u.name, u.email_verified_at, u.referral_code, u.created_at, s.last_seen_at
       FROM sessions s JOIN users u ON u.id = s.user_id
      WHERE s.id = $1 AND s.expires_at > now()`,
    [sha256(token)],
  );
  if (!row) return null;
  // Activity tracking (used for the "active sessions" view), at most one write per hour.
  if (Date.now() - new Date(row.last_seen_at).getTime() > 3600_000) {
    await query(`UPDATE sessions SET last_seen_at = now() WHERE id = $1`, [sha256(token)]);
  }
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    emailVerified: !!row.email_verified_at,
    referralCode: row.referral_code,
    createdAt: row.created_at,
  };
});
