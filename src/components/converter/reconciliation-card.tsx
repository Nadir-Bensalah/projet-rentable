"use client";

import { AlertTriangle, CheckCircle2, HelpCircle } from "lucide-react";
import { useState } from "react";
import { parseAmount } from "@/lib/statement/amounts";
import type { ParsedStatement } from "@/lib/statement/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { money } from "./format";

export function ReconciliationCard({ st, onBalances }: { st: ParsedStatement; onBalances: (opening?: number, closing?: number) => void }) {
  const r = st.reconciliation;
  const c = st.currency;
  const [editing, setEditing] = useState(false);
  const [opening, setOpening] = useState(st.openingBalance !== undefined ? (st.openingBalance / 100).toFixed(2).replace(".", ",") : "");
  const [closing, setClosing] = useState(st.closingBalance !== undefined ? (st.closingBalance / 100).toFixed(2).replace(".", ",") : "");
  const [error, setError] = useState<string | null>(null);

  const apply = () => {
    const parse = (v: string) => {
      if (!v.trim()) return undefined;
      const a = parseAmount(v.includes(",") || v.includes(".") ? v : `${v},00`);
      if (!a) return null;
      return a.sign === -1 ? -a.cents : a.cents;
    };
    const o = parse(opening);
    const cl = parse(closing);
    if (o === null || cl === null) {
      setError("Saisissez des montants au format 1 234,56 (ajoutez un signe moins pour un solde débiteur).");
      return;
    }
    setError(null);
    onBalances(o, cl);
    setEditing(false);
  };

  const equation = (
    <p className="tabular mt-1 text-sm">
      {money(r.opening, c)} + {money(r.totalCredits, c)} − {money(r.totalDebits, c)} = {money((r.opening ?? 0) + r.totalCredits - r.totalDebits, c)}
    </p>
  );

  return (
    <div
      className={
        r.status === "verified"
          ? "rounded-2xl border border-emerald-300 bg-emerald-50 p-5 dark:border-emerald-800 dark:bg-emerald-950/40"
          : r.status === "mismatch"
            ? "rounded-2xl border border-rose-300 bg-rose-50 p-5 dark:border-rose-800 dark:bg-rose-950/40"
            : "rounded-2xl border border-amber-300 bg-amber-50 p-5 dark:border-amber-800 dark:bg-amber-950/40"
      }
      data-testid="reconciliation"
      data-status={r.status}
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        {r.status === "verified" ? (
          <CheckCircle2 className="mt-0.5 size-6 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
        ) : r.status === "mismatch" ? (
          <AlertTriangle className="mt-0.5 size-6 shrink-0 text-rose-600 dark:text-rose-400" aria-hidden />
        ) : (
          <HelpCircle className="mt-0.5 size-6 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
        )}
        <div className="min-w-0 flex-1">
          {r.status === "verified" ? (
            <>
              <p className="font-semibold text-emerald-900 dark:text-emerald-100">Relevé vérifié au centime</p>
              {r.opening !== undefined ? <div className="text-emerald-900/80 dark:text-emerald-200/90">{equation}</div> : null}
              {r.opening === undefined && r.printedTotals ? (
                <p className="mt-1 text-sm text-emerald-900/80 dark:text-emerald-200/90">Les totaux calculés correspondent aux totaux imprimés sur le relevé.</p>
              ) : null}
            </>
          ) : r.status === "mismatch" ? (
            <>
              <p className="font-semibold text-rose-900 dark:text-rose-100">
                {r.difference !== undefined ? `Écart de ${money(Math.abs(r.difference), c)} avec le solde final` : "Les totaux ne correspondent pas à ceux du relevé"}
              </p>
              {r.opening !== undefined ? <div className="text-rose-900/80 dark:text-rose-200/90">{equation}</div> : null}
              <p className="mt-2 text-sm text-rose-900/80 dark:text-rose-200/90">
                Solde final imprimé : <span className="tabular font-semibold">{money(r.closing, c)}</span>. Vérifiez les lignes signalées, le sens des montants (débit/crédit) ou une opération manquante.
              </p>
            </>
          ) : (
            <>
              <p className="font-semibold text-amber-900 dark:text-amber-100">Contrôle impossible : soldes non trouvés sur le relevé</p>
              <p className="mt-1 text-sm text-amber-900/80 dark:text-amber-200/90">Saisissez le solde de départ et le solde final indiqués sur votre relevé pour lancer la vérification.</p>
            </>
          )}
          {r.printedTotals && r.status !== "verified" ? (
            <p className="mt-2 text-sm opacity-80">
              Totaux imprimés : débits {money(r.printedTotals.debits, c)}, crédits {money(r.printedTotals.credits, c)} — calculés : débits {money(r.totalDebits, c)}, crédits {money(r.totalCredits, c)}.
            </p>
          ) : null}
          {!editing ? (
            <button type="button" onClick={() => setEditing(true)} className="mt-3 text-sm font-semibold underline underline-offset-4 opacity-90 hover:opacity-100">
              {r.status === "unverifiable" ? "Saisir les soldes" : "Modifier les soldes"}
            </button>
          ) : (
            <form
              className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
              onSubmit={(e) => {
                e.preventDefault();
                apply();
              }}
            >
              <div>
                <label htmlFor={`opening-${st.fileName}`} className="mb-1 block text-xs font-semibold">Solde de départ</label>
                <Input id={`opening-${st.fileName}`} inputMode="decimal" value={opening} onChange={(e) => setOpening(e.target.value)} placeholder="1 520,34" className="h-10 bg-white dark:bg-slate-900" />
              </div>
              <div>
                <label htmlFor={`closing-${st.fileName}`} className="mb-1 block text-xs font-semibold">Solde final</label>
                <Input id={`closing-${st.fileName}`} inputMode="decimal" value={closing} onChange={(e) => setClosing(e.target.value)} placeholder="2 630,78" className="h-10 bg-white dark:bg-slate-900" />
              </div>
              <div className="flex gap-2">
                <Button type="submit" size="sm">Vérifier</Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(false)}>Annuler</Button>
              </div>
              {error ? <p role="alert" className="text-sm font-medium text-rose-700 sm:col-span-3 dark:text-rose-300">{error}</p> : null}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
