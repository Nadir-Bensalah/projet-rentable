import { ArrowRight, Gift } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { REFERRAL_REWARD_PAGES } from "@/config/plans";
import { absoluteUrl } from "@/config/site";
import { getCurrentUser } from "@/lib/auth/session";
import { loadAccountView } from "@/lib/account-view";
import { query } from "@/lib/db";
import { CopyField, ResendVerification } from "@/components/account/actions";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";

export default async function AccountOverview(props: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/connexion?suite=/compte");
  const sp = await props.searchParams;
  const account = await loadAccountView(user);
  const recent = await query<{
    created_at: Date;
    pages: number;
    format: string;
    reconciled: string | null;
    from_allowance: number;
    from_credits: number;
  }>(
    `SELECT created_at, pages, format, reconciled, from_allowance, from_credits FROM usage_events WHERE user_id = $1 ORDER BY created_at DESC LIMIT 10`,
    [user.id],
  );
  const pct = account.monthlyLimit ? Math.min(100, Math.round((account.usedThisMonth / account.monthlyLimit) * 100)) : 0;
  const fmt = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Paris" });
  return (
    <div className="grid gap-6">
      {sp.motdepasse === "modifie" ? <Alert tone="success">Votre mot de passe a été modifié.</Alert> : null}
      {!account.user.emailVerified ? (
        <Alert tone="warning" title="Confirmez votre adresse e-mail" action={<ResendVerification />}>
          Cliquez sur le lien reçu à l&apos;inscription pour activer vos pages gratuites et pouvoir télécharger vos fichiers.
        </Alert>
      ) : null}
      <div className="grid gap-6 md:grid-cols-2">
        <section className="surface p-6" aria-labelledby="usage-title">
          <div className="flex items-center justify-between">
            <h2 id="usage-title" className="font-bold">
              Utilisation ce mois-ci
            </h2>
            <Badge tone={account.plan === "free" ? "neutral" : "brand"}>{account.planName}</Badge>
          </div>
          <p className="mt-4">
            <span className="tabular text-3xl font-bold">{account.usedThisMonth}</span>{" "}
            <span className="text-muted">/ {account.monthlyLimit} pages</span>
          </p>
          <div
            className="mt-3 h-2.5 overflow-hidden rounded-full bg-[var(--bg-subtle)]"
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Pages utilisées ce mois"
          >
            <div
              className={pct >= 90 ? "h-full bg-rose-500" : pct >= 70 ? "h-full bg-amber-500" : "h-full bg-brand-600"}
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="mt-3 text-sm text-muted">
            {account.allowanceRemaining} page{account.allowanceRemaining > 1 ? "s" : ""} restante{account.allowanceRemaining > 1 ? "s" : ""}, renouvelées le 1er du mois.
            {account.credits
              ? ` Plus ${account.credits} pages de crédit${account.creditsNextExpiry ? ` (première expiration le ${new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(new Date(account.creditsNextExpiry))})` : ""}.`
              : ""}
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <ButtonLink href="/convertir" size="sm">
              Convertir un relevé
            </ButtonLink>
            {account.plan === "free" ? (
              <ButtonLink href="/tarifs" size="sm" variant="secondary">
                Plus de pages
              </ButtonLink>
            ) : null}
          </div>
        </section>
        <section className="surface p-6" aria-labelledby="ref-title">
          <h2 id="ref-title" className="flex items-center gap-2 font-bold">
            <Gift className="size-5 text-brand-600 dark:text-brand-300" aria-hidden /> Parrainage
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Partagez ce lien : quand la personne confirme son compte, vous recevez chacun {REFERRAL_REWARD_PAGES} pages offertes.
          </p>
          <div className="mt-4">
            <CopyField value={absoluteUrl(`/inscription?ref=${user.referralCode}`)} label="Votre lien de parrainage" />
          </div>
          <Link href="/parrainage" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand-600 dark:text-brand-300">
            Conditions du parrainage <ArrowRight className="size-4" aria-hidden />
          </Link>
        </section>
      </div>
      <section className="surface overflow-hidden" aria-labelledby="history-title">
        <h2 id="history-title" className="border-b border-[var(--border)] px-6 py-4 font-bold">
          Derniers exports
        </h2>
        {recent.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[var(--bg-subtle)] text-xs uppercase tracking-wide text-subtle">
                <tr>
                  <th scope="col" className="px-6 py-2.5">
                    Date
                  </th>
                  <th scope="col" className="px-3 py-2.5">
                    Format
                  </th>
                  <th scope="col" className="px-3 py-2.5">
                    Pages
                  </th>
                  <th scope="col" className="px-6 py-2.5">
                    Contrôle
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {recent.map((r, i) => (
                  <tr key={i}>
                    <td className="whitespace-nowrap px-6 py-2.5 text-muted">{fmt.format(new Date(r.created_at))}</td>
                    <td className="px-3 py-2.5 uppercase">{r.format}</td>
                    <td className="tabular px-3 py-2.5">{r.pages}</td>
                    <td className="px-6 py-2.5">
                      {r.reconciled === "verified" ? (
                        <Badge tone="success">Vérifié</Badge>
                      ) : r.reconciled === "mismatch" ? (
                        <Badge tone="error">Écart</Badge>
                      ) : (
                        <Badge tone="warning">Non vérifiable</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-10 text-center">
            <p className="font-medium">Aucun export pour le moment</p>
            <p className="mt-1 text-sm text-muted">Vos exports apparaîtront ici (date, format, nombre de pages — jamais le contenu).</p>
            <ButtonLink href="/convertir" size="sm" className="mt-4">
              Convertir mon premier relevé
            </ButtonLink>
          </div>
        )}
      </section>
    </div>
  );
}
