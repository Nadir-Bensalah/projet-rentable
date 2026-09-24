import "server-only";
import { PACK, PLANS } from "@/config/plans";
import type { SessionUser } from "@/lib/auth/session";
import { accountState, type AccountState } from "@/lib/billing";

/** JSON-safe account summary for the client (no provider secrets, no internal ids). */
export function accountView(user: SessionUser, state: AccountState) {
  return {
    user: { email: user.email, name: user.name, emailVerified: user.emailVerified, referralCode: user.referralCode },
    plan: state.plan,
    planName: PLANS[state.plan].name,
    period: state.period,
    monthlyLimit: state.monthlyLimit,
    usedThisMonth: state.usedThisMonth,
    allowanceRemaining: state.allowanceRemaining,
    credits: state.credits,
    creditsNextExpiry: state.creditsNextExpiry,
    paidFeatures: state.paidFeatures,
    totalAvailable: state.totalAvailable,
    subscription: state.subscription
      ? {
          plan: state.subscription.plan,
          interval: state.subscription.interval,
          status: state.subscription.status,
          currentPeriodEnd: state.subscription.current_period_end,
          cancelAtPeriodEnd: state.subscription.cancel_at_period_end,
        }
      : null,
    packPages: PACK.pages,
  };
}

export type AccountView = ReturnType<typeof accountView>;

export async function loadAccountView(user: SessionUser) {
  return accountView(user, await accountState(user.id));
}
