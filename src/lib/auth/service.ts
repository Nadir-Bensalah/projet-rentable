import "server-only";
import { REFERRAL_REWARD_PAGES } from "@/config/plans";
import { absoluteUrl } from "@/config/site";
import { query, queryOne, transaction } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { trackServer } from "@/lib/analytics/server";
import { grantCredits, latestSubscription, paymentProvider, toRef } from "@/lib/billing";
import { randomToken, referralCode, sha256 } from "@/lib/security/tokens";
import { dummyPasswordHash, hashPassword, verifyPassword } from "./password";

export const MAX_REFERRAL_REWARDS = 20;

export function normaliseEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function findUserByEmail(email: string) {
  return queryOne<{ id: string; email: string; password_hash: string; email_verified_at: Date | null; name: string | null }>(
    `SELECT id, email, password_hash, email_verified_at, name FROM users WHERE lower(email) = $1`,
    [normaliseEmail(email)],
  );
}

async function createEmailToken(userId: string, purpose: "verify_email" | "reset_password", ttlMinutes: number) {
  const token = randomToken(32);
  // Only one live token per purpose.
  await query(`DELETE FROM email_tokens WHERE user_id = $1 AND purpose = $2`, [userId, purpose]);
  await query(
    `INSERT INTO email_tokens (id, user_id, purpose, expires_at) VALUES ($1, $2, $3, now() + make_interval(mins => $4))`,
    [sha256(token), userId, purpose, ttlMinutes],
  );
  return token;
}

/** Atomically consumes a token. Returns the user id or null if invalid/expired/used. */
export async function consumeEmailToken(token: string, purpose: "verify_email" | "reset_password"): Promise<string | null> {
  if (!token || token.length > 100) return null;
  const row = await queryOne<{ user_id: string }>(
    `UPDATE email_tokens SET used_at = now()
      WHERE id = $1 AND purpose = $2 AND used_at IS NULL AND expires_at > now()
      RETURNING user_id`,
    [sha256(token), purpose],
  );
  return row?.user_id ?? null;
}

export async function sendVerificationEmail(user: { id: string; email: string; name?: string | null }) {
  const token = await createEmailToken(user.id, "verify_email", 48 * 60);
  return sendEmail("verify_email", user.email, { url: absoluteUrl(`/verifier-email?token=${token}`), name: user.name }, { userId: user.id });
}

export class SignupError extends Error {}

export async function signup(input: {
  email: string;
  password: string;
  name?: string | null;
  marketingOptIn?: boolean;
  referralCode?: string | null;
  firstTouch?: Record<string, string | null> | null;
}) {
  const email = normaliseEmail(input.email);
  const existing = await findUserByEmail(email);
  if (existing) return { user: null as null | { id: string; email: string }, existed: true };
  const passwordHash = await hashPassword(input.password);
  let referredBy: string | null = null;
  if (input.referralCode && /^[A-Z0-9]{6,12}$/.test(input.referralCode)) {
    const ref = await queryOne<{ id: string }>(`SELECT id FROM users WHERE referral_code = $1`, [input.referralCode]);
    referredBy = ref?.id ?? null;
  }
  let user: { id: string; email: string } | null = null;
  for (let attempt = 0; attempt < 3 && !user; attempt++) {
    try {
      user = await queryOne<{ id: string; email: string }>(
        `INSERT INTO users (email, password_hash, name, marketing_opt_in, referral_code, referred_by, first_touch)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, email`,
        [email, passwordHash, input.name?.trim() || null, !!input.marketingOptIn, referralCode(), referredBy, input.firstTouch ? JSON.stringify(input.firstTouch) : null],
      );
    } catch (e) {
      const code = (e as { code?: string; constraint?: string }).code;
      const constraint = (e as { constraint?: string }).constraint;
      if (code === "23505" && constraint === "users_email_key") return { user: null, existed: true };
      if (code === "23505" && constraint === "users_referral_code_key") continue; // retry with a new code
      throw e;
    }
  }
  if (!user) throw new SignupError("Impossible de créer le compte.");
  await sendVerificationEmail({ ...user, name: input.name });
  await trackServer("signup_completed", {
    userId: user.id,
    utm: { source: input.firstTouch?.source, medium: input.firstTouch?.medium, campaign: input.firstTouch?.campaign },
    props: { referred: !!referredBy },
  });
  return { user, existed: false };
}

export async function authenticate(email: string, password: string) {
  const user = await findUserByEmail(email);
  if (!user) {
    // Same work as a real check to avoid user enumeration through timing.
    await verifyPassword(password, await dummyPasswordHash());
    return null;
  }
  const ok = await verifyPassword(password, user.password_hash);
  return ok ? user : null;
}

export async function verifyEmail(token: string): Promise<{ userId: string } | null> {
  const userId = await consumeEmailToken(token, "verify_email");
  if (!userId) return null;
  const updated = await queryOne<{ id: string; email: string; referred_by: string | null }>(
    `UPDATE users SET email_verified_at = now(), updated_at = now() WHERE id = $1 AND email_verified_at IS NULL RETURNING id, email, referred_by`,
    [userId],
  );
  if (updated) {
    await trackServer("email_verified", { userId });
    if (updated.referred_by) await rewardReferral(updated.referred_by, updated.id);
  }
  return { userId };
}

