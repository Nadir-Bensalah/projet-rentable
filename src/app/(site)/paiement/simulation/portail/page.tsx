import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PLANS } from "@/config/plans";
import { env } from "@/lib/env";
import { queryOne } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { verifyMockToken } from "@/lib/billing/providers/mock";
import { MockPortalActions } from "@/components/billing/mock-checkout";
import { Alert } from "@/components/ui/alert";

export const metadata: Metadata = { title: "Gestion de l'abonnement (simulation)", robots: { index: false, follow: false } };

export default async function MockPortalPage(props: { searchParams: Promise<{ token?: string }> }) {
  if (env().PAYMENT_PROVIDER !== "mock") notFound();
  const { token } = await props.searchParams;
  const data = token ? verifyMockToken<{ userId: string; subscriptionId: string }>(token, "portal") : null;
  const user = await getCurrentUser();
  const sub =
    data && user && user.id === data.userId
      ? await queryOne<{ plan: "pro" | "business"; status: string; cancel_at_period_end: boolean; current_period_end: Date | null }>(
          `SELECT plan, status, cancel_at_period_end, current_period_end FROM subscriptions WHERE provider = 'mock' AND provider_subscription_id = $1 AND user_id = $2`,
          [data.subscriptionId, user.id],
        )
      : null;
  return (
    <div className="mx-auto max-w-md px-4 py-14">
      <div className="surface p-6 sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">Environnement de test</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">Portail client simulé</h1>
        {sub ? (
          <>
            <p className="mt-4 text-sm text-muted">
              Abonnement <strong>{PLANS[sub.plan].name}</strong> — statut : {sub.status}
              {sub.cancel_at_period_end ? " (résiliation programmée)" : ""}.
            </p>
            <div className="mt-6">
              <MockPortalActions token={token!} canceling={sub.cancel_at_period_end} />
            </div>
          </>
        ) : (
          <Alert tone="error" className="mt-6">
            Session invalide ou expirée.
          </Alert>
        )}
      </div>
    </div>
  );
}
