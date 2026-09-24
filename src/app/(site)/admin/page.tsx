import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { isAdminEmail } from "@/lib/env";
import { loadMetrics } from "@/lib/metrics";

export const metadata: Metadata = { title: "Tableau de bord", robots: { index: false, follow: false } };

function pct(a: number, b: number) {
  return b ? `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 }).format((a / b) * 100)} %` : "—";
}

const eur = (cents: number, currency = "EUR") => new Intl.NumberFormat("fr-FR", { style: "currency", currency }).format(cents / 100);
const RECONCILED_LABELS: Record<string, string> = { verified: "Vérifié", mismatch: "Écart", unverifiable: "Non vérifiable" };

export default async function AdminPage(props: { searchParams: Promise<{ jours?: string }> }) {
  const user = await getCurrentUser();
  // 404 rather than 403: do not reveal that the page exists.
  if (!user || !user.emailVerified || !isAdminEmail(user.email)) notFound();
  const { jours } = await props.searchParams;
  const days = [7, 30, 90, 365].includes(Number(jours)) ? Number(jours) : 30;
  const m = await loadMetrics(days);
  const f = m.funnel;
  const steps: [string, number, number | null][] = [
    ["Visiteurs uniques (onglets)", f.visitors, null],
    ["Fichier déposé", f.filesSelected, f.visitors],
    ["Clic sur Télécharger", f.exportsClicked, f.filesSelected],
    ["Inscriptions", f.signups, null],
    ["E-mail confirmé", f.verified, f.signups],
    ["Activés (1er export)", f.activated, f.signups],
    ["Paywall affiché", f.paywalls, null],
    ["Clic sur une offre", f.checkoutsClicked, f.paywalls],
    ["Paiement commencé", f.checkoutsStarted, null],
  ];
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Tableau de bord</h1>
        <nav className="flex gap-1 text-sm" aria-label="Période">
          {[7, 30, 90, 365].map((d) => (
            <Link
              key={d}
              href={`/admin?jours=${d}`}
              aria-current={d === days ? "page" : undefined}
              className={
                d === days
                  ? "rounded-lg bg-brand-600 px-3 py-1.5 font-semibold text-white"
                  : "rounded-lg px-3 py-1.5 text-muted hover:bg-[var(--bg-subtle)]"
              }
            >
              {d} j
            </Link>
          ))}
        </nav>
      </div>
      <p className="mt-2 text-sm text-muted">Données réelles issues de la base (aucune estimation). Période : {days} derniers jours.</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["MRR (abonnements actifs)", eur(m.mrr)],
          [
            "Chiffre encaissé",
            m.revenue.length
              ? m.revenue.map((r) => eur(Number(r.paid), r.currency)).join(" · ")
              : eur(0),
          ],
          ["Abonnements actifs", String(m.activeSubs.reduce((s, r) => s + Number(r.n), 0))],
          ["Résiliations", String(m.churned)],
          ["Exports facturés", `${m.exportsCharged.n} (${m.exportsCharged.pages} pages)`],
          ["Lectures réussies / échecs", `${f.parsed} / ${f.parseFailed}`],
          ["Signalements de mise en page", String(m.layoutReports)],
          ["Rétention J+7 (cohorte)", `${m.retention.returning} / ${m.retention.cohort}`],
        ].map(([k, v]) => (
          <div key={k} className="surface p-5">
            <p className="text-sm text-muted">{k}</p>
            <p className="tabular mt-1 text-2xl font-bold">{v}</p>
          </div>
        ))}
      </div>

      <section className="surface mt-8 overflow-hidden">
        <h2 className="border-b border-[var(--border)] px-6 py-4 font-bold">Entonnoir</h2>
        <table className="w-full text-sm">
          <tbody className="divide-y divide-[var(--border)]">
            {steps.map(([label, n, base]) => (
              <tr key={label}>
                <th scope="row" className="px-6 py-2.5 text-left font-medium">
                  {label}
                </th>
                <td className="tabular px-6 py-2.5 text-right">{n}</td>
                <td className="tabular px-6 py-2.5 text-right text-muted">{base !== null ? pct(n, base) : ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {[
          { t: "Sources d'inscription", rows: m.sources.map((s) => [s.source ?? "(direct)", s.n]) },
          { t: "Pages les plus vues", rows: m.topPages.map((p) => [p.path, p.n]) },
          { t: "Contrôle des relevés exportés", rows: m.reconciliation.map((r) => [RECONCILED_LABELS[r.reconciled ?? ""] ?? "Inconnu", r.n]) },
        ].map((b) => (
          <section key={b.t} className="surface overflow-hidden">
            <h2 className="border-b border-[var(--border)] px-5 py-3 font-bold">{b.t}</h2>
            {b.rows.length ? (
              <ul className="divide-y divide-[var(--border)] text-sm">
                {b.rows.map(([k, v]) => (
                  <li key={k} className="flex justify-between gap-4 px-5 py-2">
                    <span className="truncate">{k}</span>
                    <span className="tabular">{v}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-5 py-6 text-sm text-muted">Aucune donnée sur la période.</p>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