/** Both the referrer and the new user receive pages once the new user has verified their e-mail. */
async function rewardReferral(referrerId: string, refereeId: string) {
  const referrer = await queryOne<{ id: string; email: string; rewards: string }>(
    `SELECT u.id, u.email, (SELECT count(*) FROM credit_grants g WHERE g.user_id = u.id AND g.source = 'referral' AND g.reference LIKE '%:referrer') AS rewards
       FROM users u WHERE u.id = $1 AND u.email_verified_at IS NOT NULL`,
    [referrerId],
  );
  await transaction(async (db) => {
    await grantCredits(db, refereeId, REFERRAL_REWARD_PAGES, "referral", `${refereeId}:referee`);
    if (referrer && Number(referrer.rewards) < MAX_REFERRAL_REWARDS) {
      const granted = await grantCredits(db, referrer.id, REFERRAL_REWARD_PAGES, "referral", `${refereeId}:referrer`);
      if (granted) {
        await sendEmail("referral_reward", referrer.email, { pages: REFERRAL_REWARD_PAGES, appUrl: absoluteUrl("/convertir") }, { userId: referrer.id, dedupeKey: `referral:${refereeId}` });
      }
    }
  });
  await trackServer("referral_rewarded", { userId: referrerId, props: { referee: refereeId.slice(0, 8) } });
}

export async function requestPasswordReset(email: string) {
  const user = await findUserByEmail(email);
  if (!user) return;
  const token = await createEmailToken(user.id, "reset_password", 60);
  await sendEmail("reset_password", user.email, { url: absoluteUrl(`/reinitialiser-mot-de-passe?token=${token}`) }, { userId: user.id });
}

export async function resetPassword(token: string, newPassword: string): Promise<{ id: string; email: string } | null> {
  const userId = await consumeEmailToken(token, "reset_password");
  if (!userId) return null;
  const hash = await hashPassword(newPassword);
  // A successful reset also proves ownership of the address.
  const user = await queryOne<{ id: string; email: string }>(
    `UPDATE users SET password_hash = $2, email_verified_at = COALESCE(email_verified_at, now()), updated_at = now() WHERE id = $1 RETURNING id, email`,
    [userId, hash],
  );
  if (!user) return null;
  await query(`DELETE FROM sessions WHERE user_id = $1`, [userId]);
  await sendEmail("password_changed", user.email, {} as Record<string, never>, { userId });
  return user;
}

export async function changePassword(userId: string, current: string, next: string): Promise<boolean> {
  const row = await queryOne<{ password_hash: string; email: string }>(`SELECT password_hash, email FROM users WHERE id = $1`, [userId]);
  if (!row || !(await verifyPassword(current, row.password_hash))) return false;
  await query(`UPDATE users SET password_hash = $2, updated_at = now() WHERE id = $1`, [userId, await hashPassword(next)]);
  await sendEmail("password_changed", row.email, {} as Record<string, never>, { userId });
  return true;
}

/** GDPR: everything we hold about the user, in a portable format. */
export async function exportUserData(userId: string) {
  const [user] = await query(
    `SELECT id, email, name, email_verified_at, marketing_opt_in, referral_code, first_touch, created_at, last_login_at FROM users WHERE id = $1`,
    [userId],
  );
  const [subscriptions, orders, credits, usage, sessions] = await Promise.all([
    query(`SELECT provider, plan, interval, status, current_period_end, cancel_at_period_end, created_at FROM subscriptions WHERE user_id = $1`, [userId]),
    query(`SELECT provider, kind, product, amount_cents, currency, status, created_at FROM orders WHERE user_id = $1 ORDER BY created_at`, [userId]),
    query(`SELECT pages, remaining, source, expires_at, created_at FROM credit_grants WHERE user_id = $1`, [userId]),
    query(`SELECT period, pages, from_allowance, from_credits, format, bank_id, reconciled, created_at FROM usage_events WHERE user_id = $1 ORDER BY created_at`, [userId]),
    query(`SELECT created_at, last_seen_at, expires_at, user_agent FROM sessions WHERE user_id = $1`, [userId]),
  ]);
  return {
    exportedAt: new Date().toISOString(),
    note: "Relevéo ne stocke jamais le contenu de vos relevés : ils sont lus dans votre navigateur. Cet export contient toutes les données de votre compte.",
    user,
    subscriptions,
    orders,
    credits,
    usage,
    sessions,
  };
}

export async function deleteAccount(userId: string, password: string): Promise<"ok" | "bad_password"> {
  const row = await queryOne<{ password_hash: string; email: string }>(`SELECT password_hash, email FROM users WHERE id = $1`, [userId]);
  if (!row) return "ok";
  if (!(await verifyPassword(password, row.password_hash))) return "bad_password";
  // Stop any running subscription at the provider first.
  const sub = await latestSubscription(userId);
  if (sub && ["active", "past_due", "paused"].includes(sub.status)) {
    try {
      await paymentProvider(sub.provider as "mock" | "stripe" | "lemonsqueezy").cancelSubscription(toRef(sub));
    } catch (e) {
      console.error("[account] provider cancellation failed", e);
      throw new Error("La résiliation de l'abonnement a échoué. Réessayez ou contactez le support.");
    }
  }
  await trackServer("account_deleted", { props: { hadSubscription: !!sub } });
  await query(`DELETE FROM users WHERE id = $1`, [userId]);
  await sendEmail("account_deleted", row.email, {} as Record<string, never>);
  return "ok";
}
