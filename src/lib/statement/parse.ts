import { detectCurrency, parseAmount, scanAmounts, type ParsedAmount } from "./amounts";
import { detectBank } from "./banks";
import { findFullDates, inferDateOrder, leadingDate, parseRawDate, resolveDate, type RawDate } from "./dates";
import { buildLines, normaliseText } from "./layout";
import { reconcile } from "./reconcile";
import type { Cell, ColumnRole, DateOrder, Line, PageText, ParsedStatement, Transaction } from "./types";

type AmountRole = "debit" | "credit" | "amount" | "balance";

interface HeaderCol {
  role: ColumnRole;
  x0: number;
  x1: number;
}

interface PositionedAmount extends ParsedAmount {
  x0: number;
  x1: number;
}

interface Anchor {
  line: Line;
  date: RawDate;
  valueDate?: RawDate;
  descParts: string[];
  descX0?: number;
  lastY: number;
  lastPage: number;
  amounts: PositionedAmount[];
  inheritedDate?: boolean;
}

const HEADER_PATTERNS: [ColumnRole, RegExp][] = [
  ["valueDate", /^(date )?(de )?valeur$|^value( date)?$|^val\.?$|^date val\.?$/],
  ["date", /^date( operation| d'operation| op\.?| comptable| de l'operation| posted| transaction)?$|^jour$|^posting date$|^trans(action)? date$/],
  ["description", /^(libelle|libelles|operation|operations|nature|nature de l'operation|description|details?|designation|transaction|transactions|particulars|payee|memo|narrative|objet|intitule|detail des operations|libelle de l'operation)$/],
  ["debit", /^(debit|debits|sorties?|withdrawals?|paid out|money out|montant debit|debit eur|debit \(eur\)|debit en euros|payments?|charges|retraits?)$/],
  ["credit", /^(credit|credits|entrees?|deposits?|paid in|money in|montant credit|credit eur|credit \(eur\)|credit en euros|receipts|versements?)$/],
  ["amount", /^(montant|montants|amount|somme|montant eur|montant \(eur\)|montant en euros|amount \(eur\)|amount \(usd\))$/],
  ["balance", /^(solde|soldes|balance|running balance|solde eur|solde \(eur\))$/],
];

