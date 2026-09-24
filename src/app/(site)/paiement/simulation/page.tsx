import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PRODUCTS, formatPrice } from "@/config/plans";
import { env } from "@/lib/env";
import { verifyMockToken, type MockCheckoutToken } from "@/lib/billing/providers/mock";
import { MockCheckoutActions } from "@/components/billing/mock-checkout";
import { Alert } from "@/components/ui/alert";

export const metadata: Metadata = { title: "Paiement (simulation)", robots: { index: false, follow: false } };

export default async function MockCheckoutPage(props: { searchParams: Promise<{ token?: string }> }) {
  if (env().PAYMENT_PROVIDER !== "mock") notFound();
  const { token } = await props.searchParams;
  const data = token ? verifyMockToken<MockCheckoutToken>(token) : null;
  return (
    <div className="mx-auto max-w-md px-4 py-14">
      <div className="surface p-6 sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">Environnement de test</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">Paiement simulé</h1>
        <Alert tone="warning" className="mt-4">
          Aucun paiement réel n&apos;est effectué. Cette page remplace le paiement tant que le prestataire réel (Stripe ou Lemon Squeezy)
          n&apos;est pas configuré.
        </Alert>
        {data ? (
          <>
            <dl className="mt-6 grid gap-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">Offre</dt>
                <dd className="font-semibold">{PRODUCTS[data.product].label}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Montant</dt>
                <dd className="tabular font-semibold">{formatPrice(PRODUCTS[data.product].price)} TTC</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Compte</dt>
                <dd>{data.email}</dd>
              </div>
            </dl>
            <div className="mt-6">
              <MockCheckoutActions token={token!} />
            </div>
          </>
        ) : (
          <Alert tone="error" className="mt-6">
            Session de paiement invalide ou expirée. Recommencez depuis la page Tarifs.
          </Alert>
        )}
      </div>
    </div>
  );
}
