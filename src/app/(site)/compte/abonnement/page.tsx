import { redirect } from "next/navigation";
import { PLANS, formatPrice } from "@/config/plans";
import { getCurrentUser } from "@/lib/auth/session";
import { loadAccountView } from "@/lib/account-view";
import { latestSubscription } from "@/lib/billing";
import { query } from "@/lib/db";
import { ManageSubscriptionButton } from "@/components/account/actions";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";

const STATUS: Record<string, { label: string; tone: "success" | "warning" | "error" | "neutral" }> = {
  active: { label: "Actif", tone: "success" },
  past_due: { label: "Paiement en attente", tone: "warning" },
  canceled: { label: "Résilié", tone: "neutral" },
  expired: { label: "Terminé", tone: "neutral" },
  paused: { label: "En pause", tone: "warning" },
};

export default async function BillingPage(props: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/connexion?suite=/compte/abonnement");
  const sp = await props.searchParams;
  const account = await loadAccountView(user);
  const sub = await latestSubscription(user.id);
  const orders = await query<{
    created_at: Date;
    product: string;
    amount_cents: number;
    currency: string;
    status: string;
    receipt_url: string | null;
  }>(
    `SELECT created_at, product, amount_cents, currency, status, receipt_url FROM orders WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`,
    [user.id],
  );
  const d = (v: Date | null) =>
    v ? new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeZone: "Europe/Paris" }).format(new Date(v)) : "—";
  const PRODUCT_LABEL: Record<string, string> = {
    pack: "Pack 150 pages",
    pro_monthly: "Pro mensuel",
    pro_yearly: "Pro annuel",
    business_monthly: "Cabinet mensuel",
    business_yearly: "Cabinet annuel",
  };
  return (
    <div className="grid gap-6">
      {sp.paiement === "succes" ? (
        <Alert
          tone="success"
          title="Merci, votre paiement est confirmé !"
          action={
            <ButtonLink href="/convertir" size="sm">
              Reprendre ma conversion
            </ButtonLink>
          }
        >
          {account.paidFeatures
            ? "Vos avantages sont actifs. Votre conversion en cours a été conservée dans cet onglet."
            : "La confirmation de notre prestataire peut prendre quelques secondes. Actualisez la page si vos avantages n'apparaissent pas encore."}
        </Alert>
      ) : null}
      <section className="surface p-6" aria-labelledby="sub-title">
        <h2 id="sub-title" className="font-bold">
          Offre actuelle
        </h2>
        {sub && sub.status !== "expired" ? (
          <div className="mt-4 grid gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-xl font-bold">{PLANS[sub.plan].name}</p>
              <Badge tone={STATUS[sub.status]?.tone ?? "neutral"}>
                {sub.cancel_at_period_end && sub.status === "active" ? "Résiliation programmée" : (STATUS[sub.status]?.label ?? sub.status)}
              </Badge>
            </div>
            <p className="text-sm text-muted">
              {formatPrice(sub.interval === "year" ? PLANS[sub.plan].priceYearly : PLANS[sub.plan].priceMonthly)} par{" "}
              {sub.interval === "year" ? "an" : "mois"} · {PLANS[sub.plan].monthlyPages} pages par mois.{" "}
              {sub.cancel_at_period_end || sub.status === "canceled"
                ? `Accès jusqu'au ${d(sub.current_period_end)}.`
                : `Prochain renouvellement le ${d(sub.current_period_end)}.`}
            </p>
            {sub.status === "past_due" ? (
              <Alert tone="warning">
                Le dernier paiement a échoué. Mettez à jour votre moyen de paiement pour éviter une interruption.
              </Alert>
            ) : null}
            <ManageSubscriptionButton label={sub.status === "past_due" ? "Mettre à jour le paiement" : "Gérer ou résilier l'abonnement"} />
          </div>
        ) : (
          <div className="mt-4 grid gap-3">
            <p className="text-muted">
              Vous êtes sur le plan <strong>Gratuit</strong>
              {account.credits ? ` avec ${account.credits} pages de crédit` : ""}.
            </p>
            <div>
              <ButtonLink href="/tarifs" size="sm">
                Voir les offres
              </ButtonLink>
            </div>
          </div>
        )}
      </section>
      <section className="surface overflow-hidden" aria-labelledby="orders-title">
        <h2 id="orders-title" className="border-b border-[var(--border)] px-6 py-4 font-bold">
          Paiements
        </h2>
        {orders.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[var(--bg-subtle)] text-xs uppercase tracking-wide text-subtle">
                <tr>
                  <th scope="col" className="px-6 py-2.5">
                    Date
                  </th>
                  <th scope="col" className="px-3 py-2.5">
                    Offre
                  </th>
                  <th scope="col" className="px-3 py-2.5">
                    Montant
                  </th>
                  <th scope="col" className="px-3 py-2.5">
                    Statut
                  </th>
                  <th scope="col" className="px-6 py-2.5">
                    Facture
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {orders.map((o, i) => (
                  <tr key={i}>
                    <td className="whitespace-nowrap px-6 py-2.5 text-muted">{d(o.created_at)}</td>
                    <td className="px-3 py-2.5">{PRODUCT_LABEL[o.product] ?? o.product}</td>
                    <td className="tabular px-3 py-2.5">
                      {(o.amount_cents / 100).toFixed(2).replace(".", ",")} {o.currency === "EUR" ? "€" : o.currency}
                    </td>
                    <td className="px-3 py-2.5">
                      {o.status === "paid" ? (
                        <Badge tone="success">Payé</Badge>
                      ) : o.status === "refunded" ? (
                        <Badge>Remboursé</Badge>
                      ) : (
                        <Badge tone="error">Échec</Badge>
                      )}
                    </td>
                    <td className="px-6 py-2.5">
                      {o.receipt_url && /^https:\/\//.test(o.receipt_url) ? (
                        <a
                          href={o.receipt_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-brand-600 underline dark:text-brand-300"
                        >
                          Voir
                        </a>
                      ) : (
                        <span className="text-subtle">Envoyée par e-mail</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="px-6 py-8 text-center text-sm text-muted">Aucun paiement pour le moment.</p>
        )}
      </section>
    </div>
  );
}
