/** A positioned run of text extracted from a PDF page (top-left origin, PDF points). */
export interface TextItem {
  str: string;
  x: number;
  /** Distance from the top of the page to the baseline. */
  y: number;
  width: number;
  height: number;
  page: number;
}

export interface Cell {
  text: string;
  x0: number;
  x1: number;
}

export interface Line {
  page: number;
  y: number;
  height: number;
  cells: Cell[];
  text: string;
}

export interface PageText {
  page: number;
  width: number;
  height: number;
  items: TextItem[];
}

export type ColumnRole = "date" | "valueDate" | "description" | "debit" | "credit" | "amount" | "balance";

export interface Transaction {
  id: string;
  /** ISO date yyyy-mm-dd */
  date: string;
  valueDate?: string;
  description: string;
  /** Signed amount in minor units (cents). Negative = money out. */
  amount: number;
  /** Running balance printed on the statement, in cents, when present. */
  balance?: number;
  page: number;
  /** True when the sign could not be inferred from the layout and was guessed. */
  signGuessed?: boolean;
  /** Row-level balance check against the printed running balance. */
  balanceCheck?: "ok" | "mismatch";
  excluded?: boolean;
}

export type ReconciliationStatus = "verified" | "mismatch" | "unverifiable";

export interface Reconciliation {
  status: ReconciliationStatus;
  opening?: number;
  closing?: number;
  totalCredits: number;
  totalDebits: number;
  /** closing - (opening + credits - debits), in cents. */
  difference?: number;
  /** When the statement prints its own totals, we check them too. */
  printedTotals?: { debits?: number; credits?: number; match: boolean };
}

export type DateOrder = "DMY" | "MDY" | "YMD";

export interface ParsedStatement {
  fileName: string;
  pageCount: number;
  /** Identifier of the bank recognised on the statement (label only). */
  bankId?: string;
  bankName?: string;
  currency: string;
  decimalSeparator: "," | ".";
  dateOrder: DateOrder;
  periodStart?: string;
  periodEnd?: string;
  openingBalance?: number;
  closingBalance?: number;
  printedTotals?: { debits?: number; credits?: number };
  transactions: Transaction[];
  columns: ColumnRole[];
  reconciliation: Reconciliation;
  warnings: string[];
  /** "text" when the PDF has a text layer, "scanned" when it is an image-only document. */
  kind: "text" | "scanned" | "empty";
}
