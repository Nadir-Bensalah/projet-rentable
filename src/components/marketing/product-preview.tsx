import { CheckCircle2, FileText, Lock } from "lucide-react";

const ROWS = [
  { d: "02/08/2026", l: "CARTE X4821 MONOPRIX PARIS 11", a: "-42,18" },
  { d: "03/08/2026", l: "VIR SEPA RECU /DE ACME CONSEIL SARL", a: "+1 850,00" },
  { d: "05/08/2026", l: "PRLV SEPA EDF CLIENTS PARTICULIERS", a: "-78,40" },
  { d: "07/08/2026", l: "RETRAIT DAB LYON BELLECOUR", a: "-60,00" },
  { d: "09/08/2026", l: "PRLV SEPA URSSAF COTISATIONS T2", a: "-612,00" },
];

/** Illustrative screenshot of the converter (fictional data, labelled as such). */
export function ProductPreview() {
  return (
    <figure className="relative" aria-label="Aperçu illustratif de Relevéo avec des données fictives">
      <div
        className="absolute -inset-4 -z-10 rounded-[2rem] bg-gradient-to-br from-brand-200/60 via-transparent to-emerald-200/50 blur-2xl dark:from-brand-700/30 dark:to-emerald-700/20"
        aria-hidden
      />
      <div className="surface overflow-hidden shadow-[var(--shadow-lift)]">
        <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] px-4 py-3">
          <div className="flex min-w-0 items-center gap-2 text-sm font-semibold">
            <FileText className="size-4 shrink-0 text-brand-600 dark:text-brand-300" aria-hidden />
            <span className="truncate">releve-aout-2026.pdf</span>
            <span className="hidden text-xs font-normal text-subtle sm:inline">· 2 pages · 46 opérations</span>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-[var(--bg-subtle)] px-2 py-0.5 text-[11px] font-medium text-muted">
            <Lock className="size-3" aria-hidden /> Local
          </span>
        </div>
        <div className="flex items-start gap-3 border-b border-[var(--border)] bg-emerald-50/70 px-4 py-3.5 dark:bg-emerald-950/30">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
          <div className="text-sm">
            <p className="font-semibold text-emerald-900 dark:text-emerald-200">Relevé vérifié au centime</p>
            <p className="tabular mt-0.5 text-emerald-800/90 dark:text-emerald-300/90">1 520,34 € + 4 912,00 € − 3 801,56 € = 2 630,78 €</p>
          </div>
        </div>
        <table className="w-full text-left text-[13px]">
          <thead className="bg-[var(--bg-subtle)] text-xs text-subtle">
            <tr>
              <th scope="col" className="px-4 py-2 font-medium">
                Date
              </th>
              <th scope="col" className="px-2 py-2 font-medium">
                Libellé
              </th>
              <th scope="col" className="px-4 py-2 text-right font-medium">
                Montant
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {ROWS.map((r) => (
              <tr key={r.l}>
                <td className="tabular whitespace-nowrap px-4 py-2 text-muted">{r.d}</td>
                <td className="max-w-0 truncate px-2 py-2">{r.l}</td>
                <td
                  className={`tabular whitespace-nowrap px-4 py-2 text-right font-medium ${r.a.startsWith("+") ? "text-emerald-700 dark:text-emerald-400" : ""}`}
                >
                  {r.a}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex flex-wrap items-center gap-2 border-t border-[var(--border)] px-4 py-3">
          {["Excel", "CSV", "OFX", "QIF", "Écritures"].map((f) => (
            <span key={f} className="rounded-lg border border-[var(--border)] px-2.5 py-1 text-xs font-medium text-muted">
              {f}
            </span>
          ))}
        </div>
      </div>
      <figcaption className="mt-3 text-center text-xs text-subtle">Illustration — données fictives</figcaption>
    </figure>
  );
}