const OPENING_RE =
  /(ancien solde|solde precedent|solde anterieur|solde initial|solde d'ouverture|solde de debut|solde en debut|solde au debut|solde reporte|opening balance|previous balance|balance brought forward|brought forward|starting balance|balance at start|beginning balance)/;
const CLOSING_RE =
  /(nouveau solde|solde final|solde de fin|solde en fin|solde a la fin|solde de cloture|closing balance|new balance|ending balance|balance carried forward|carried forward|balance at end|final balance)/;
const GENERIC_BALANCE_RE = /\bsolde\b|\bbalance\b/;
const TOTAL_RE = /\btotal\b|\btotaux\b|sous-total|\bmouvements\b.*\btotal|total des operations|total des mouvements/;
const CARRY_RE = /\ba reporter\b|\breport\b|\breporte\b|carried forward|brought forward|\bà reporter\b/;
const NEGATIVE_BALANCE_RE = /debiteur|\boverdrawn\b|\bdebit balance\b|\bOD\b/;
const CREDIT_HINT_RE =
  /\b(vir(ement)?s? (sepa )?(recu|de|en votre faveur|inst(antane)? recu)|remise|salaire|depot|versement|avoir|remboursement|refund|deposit|credit interest|interets crediteurs|prime|payment received|transfer from)\b/;
const DEBIT_HINT_RE =
  /\b(carte|cb|prlv|prelevement|retrait|dab|achat|frais|cotisation|echeance|commission|agios|paiement|card|withdrawal|atm|direct debit|fee|purchase|vir(ement)? (sepa )?(emis|vers|permanent)|transfer to)\b/;

function amountCells(line: Line, skipFirst: number): PositionedAmount[] {
  const out: PositionedAmount[] = [];
  line.cells.forEach((c, i) => {
    if (i < skipFirst) return;
    const a = parseAmount(c.text);
    if (a) out.push({ ...a, x0: c.x0, x1: c.x1 });
  });
  return out;
}

function headerRoles(line: Line): HeaderCol[] {
  const cols: HeaderCol[] = [];
  for (const c of line.cells) {
    const n = normaliseText(c.text).replace(/[:.]$/, "");
    let matched = false;
    for (const [role, re] of HEADER_PATTERNS) {
      if (re.test(n)) {
        cols.push({ role, x0: c.x0, x1: c.x1 });
        matched = true;
        break;
      }
    }
    if (!matched) {
      // Some PDFs merge neighbouring header words into one cell ("Débit Crédit").
      const words = n.split(" ");
      if (words.length >= 2 && words.length <= 4) {
        const roles: ColumnRole[] = [];
        for (const w of words) {
          for (const [role, re] of HEADER_PATTERNS) {
            if (re.test(w) && role !== "description" && !roles.includes(role)) roles.push(role);
          }
        }
        if (roles.length >= 2 && roles.length === words.length) {
          const step = (c.x1 - c.x0) / roles.length;
          roles.forEach((role, i) => cols.push({ role, x0: c.x0 + i * step, x1: c.x0 + (i + 1) * step }));
        }
      }
    }
  }
  const amountish = cols.filter((c) => ["debit", "credit", "amount", "balance"].includes(c.role));
  const hasDateOrDesc = cols.some((c) => c.role === "date" || c.role === "description");
  if (amountish.length >= 1 && hasDateOrDesc && cols.length >= 2) return cols;
  return [];
}

/** 1-D clustering of amount positions. */
function cluster(values: number[], tol: number): number[] {
  const sorted = [...values].sort((a, b) => a - b);
  const centers: { sum: number; n: number }[] = [];
  for (const v of sorted) {
    const last = centers[centers.length - 1];
    if (last && v - last.sum / last.n <= tol) {
      last.sum += v;
      last.n++;
    } else centers.push({ sum: v, n: 1 });
  }
  return centers.map((c) => c.sum / c.n);
}

function nearestIndex(centers: number[], v: number) {
  let best = 0;
  let dist = Infinity;
  centers.forEach((c, i) => {
    const d = Math.abs(c - v);
    if (d < dist) {
      dist = d;
      best = i;
    }
  });
  return best;
}

/** Joins wrapped label lines; a line ending with "-" or "/" was cut inside a word or reference. */
function joinLabel(parts: string[]): string {
  let out = "";
  for (const p of parts) {
    if (!out) out = p;
    else if (/[-/]$/.test(out) && /^[\p{L}\p{N}]/u.test(p)) out += p;
    else out += " " + p;
  }
  return out.replace(/\s+/g, " ").trim();
}

function detectPeriod(text: string, order: DateOrder): { start?: string; end?: string } {
  const n = normaliseText(text);
  // "du 01/08/2026 au 31/08/2026", "période du ... au ...", "from ... to ..."
  const m =
    /(?:du|periode du|period|from|statement period|releve du)\s*:?\s*(.{6,22}?)\s+(?:au|to|-|–)\s+(.{6,22}?)(?:\s|$|,|\))/.exec(n);
  if (m) {
    const a = findFullDates(m[1], order)[0];
    const b = findFullDates(m[2], order)[0];
    if (a && b) return a <= b ? { start: a, end: b } : { start: b, end: a };
  }
  return {};
}

