"use client";

import { useMemo, useState } from "react";
import { parseAmount, scanAmounts } from "@/lib/statement/amounts";
import { track } from "@/lib/analytics/client";
import { Alert } from "@/components/ui/alert";
import { Field, Input, Textarea } from "@/components/ui/field";
import { money } from "@/components/converter/format";

function parseSigned(v: string): number | null {
  const t = v.trim();
  if (!t) return null;
  const a = parseAmount(/[.,]\d{2}\s*€?$/.test(t) ? t : `${t.replace(/\s*€$/, "")},00`);
  if (!a) return null;
  return a.sign === -1 ? -a.cents : a.cents;
}

/** Free tool: checks opening + movements = closing and suggests the likely cause of a gap. */
export function BalanceChecker() {
  const [opening, setOpening] = useState("");
  const [closing, setClosing] = useState("");
  const [lines, setLines] = useState("");
  const [touched, setTouched] = useState(false);

  const result = useMemo(() => {
    const o = parseSigned(opening);
    const c = parseSigned(closing);
    const amounts = lines
      .split(/\n/)
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => {
        const found = scanAmounts(l);
        const a = found[found.length - 1];
        if (!a) return null;
        const neg = a.sign === -1 || /^[-−–]/.test(l.trim()) || /[-−–]\s*€?\s*$/.test(l.trim());
        return neg ? -a.cents : a.cents;
      });
    const invalid = amounts.filter((a) => a === null).length;
    const valid = amounts.filter((a): a is number => a !== null);
    if (o === null || c === null) return {
        kind: "error" as const,
        error: opening.trim() && closing.trim() ? "Soldes invalides : utilisez le format 1 234,56 (signe moins si débiteur)." : null,
      };
    const credits = valid.filter((a) => a > 0).reduce((s, a) => s + a, 0);
    const debits = valid.filter((a) => a < 0).reduce((s, a) => s - a, 0);
    const diff = c - (o + credits - debits);
    const hints: string[] = [];
    if (diff !== 0) {
      const abs = Math.abs(diff);
      const same = valid.filter((a) => Math.abs(a) === abs);
      const half = valid.filter((a) => Math.abs(a) * 2 === abs);
      if (same.length)
        hints.push(`L'écart est égal au montant d'une opération (${money(same[0])}) : une ligne est peut-être en double ou manquante.`);
      if (half.length)
        hints.push(
          `L'écart vaut le double d'une opération (${money(half[0])}) : son signe est probablement inversé (débit saisi en crédit ou l'inverse).`,
        );
      if (abs % 900 === 0 || (abs % 9 === 0 && abs < 100000))
        hints.push("L'écart est divisible par 9 : c'est typique d'une inversion de chiffres (ex. 54,10 saisi 45,10).");
      if (!hints.length)
        hints.push("Vérifiez qu'aucune opération ne manque (frais bancaires, agios, cotisations) et que les soldes saisis sont les bons.");
    }
    const creditCount = valid.filter((a) => a > 0).length;
    const debitCount = valid.filter((a) => a < 0).length;
    return { kind: "ok" as const, o, c, credits, debits, diff, invalid, creditCount, debitCount, hints };
  }, [opening, closing, lines]);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form
        className="surface grid gap-4 p-6"
        onSubmit={(e) => e.preventDefault()}
        onChange={() => {
          if (!touched) {
            setTouched(true);
            track("free_tool_used", { tool: "balance" });
          }
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="bc-opening" label="Solde de départ" hint="Négatif si débiteur : -120,50">
            <Input
              id="bc-opening"
              inputMode="decimal"
              value={opening}
              onChange={(e) => setOpening(e.target.value)}
              placeholder="1 520,34"
            />
          </Field>
          <Field id="bc-closing" label="Solde final du relevé">
            <Input
              id="bc-closing"
              inputMode="decimal"
              value={closing}
              onChange={(e) => setClosing(e.target.value)}
              placeholder="2 630,78"
            />
          </Field>
        </div>
        <Field
          id="bc-lines"
          label="Opérations (une par ligne, débits avec un signe moins)"
          hint="Vous pouvez coller des lignes entières : le dernier montant de chaque ligne est pris en compte."
        >
          <Textarea
            id="bc-lines"
            value={lines}
            onChange={(e) => setLines(e.target.value)}
            className="min-h-56 font-mono text-sm"
            placeholder={"-42,18\n+1 850,00\n05/08 PRLV EDF -78,40"}
          />
        </Field>
      </form>
      <div className="grid content-start gap-4" aria-live="polite">
        {result?.kind === "ok" ? (
          <>
            <div className="surface grid gap-2 p-6 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">Solde de départ</span>
                <span className="tabular font-semibold">{money(result.o)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">
                  + Crédits ({result.creditCount} opération{result.creditCount > 1 ? "s" : ""})
                </span>
                <span className="tabular font-semibold">{money(result.credits)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">
                  − Débits ({result.debitCount} opération{result.debitCount > 1 ? "s" : ""})
                </span>
                <span className="tabular font-semibold">{money(result.debits)}</span>
              </div>
              <div className="flex justify-between border-t border-[var(--border)] pt-2">
                <span className="text-muted">= Solde calculé</span>
                <span className="tabular font-bold">{money(result.o + result.credits - result.debits)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Solde du relevé</span>
                <span className="tabular font-bold">{money(result.c)}</span>
              </div>
            </div>
            {result.diff === 0 ? (
              <Alert tone="success" title="Les comptes sont justes, au centime.">
                Le solde calculé correspond exactement au solde final.
              </Alert>
            ) : (
              <Alert tone="error" title={`Écart de ${money(Math.abs(result.diff))}`}>
                <ul className="mt-1 grid list-disc gap-1 pl-5">
                  {result.hints.map((h) => (
                    <li key={h}>{h}</li>
                  ))}
                </ul>
              </Alert>
            )}
            {result.invalid ? <Alert tone="warning">{result.invalid} ligne(s) sans montant reconnu ont été ignorées.</Alert> : null}
          </>
        ) : result?.kind === "error" && result.error ? (
          <Alert tone="error">{result.error}</Alert>
        ) : (
          <div className="rounded-2xl border border-dashed border-[var(--border-strong)] p-8 text-center text-sm text-muted">
            Saisissez le solde de départ, le solde final et les opérations : le résultat s&apos;affiche ici instantanément. Rien n&apos;est
            envoyé.
          </div>
        )}
      </div>
    </div>
  );
}
