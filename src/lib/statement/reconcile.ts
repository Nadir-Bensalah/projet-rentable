import type { Reconciliation, Transaction } from "./types";

/**
 * The core promise of the product: opening balance + credits − debits must equal
 * the closing balance printed by the bank, to the cent.
 */
export function reconcile(
  transactions: Transaction[],
  opening: number | undefined,
  closing: number | undefined,
  printed?: { debits?: number; credits?: number },
): Reconciliation {
  let totalCredits = 0;
  let totalDebits = 0;
  for (const t of transactions) {
    if (t.excluded) continue;
    if (t.amount >= 0) totalCredits += t.amount;
    else totalDebits += -t.amount;
  }
  let printedTotals: Reconciliation["printedTotals"];
  if (printed && (printed.debits !== undefined || printed.credits !== undefined)) {
    const match =
      (printed.debits === undefined || printed.debits === totalDebits) &&
      (printed.credits === undefined || printed.credits === totalCredits);
    printedTotals = { ...printed, match };
  }
  if (opening === undefined || closing === undefined) {
    if (printedTotals) {
      return {
        status: printedTotals.match ? "verified" : "mismatch",
        opening,
        closing,
        totalCredits,
        totalDebits,
        printedTotals,
      };
    }
    return { status: "unverifiable", opening, closing, totalCredits, totalDebits };
  }
  const difference = closing - (opening + totalCredits - totalDebits);
  const ok = difference === 0 && (printedTotals ? printedTotals.match : true);
  return {
    status: ok ? "verified" : "mismatch",
    opening,
    closing,
    totalCredits,
    totalDebits,
    difference,
    printedTotals,
  };
}