export function parseStatement(pages: PageText[], fileName = "releve.pdf"): ParsedStatement {
  const lines = buildLines(pages);
  const warnings: string[] = [];
  const pageCount = pages.length;
  const allText = lines.map((l) => l.text).join("\n");
  const textChars = allText.replace(/\s/g, "").length;

  const empty = (kind: ParsedStatement["kind"]): ParsedStatement => ({
    fileName,
    pageCount,
    currency: "EUR",
    decimalSeparator: ",",
    dateOrder: "DMY",
    transactions: [],
    columns: [],
    reconciliation: { status: "unverifiable", totalCredits: 0, totalDebits: 0 },
    warnings,
    kind,
  });

  if (pageCount === 0 || textChars === 0) return empty(pageCount === 0 ? "empty" : "scanned");
  if (textChars < 40 * pageCount) {
    warnings.push("Très peu de texte détecté : ce PDF ressemble à un document scanné (image).");
    return empty("scanned");
  }

  // Locale detection from all amounts in the document.
  let commaCount = 0;
  let dotCount = 0;
  for (const l of lines) for (const c of l.cells) {
    const a = parseAmount(c.text);
    if (a) (a.decimal === "," ? commaCount++ : dotCount++);
  }
  const decimalSeparator: "," | "." = dotCount > commaCount ? "." : ",";
  const currency = detectCurrency(allText);
  const firstPageText = lines.filter((l) => l.page === 1).map((l) => l.text).join("\n");
  const bank = detectBank(firstPageText) ?? detectBank(allText);

  // Date order from the leading dates of every line.
  const rawDates: RawDate[] = [];
  for (const l of lines) {
    const ld = leadingDate(l.cells[0].text);
    if (ld) rawDates.push(ld.date);
  }
  const dateOrder = inferDateOrder(rawDates, decimalSeparator, currency);

  let period = detectPeriod(firstPageText, dateOrder);
  if (!period.end) {
    const full = findFullDates(allText, dateOrder).sort();
    if (full.length) period = { start: full[0], end: full[full.length - 1] };
  }

  const pageWidth = new Map(pages.map((p) => [p.page, p.width]));

  // Pass 1: find headers, anchors (dated rows) and balance lines.
  let header: HeaderCol[] = [];
  const headerByPage = new Map<number, HeaderCol[]>();
  const anchors: Anchor[] = [];
  const balanceLines: { line: Line; kind: "opening" | "closing" | "generic"; beforeFirstAnchor: boolean }[] = [];
  const totalLines: Line[] = [];
  let current: Anchor | undefined;

  for (const line of lines) {
    const width = pageWidth.get(line.page) ?? 600;
    const n = normaliseText(line.text);

    const h = headerRoles(line);
    if (h.length) {
      header = h;
      headerByPage.set(line.page, h);
      current = undefined;
      continue;
    }

    const first = line.cells[0];
    const ld = first.x0 < width * 0.35 ? leadingDate(first.text) : null;
    const isBalanceLine =
      (OPENING_RE.test(n) || CLOSING_RE.test(n) || (GENERIC_BALANCE_RE.test(n) && !ld)) && scanAmounts(line.text).length > 0;

    if (isBalanceLine && !(ld && !GENERIC_BALANCE_RE.test(normaliseText(ld.rest)) && !OPENING_RE.test(n) && !CLOSING_RE.test(n))) {
      if (!CARRY_RE.test(n) || OPENING_RE.test(n) || CLOSING_RE.test(n)) {
        balanceLines.push({
          line,
          kind: OPENING_RE.test(n) ? "opening" : CLOSING_RE.test(n) ? "closing" : "generic",
          beforeFirstAnchor: anchors.length === 0,
        });
      }
      current = undefined;
      continue;
    }
    if (TOTAL_RE.test(n) || (CARRY_RE.test(n) && !ld)) {
      if (TOTAL_RE.test(n)) totalLines.push(line);
      current = undefined;
      continue;
    }

    if (ld) {
      // Date cell may contain "02/08 02/08" or the rest of the label.
      let rest = ld.rest;
      let valueDate: RawDate | undefined;
      const second = leadingDate(rest);
      if (second && (!second.rest || !/^\d/.test(second.rest))) {
        valueDate = second.date;
        rest = second.rest;
      }
      const descCells: Cell[] = [];
      if (rest) descCells.push({ text: rest, x0: first.x0, x1: first.x1 });
      const amounts: PositionedAmount[] = [];
      for (const c of line.cells.slice(1)) {
        const a = parseAmount(c.text);
        if (a) {
          amounts.push({ ...a, x0: c.x0, x1: c.x1 });
          continue;
        }
        const d = parseRawDate(c.text);
        if (d && !valueDate) {
          valueDate = d;
          continue;
        }
        if (d) continue;
        descCells.push(c);
      }
      const desc = descCells.map((c) => c.text).join(" ").trim();
      if (amounts.length === 0 && !desc) {
        current = undefined;
        continue;
      }
      current = {
        line,
        date: ld.date,
        valueDate,
        descParts: desc ? [desc] : [],
        descX0: descCells[0]?.x0,
        lastY: line.y,
        lastPage: line.page,
        amounts,
      };
      anchors.push(current);
      continue;
    }

    // Undated line: continuation of the previous label, or a same-day operation.
    if (!current) continue;
    const gap = line.page === current.lastPage ? line.y - current.lastY : Infinity;
    if (gap > line.height * 2.6) {
      current = undefined;
      continue;
    }
    const amounts = amountCells(line, 0);
    const textCells = line.cells.filter((c) => !parseAmount(c.text));
    const text = textCells.map((c) => c.text).join(" ").trim();
    const aligned =
      current.descX0 === undefined || textCells.length === 0 || Math.abs(textCells[0].x0 - current.descX0) < line.height * 3;
    if (!aligned) continue;

    if (amounts.length === 0) {
      if (text) current.descParts.push(text);
      current.lastY = line.y;
    } else if (current.amounts.length === 0) {
      // Label on the dated line, amount on the following line.
      current.amounts.push(...amounts.map((a) => a));
      if (text) current.descParts.push(text);
      current.lastY = line.y;
    } else if (text) {
      const inherited: Anchor = {
        line,
        date: current.date,
        valueDate: current.valueDate,
        descParts: [text],
        descX0: textCells[0]?.x0,
        lastY: line.y,
        lastPage: line.page,
        amounts,
        inheritedDate: true,
      };
      anchors.push(inherited);
      current = inherited;
    }
  }

  // Anchors without any amount are not operations.
  const rows = anchors.filter((a) => a.amounts.length > 0);
  if (!rows.length) {
    warnings.push("Aucune opération datée avec un montant n'a été trouvée dans ce document.");
    return { ...empty("text"), currency, decimalSeparator, dateOrder, bankId: bank?.id, bankName: bank?.name };
  }

  // Pass 2: column model. Cluster amount right edges (amounts are right-aligned in most statements).
  const allAmounts = rows.flatMap((r) => r.amounts);
  const tol = 9;
  const byRight = cluster(allAmounts.map((a) => a.x1), tol);
  const byLeft = cluster(allAmounts.map((a) => a.x0), tol);
  const useLeft = byLeft.length < byRight.length;
  const centers = useLeft ? byLeft : byRight;
  const key = (a: PositionedAmount) => (useLeft ? a.x0 : a.x1);

  const roleOfCluster: AmountRole[] = new Array(centers.length).fill("amount");
  const headerAmountCols = (header.length ? header : [...headerByPage.values()][0] ?? []).filter((c) =>
    ["debit", "credit", "amount", "balance"].includes(c.role),
  );

  if (headerAmountCols.length) {
    const hc = [...headerAmountCols].sort((a, b) => a.x0 - b.x0);
    if (hc.length === centers.length) {
      hc.forEach((c, i) => (roleOfCluster[i] = c.role as AmountRole));
    } else {
      centers.forEach((cx, i) => {
        let best = hc[0];
        let d = Infinity;
        for (const c of hc) {
          const dist = Math.min(Math.abs(c.x1 - cx), Math.abs((c.x0 + c.x1) / 2 - cx), Math.abs(c.x0 - cx));
          if (dist < d) {
            d = dist;
            best = c;
          }
        }
        roleOfCluster[i] = best.role as AmountRole;
      });
    }
  } else {
    warnings.push("Pas d'en-tête de colonnes reconnu : les colonnes ont été déduites de la mise en page.");
    const fill = centers.map(() => 0);
    for (const r of rows) {
      const seen = new Set(r.amounts.map((a) => nearestIndex(centers, key(a))));
      seen.forEach((i) => fill[i]++);
    }
    const k = centers.length;
    let remaining = [...Array(k).keys()];
    if (k >= 2 && fill[k - 1] >= rows.length * 0.85) {
      roleOfCluster[k - 1] = "balance";
      remaining = remaining.slice(0, -1);
    }
    if (remaining.length >= 2) {
      const [d, c] = remaining.slice(-2);
      roleOfCluster[d] = "debit";
      roleOfCluster[c] = "credit";
      remaining.slice(0, -2).forEach((i) => (roleOfCluster[i] = "amount"));
    } else if (remaining.length === 1) {
      roleOfCluster[remaining[0]] = "amount";
    }
  }

  const columns: ColumnRole[] = ["date"];
  if (rows.some((r) => r.valueDate)) columns.push("valueDate");
  columns.push("description");
  for (const r of ["debit", "credit", "amount", "balance"] as AmountRole[]) {
    if (roleOfCluster.includes(r)) columns.push(r);
  }

  // Pass 3: build transactions.
  let guessed = 0;
  const transactions: Transaction[] = rows.map((r, idx) => {
    let debit: number | undefined;
    let credit: number | undefined;
    let amount: number | undefined;
    let amountSign: -1 | 0 | 1 = 0;
    let balance: number | undefined;
    for (const a of r.amounts) {
      const role = roleOfCluster[nearestIndex(centers, key(a))];
      if (role === "debit") debit = (debit ?? 0) + a.cents;
      else if (role === "credit") credit = (credit ?? 0) + a.cents;
      else if (role === "balance") balance = a.sign === -1 ? -a.cents : a.cents;
      else {
        amount = a.cents;
        amountSign = a.sign;
      }
    }
    let signed = 0;
    let signGuessed = false;
    if (debit !== undefined || credit !== undefined) {
      signed = (credit ?? 0) - (debit ?? 0);
    } else if (amount !== undefined) {
      if (amountSign !== 0) signed = amountSign * amount;
      else {
        signed = -amount;
        signGuessed = true;
      }
    }
    const period2 = period;
    const date = resolveDate(r.date, dateOrder, period2) ?? "";
    const valueDate = r.valueDate ? resolveDate(r.valueDate, dateOrder, period2) ?? undefined : undefined;
    return {
      id: `t${idx + 1}`,
      date,
      valueDate,
      description: joinLabel(r.descParts),
      amount: signed,
      balance,
      page: r.line.page,
      signGuessed,
    };
  });

  // Balances.
  const balanceAmount = (line: Line): number | undefined => {
    const amounts = amountCells(line, 0);
    const scanned = amounts.length ? amounts : scanAmounts(line.text).map((a) => ({ ...a, x0: 0, x1: 0 }));
    if (!scanned.length) return undefined;
    const a = scanned[scanned.length - 1];
    const n = normaliseText(line.text);
    let sign = a.sign === -1 ? -1 : 1;
    if (NEGATIVE_BALANCE_RE.test(n)) sign = -1;
    if (a.x1 > 0 && amounts.length) {
      const role = roleOfCluster[nearestIndex(centers, key(a as PositionedAmount))];
      if (role === "debit" && Math.abs(key(a as PositionedAmount) - centers[nearestIndex(centers, key(a as PositionedAmount))]) < 30) sign = -1;
    }
    return sign * a.cents;
  };

  let opening: number | undefined;
  let closing: number | undefined;
  let openingDerived = false;
  const firstRowLine = rows[0].line;
  const lastRowLine = rows[rows.length - 1].line;
  const isBefore = (l: Line, ref: Line) => l.page < ref.page || (l.page === ref.page && l.y < ref.y);
  for (const b of balanceLines) {
    const v = balanceAmount(b.line);
    if (v === undefined) continue;
    if (b.kind === "opening" && opening === undefined && (b.beforeFirstAnchor || isBefore(b.line, firstRowLine))) opening = v;
    if (b.kind === "closing") closing = v;
  }
  if (opening === undefined) {
    const g = balanceLines.find((b) => b.kind !== "closing" && isBefore(b.line, firstRowLine));
    if (g) opening = balanceAmount(g.line);
  }
  if (closing === undefined) {
    const after = balanceLines.filter((b) => b.kind !== "opening" && isBefore(lastRowLine, b.line));
    if (after.length) closing = balanceAmount(after[after.length - 1].line);
  }

  // Row-level running balance → infer unknown signs and check rows.
  const hasBalances = transactions.some((t) => t.balance !== undefined);
  if (hasBalances) {
    let prev = opening;
    for (const t of transactions) {
      if (t.balance === undefined) {
        prev = prev !== undefined ? prev + t.amount : undefined;
        continue;
      }
      if (prev !== undefined) {
        const diff = t.balance - prev;
        if (t.signGuessed && Math.abs(diff) === Math.abs(t.amount)) {
          t.amount = diff;
          t.signGuessed = false;
        }
        t.balanceCheck = diff === t.amount ? "ok" : "mismatch";
      }
      prev = t.balance;
    }
    // Derive missing opening from the first printed running balance.
    const firstWithBalance = transactions.find((t) => t.balance !== undefined);
    if (opening === undefined && firstWithBalance && firstWithBalance === transactions[0] && transactions[0].balance !== undefined) {
      openingDerived = true;
    }
    if (closing === undefined) {
      const lastB = [...transactions].reverse().find((t) => t.balance !== undefined);
      if (lastB && lastB === transactions[transactions.length - 1]) closing = lastB.balance;
    }
  }

  // Remaining guessed signs: use label keywords.
  for (const t of transactions) {
    if (!t.signGuessed) continue;
    const n = normaliseText(t.description);
    if (CREDIT_HINT_RE.test(n) && !DEBIT_HINT_RE.test(n)) t.amount = Math.abs(t.amount);
    else t.amount = -Math.abs(t.amount);
    guessed++;
  }
  if (guessed) warnings.push(`${guessed} montant(s) sans signe explicite : le sens (débit/crédit) a été estimé, vérifiez-les.`);

  if (openingDerived && transactions[0].balance !== undefined) {
    opening = transactions[0].balance - transactions[0].amount;
    warnings.push("Aucun solde de départ imprimé : il a été déduit du solde de la première opération.");
  }

  // Printed totals ("Total des opérations 1 234,56 2 345,67").
  let printedTotals: ParsedStatement["printedTotals"];
  for (const l of totalLines) {
    const amounts = amountCells(l, 0);
    if (!amounts.length) continue;
    const t: { debits?: number; credits?: number } = {};
    for (const a of amounts) {
      const role = roleOfCluster[nearestIndex(centers, key(a))];
      if (role === "debit") t.debits = a.cents;
      if (role === "credit") t.credits = a.cents;
    }
    if (t.debits !== undefined || t.credits !== undefined) printedTotals = t;
  }

  let rec = reconcile(transactions, opening, closing, printedTotals);

  // If debit/credit columns were inferred (no header), a swap may be the right reading.
  if (rec.status === "mismatch" && !headerAmountCols.length && roleOfCluster.includes("debit")) {
    const swapped = transactions.map((t) => ({ ...t, amount: -t.amount }));
    const rec2 = reconcile(swapped, opening, closing, printedTotals);
    if (rec2.status === "verified") {
      transactions.splice(0, transactions.length, ...swapped);
      rec = rec2;
      warnings.push("Les colonnes débit et crédit ont été inversées d'après la vérification du solde.");
    }
  }

  if (opening === undefined && !openingDerived) warnings.push("Solde de départ introuvable sur le relevé.");
  if (closing === undefined) warnings.push("Solde final introuvable sur le relevé.");
  const undated = transactions.filter((t) => !t.date).length;
  if (undated) warnings.push(`${undated} date(s) n'ont pas pu être complétées (année manquante).`);

  return {
    fileName,
    pageCount,
    bankId: bank?.id,
    bankName: bank?.name,
    currency,
    decimalSeparator,
    dateOrder,
    periodStart: period.start,
    periodEnd: period.end,
    openingBalance: opening,
    closingBalance: closing,
    printedTotals,
    transactions,
    columns,
    reconciliation: rec,
    warnings,
    kind: "text",
  };
}
