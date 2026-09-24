"use client";

import { ArrowLeftRight, Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import { parseAmount } from "@/lib/statement/amounts";
import type { ParsedStatement, Transaction } from "@/lib/statement/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { cn } from "@/lib/cn";
import { useMediaQuery } from "@/lib/use-media-query";
import { frDate, money } from "./format";
import { newId } from "./workspace";

interface Props {
  st: ParsedStatement;
  onChange: (transactions: Transaction[]) => void;
}

interface Draft {
  date: string;
  description: string;
  amount: string;
}

function toDraft(t: Transaction): Draft {
  return { date: t.date, description: t.description, amount: (t.amount / 100).toFixed(2).replace(".", ",") };
}

export function TransactionsTable({ st, onChange }: Props) {
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const desktop = useMediaQuery("(min-width: 768px)");
  const c = st.currency;
  const rows = st.transactions;
  const LIMIT = 150;
  const visible = showAll ? rows : rows.slice(0, LIMIT);

  const update = (id: string, patch: Partial<Transaction>) => onChange(rows.map((t) => (t.id === id ? { ...t, ...patch } : t)));

  const startEdit = (t: Transaction) => {
    setEditing(t.id);
    setDraft(toDraft(t));
    setError(null);
  };

  const saveEdit = (id: string) => {
    if (!draft) return;
    const raw = draft.amount.trim();
    const a = parseAmount(/[.,]\d{2}$/.test(raw) ? raw : `${raw},00`);
    if (!a) {
      setError("Montant invalide : utilisez le format -42,18 ou 1 850,00.");
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(draft.date)) {
      setError("Date invalide.");
      return;
    }
    update(id, {
      date: draft.date,
      description: draft.description.trim(),
      amount: a.sign === -1 ? -a.cents : a.cents,
      signGuessed: false,
      balanceCheck: undefined,
    });
    setEditing(null);
    setDraft(null);
    setError(null);
  };

  const addRow = () => {
    const last = rows[rows.length - 1];
    const t: Transaction = {
      id: `m-${newId()}`,
      date: last?.date ?? st.periodEnd ?? new Date().toISOString().slice(0, 10),
      description: "",
      amount: 0,
      page: last?.page ?? 1,
    };
    onChange([...rows, t]);
    startEdit(t);
  };

  const editor = (t: Transaction) =>
    draft ? (
      <form
        className="grid gap-2 sm:grid-cols-[9.5rem_1fr_8rem_auto] sm:items-center"
        onSubmit={(e) => {
          e.preventDefault();
          saveEdit(t.id);
        }}
      >
        <label className="sr-only" htmlFor={`d-${t.id}`}>
          Date
        </label>
        <Input
          id={`d-${t.id}`}
          type="date"
          value={draft.date}
          onChange={(e) => setDraft({ ...draft, date: e.target.value })}
          className="h-9 text-sm"
          required
        />
        <label className="sr-only" htmlFor={`l-${t.id}`}>
          Libellé
        </label>
        <Input
          id={`l-${t.id}`}
          value={draft.description}
          onChange={(e) => setDraft({ ...draft, description: e.target.value })}
          className="h-9 text-sm"
          placeholder="Libellé"
          autoFocus
        />
        <label className="sr-only" htmlFor={`a-${t.id}`}>
          Montant (négatif pour un débit)
        </label>
        <Input
          id={`a-${t.id}`}
          inputMode="decimal"
          value={draft.amount}
          onChange={(e) => setDraft({ ...draft, amount: e.target.value })}
          className="h-9 text-right text-sm tabular"
          placeholder="-42,18"
        />
        <div className="flex gap-1">
          <Button type="submit" size="sm" aria-label="Enregistrer la ligne" icon={<Check className="size-4" aria-hidden />} />
          <Button
            type="button"
            size="sm"
            variant="ghost"
            aria-label="Annuler la modification"
            onClick={() => {
              if (t.id.startsWith("m-") && !t.description && t.amount === 0) onChange(rows.filter((r) => r.id !== t.id));
              setEditing(null);
              setDraft(null);
              setError(null);
            }}
            icon={<X className="size-4" aria-hidden />}
          />
        </div>
        {error ? (
          <p role="alert" className="text-sm font-medium text-rose-600 sm:col-span-4">
            {error}
          </p>
        ) : null}
      </form>
    ) : null;

  const actions = (t: Transaction) => (
    <div className="flex items-center justify-end gap-0.5">
      <button
        type="button"
        className="rounded-lg p-2 text-subtle hover:bg-[var(--bg-subtle)] hover:text-[var(--fg)]"
        onClick={() => startEdit(t)}
        aria-label={`Modifier l'opération du ${frDate(t.date)}`}
        title="Modifier"
      >
        <Pencil className="size-4" aria-hidden />
      </button>
      <button
        type="button"
        className="rounded-lg p-2 text-subtle hover:bg-[var(--bg-subtle)] hover:text-[var(--fg)]"
        onClick={() => update(t.id, { amount: -t.amount, signGuessed: false })}
        aria-label={`Inverser le sens de l'opération du ${frDate(t.date)}`}
        title="Inverser débit / crédit"
      >
        <ArrowLeftRight className="size-4" aria-hidden />
      </button>
      <button
        type="button"
        className="rounded-lg p-2 text-subtle hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/50"
        onClick={() => onChange(rows.filter((r) => r.id !== t.id))}
        aria-label={`Supprimer l'opération du ${frDate(t.date)}`}
        title="Supprimer"
      >
        <Trash2 className="size-4" aria-hidden />
      </button>
    </div>
  );

  return (
    <div className="surface overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] px-4 py-3">
        <h3 className="font-semibold">
          {rows.length} opération{rows.length > 1 ? "s" : ""}
          {rows.some((r) => r.excluded) ? (
            <span className="ml-2 text-sm font-normal text-subtle">({rows.filter((r) => r.excluded).length} exclue(s))</span>
          ) : null}
        </h3>
        <Button size="sm" variant="secondary" onClick={addRow} icon={<Plus className="size-4" aria-hidden />}>
          Ajouter une ligne
        </Button>
      </div>

      {/* Desktop table (only one of the two views is rendered, to keep ids unique) */}
      {desktop ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm" data-testid="transactions-table">
            <thead className="bg-[var(--bg-subtle)] text-xs uppercase tracking-wide text-subtle">
              <tr>
                <th scope="col" className="w-12 px-4 py-2.5 font-semibold">
                  <span className="sr-only">Inclure</span>
                </th>
                <th scope="col" className="w-28 px-2 py-2.5 font-semibold">
                  Date
                </th>
                <th scope="col" className="px-2 py-2.5 font-semibold">
                  Libellé
                </th>
                <th scope="col" className="w-36 px-2 py-2.5 text-right font-semibold">
                  Montant
                </th>
                {st.transactions.some((t) => t.balance !== undefined) ? (
                  <th scope="col" className="w-36 px-2 py-2.5 text-right font-semibold">
                    Solde
                  </th>
                ) : null}
                <th scope="col" className="w-32 px-4 py-2.5 text-right font-semibold">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {visible.map((t) =>
                editing === t.id ? (
                  <tr key={t.id} className="bg-brand-50/50 dark:bg-brand-950/30">
                    <td colSpan={6} className="px-4 py-3">
                      {editor(t)}
                    </td>
                  </tr>
                ) : (
                  <tr
                    key={t.id}
                    className={cn(
                      t.excluded && "opacity-45",
                      (t.balanceCheck === "mismatch" || t.signGuessed) && "bg-amber-50/70 dark:bg-amber-950/20",
                    )}
                  >
                    <td className="px-4 py-2">
                      <input
                        type="checkbox"
                        className="size-4 cursor-pointer accent-brand-600"
                        checked={!t.excluded}
                        onChange={(e) => update(t.id, { excluded: !e.target.checked })}
                        aria-label={`Inclure l'opération du ${frDate(t.date)} dans l'export`}
                      />
                    </td>
                    <td className="tabular whitespace-nowrap px-2 py-2 text-muted">{frDate(t.date)}</td>
                    <td className="px-2 py-2">
                      <span className={cn(t.excluded && "line-through")}>
                        {t.description || <em className="text-subtle">Sans libellé</em>}
                      </span>
                      {t.signGuessed ? (
                        <span className="ml-2 text-xs font-medium text-amber-700 dark:text-amber-400">sens estimé</span>
                      ) : null}
                      {t.balanceCheck === "mismatch" ? (
                        <span className="ml-2 text-xs font-medium text-amber-700 dark:text-amber-400">solde de ligne incohérent</span>
                      ) : null}
                    </td>
                    <td
                      className={cn(
                        "tabular whitespace-nowrap px-2 py-2 text-right font-medium",
                        t.amount > 0 && "text-emerald-700 dark:text-emerald-400",
                      )}
                    >
                      {money(t.amount, c, true)}
                    </td>
                    {st.transactions.some((x) => x.balance !== undefined) ? (
                      <td className="tabular whitespace-nowrap px-2 py-2 text-right text-muted">{money(t.balance, c)}</td>
                    ) : null}
                    <td className="px-4 py-1">{actions(t)}</td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <ul className="divide-y divide-[var(--border)]" data-testid="transactions-list">
          {visible.map((t) => (
            <li
              key={t.id}
              className={cn(
                "px-4 py-3",
                t.excluded && "opacity-50",
                (t.balanceCheck === "mismatch" || t.signGuessed) && "bg-amber-50/70 dark:bg-amber-950/20",
              )}
            >
              {editing === t.id ? (
                editor(t)
              ) : (
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    className="mt-1 size-4 accent-brand-600"
                    checked={!t.excluded}
                    onChange={(e) => update(t.id, { excluded: !e.target.checked })}
                    aria-label={`Inclure l'opération du ${frDate(t.date)}`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="tabular text-xs text-subtle">{frDate(t.date)}</span>
                      <span className={cn("tabular text-sm font-semibold", t.amount > 0 && "text-emerald-700 dark:text-emerald-400")}>
                        {money(t.amount, c, true)}
                      </span>
                    </div>
                    <p className={cn("mt-0.5 break-words text-sm", t.excluded && "line-through")}>{t.description || "Sans libellé"}</p>
                    {t.signGuessed ? <p className="text-xs font-medium text-amber-700">sens estimé</p> : null}
                    <div className="-ml-2 mt-1">{actions(t)}</div>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {rows.length > LIMIT && !showAll ? (
        <div className="border-t border-[var(--border)] p-3 text-center">
          <Button variant="ghost" size="sm" onClick={() => setShowAll(true)}>
            Afficher les {rows.length - LIMIT} autres opérations
          </Button>
        </div>
      ) : null}
      {rows.length === 0 ? (
        <p className="p-6 text-center text-sm text-muted">Aucune opération. Ajoutez-en une manuellement ou vérifiez le fichier.</p>
      ) : null}
    </div>
  );
}
