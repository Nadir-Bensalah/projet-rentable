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
  /** Label fragments with their vertical position (sorted before joining). */
  descParts: { y: number; text: string }[];
  descX0?: number;
  lastY: number;
  lastPage: number;
  amounts: PositionedAmount[];
  inheritedDate?: boolean;
}

const HEADER_PATTERNS: [ColumnRole, RegExp][] = [
  ["valueDate", /^(date )?(de )?valeur$|^value( date)?$|^val\.?$|^date val\.?$/],
  [
    "date",
    /^date( operation| d'operation| op\.?| comptable| de l'operation| posted| transaction)?$|^jour$|^posting date$|^trans(action)? date$/,
  ],
  [
    "description",
    /^(libelle|libelles|operation|operations|nature|nature de l'operation|description|details?|designation|transaction|transactions|particulars|payee|memo|narrative|objet|intitule|detail des operations|libelle de l'operation)$/,
  ],
  [
    "debit",
    /^(debit|debits|sorties?|withdrawals?|paid out|money out|montant debit|debit eur|debit \(eur\)|debit en euros|payments?|charges|retraits?)$/,
  ],
  [
    "credit",
    /^(credit|credits|entrees?|deposits?|paid in|money in|montant credit|credit eur|credit \(eur\)|credit en euros|receipts|versements?)$/,
  ],
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
function joinLabel(fragments: { y: number; text: string }[]): string {
  const parts = [...fragments].sort((a, b) => a.y - b.y).map((f) => f.text);
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
  // "du 01/08/2026 au 31/08/2026", "période du ... au ...", "from ... to ...", also 2-digit years.
  const m = /(?:du|periode du|period|from|statement period|releve du)\s*:?\s*(.{6,22}?)\s+(?:au|to|-|–)\s+(.{6,22}?)(?:\s|$|,|\))/.exec(n);
  if (m) {
    const full = (t: string) => findFullDates(t, order)[0] ?? shortYearDate(t, order);
    const a = full(m[1]);
    const b = full(m[2]);
    if (a && b) return a <= b ? { start: a, end: b } : { start: b, end: a };
  }
  return {};
}

function shortYearDate(text: string, order: DateOrder): string | undefined {
  const m = /(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{2})(?!\d)/.exec(text);
  if (!m) return undefined;
  const raw = parseRawDate(m[0]);
  return raw ? (resolveDate(raw, order) ?? undefined) : undefined;
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

  if (pageCount === 0) return empty("empty");
  if (textChars === 0) {
    warnings.push("Aucun texte lisible : ce PDF est vide ou il s'agit d'une image (document scanné).");
    return empty("scanned");
  }
  if (textChars < 40 * pageCount) {
    warnings.push("Très peu de texte détecté : ce PDF ressemble à un document scanné (image).");
    return empty("scanned");
  }

  // Locale detection from all amounts in the document.
  let commaCount = 0;
  let dotCount = 0;
  const amountCellTexts: string[] = [];
  for (const l of lines)
    for (const c of l.cells) {
      const a = parseAmount(c.text);
      if (a) amountCellTexts.push(c.text);
      if (a?.decimal === ",") commaCount++;
      else if (a) dotCount++;
    }
  const decimalSeparator: "," | "." = dotCount > commaCount ? "." : ",";
  const firstPageText = lines
    .filter((l) => l.page === 1)
    .map((l) => l.text)
    .join("\n");
  const balanceText = lines
    .filter((l) => /\bsolde\b|\bbalance\b|\bdevise\b|\bcurrency\b|\bcompte en\b|\baccount\b/i.test(normaliseText(l.text)))
    .map((l) => l.text)
    .join("\n");
  const currency = detectCurrency(allText, `${amountCellTexts.join(" ")}\n${balanceText}`);
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

  // Pass 1: find headers, anchors (dated rows), label continuations and balance lines.
  let header: HeaderCol[] = [];
  const headerByPage = new Map<number, HeaderCol[]>();
  const anchors: Anchor[] = [];
  const continuations: { anchor: Anchor; line: Line; text: string }[] = [];
  const balanceLines: { line: Line; kind: "opening" | "closing" | "generic"; beforeFirstAnchor: boolean }[] = [];
  const totalLines: Line[] = [];
  let current: Anchor | undefined;
  // Text lines seen just before a dated row (possible first half of a vertically centred label).
  let orphans: Line[] = [];
  const orphanLinks: { anchor: Anchor; line: Line }[] = [];

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
      // Plain-text statements may put label and amounts in one run: take trailing amounts.
      if (!amounts.length && descCells.length) {
        const last = descCells[descCells.length - 1];
        const trailing = trailingAmounts(last);
        if (trailing) {
          amounts.push(...trailing.amounts);
          last.text = trailing.rest;
        }
      }
      const desc = descCells
        .map((c) => c.text)
        .join(" ")
        .trim();
      if (amounts.length === 0 && !desc) {
        current = undefined;
        continue;
      }
      current = {
        line,
        date: ld.date,
        valueDate,
        descParts: desc ? [{ y: line.y, text: desc }] : [],
        descX0: descCells[0]?.x0,
        lastY: line.y,
        lastPage: line.page,
        amounts,
      };
      // Walk up the chain of label lines stacked right above this row.
      let below = line.y;
      for (let i = orphans.length - 1; i >= 0; i--) {
        const o = orphans[i];
        const aligned = current.descX0 === undefined || Math.abs(o.cells[0].x0 - current.descX0) < o.height * 3;
        if (o.page !== line.page || below - o.y <= 0 || below - o.y > line.height * 1.6 || !aligned) break;
        orphanLinks.push({ anchor: current, line: o });
        below = o.y;
      }
      orphans = [];
      anchors.push(current);
      continue;
    }

    // Undated line: continuation of a label, or a same-day operation.
    if (!current) {
      if (!amountCells(line, 0).length) orphans = [...orphans.filter((o) => o.page === line.page), line].slice(-8);
      continue;
    }
    const gap = line.page === current.lastPage ? line.y - current.lastY : Infinity;
    if (gap > line.height * 2.6) {
      current = undefined;
      // Text at the top of a new page may continue the previous row or start the next one.
      if (!amountCells(line, 0).length) orphans = [line];
      continue;
    }
    const amounts = amountCells(line, 0);
    const textCells = line.cells.filter((c) => !parseAmount(c.text));
    const text = textCells
      .map((c) => c.text)
      .join(" ")
      .trim();
    const aligned = current.descX0 === undefined || textCells.length === 0 || Math.abs(textCells[0].x0 - current.descX0) < line.height * 3;
    if (!aligned) continue;

    if (amounts.length === 0) {
      if (text) continuations.push({ anchor: current, line, text });
      current.lastY = line.y;
    } else if (current.amounts.length === 0) {
      // Label on the dated line, amount on the following line.
      current.amounts.push(...amounts);
      if (text) current.descParts.push({ y: line.y, text });
      current.lastY = line.y;
    } else if (text) {
      const inherited: Anchor = {
        line,
        date: current.date,
        valueDate: current.valueDate,
        descParts: [{ y: line.y, text }],
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

  // Attach label continuations. Normally a wrapped label continues below its dated row. When cells
  // are vertically centred, the first half of a label sits just above its own dated row, so the
  // closest row wins. Evidence of centring: label text between the column header and the very first
  // dated row of the document, or most dated rows carrying no label on their own line.
  const anchorsWithoutOwnLabel = anchors.filter((a) => !a.descParts.some((d) => d.y === a.line.y)).length;
  const centered = orphanLinks.some((o) => o.anchor === anchors[0]) || anchorsWithoutOwnLabel > anchors.length / 2;
  for (const c of continuations) {
    const idx = anchors.indexOf(c.anchor);
    const next = anchors[idx + 1];
    const dPrev = c.line.y - c.anchor.line.y;
    const dNext = next && next.line.page === c.line.page ? next.line.y - c.line.y : Infinity;
    const target = centered && dNext < dPrev * 0.8 ? next : c.anchor;
    target.descParts.push({ y: c.line.y, text: c.text });
  }

  // Label lines stacked above a row: in centred layouts they belong to that row, except at the top of a
  // page where the first lines usually finish the last row of the previous page (a centred label has as
  // many lines above its date as below it).
  const orphansByAnchor = new Map<Anchor, Line[]>();
  for (const o of orphanLinks) orphansByAnchor.set(o.anchor, [...(orphansByAnchor.get(o.anchor) ?? []), o.line]);
  for (const [anchor, ls] of orphansByAnchor) {
    ls.sort((a, b) => a.y - b.y);
    const idx = anchors.indexOf(anchor);
    const prev = anchors[idx - 1];
    let own = centered ? ls.length : 0;
    if (centered && prev && prev.line.page !== anchor.line.page) {
      const below = anchor.descParts.filter((d) => d.y > anchor.line.y).length;
      own = Math.min(ls.length, Math.max(below, 1));
    }
    ls.forEach((l, i) => {
      const mine = i >= ls.length - own;
      const target = mine ? anchor : prev;
      target?.descParts.push({ y: mine ? l.y : Number.MAX_SAFE_INTEGER - 1000 + l.y, text: l.text });
    });
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
  const byRight = cluster(
    allAmounts.map((a) => a.x1),
    tol,
  );
  const byLeft = cluster(
    allAmounts.map((a) => a.x0),
    tol,
  );
  const useLeft = byLeft.length < byRight.length;
  const centers = useLeft ? byLeft : byRight;
  const key = (a: PositionedAmount) => (useLeft ? a.x0 : a.x1);
  const clusterOf = (a: PositionedAmount) => nearestIndex(centers, key(a));

  const headerAmountCols = (header.length ? header : ([...headerByPage.values()][0] ?? [])).filter((c) =>
    ["debit", "credit", "amount", "balance"].includes(c.role),
  );

  const primary: AmountRole[] = new Array(centers.length).fill("amount");
  const candidates: AmountRole[][] = [];
  if (headerAmountCols.length) {
    const hc = [...headerAmountCols].sort((a, b) => a.x0 - b.x0);
    if (hc.length === centers.length) {
      hc.forEach((c, i) => (primary[i] = c.role as AmountRole));
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
        primary[i] = best.role as AmountRole;
      });
    }
    candidates.push(primary);
    // Alternatives: every left-to-right assignment of the amount columns to the header roles
    // (header alignment does not always match amount alignment). The balance check decides.
    for (const combo of orderedCombinations(
      hc.map((c) => c.role as AmountRole),
      centers.length,
    )) {
      if (combo.join() !== primary.join()) candidates.push(combo);
    }
  } else {
    warnings.push("Pas d'en-tête de colonnes reconnu : les colonnes ont été déduites de la mise en page.");
    const fill = centers.map(() => 0);
    for (const r of rows) {
      const seen = new Set(r.amounts.map((a) => clusterOf(a)));
      seen.forEach((i) => fill[i]++);
    }
    const k = centers.length;
    let remaining = [...Array(k).keys()];
    if (k >= 2 && fill[k - 1] >= rows.length * 0.85) {
      primary[k - 1] = "balance";
      remaining = remaining.slice(0, -1);
    }
    if (remaining.length >= 2) {
      const [d, c] = remaining.slice(-2);
      primary[d] = "debit";
      primary[c] = "credit";
      remaining.slice(0, -2).forEach((i) => (primary[i] = "amount"));
    } else if (remaining.length === 1) {
      primary[remaining[0]] = "amount";
    }
    candidates.push(primary);
    if (primary.includes("debit")) candidates.push(primary.map((r) => (r === "debit" ? "credit" : r === "credit" ? "debit" : r)));
  }

  const evaluate = (roles: AmountRole[]) =>
    buildResult({ rows, roles, clusterOf, centers, key, dateOrder, period, balanceLines, totalLines });

  let chosen = evaluate(candidates[0]);
  let chosenRoles = candidates[0];
  if (chosen.reconciliation.status !== "verified") {
    for (const roles of candidates.slice(1, 25)) {
      const alt = evaluate(roles);
      if (alt.reconciliation.status === "verified") {
        chosen = alt;
        chosenRoles = roles;
        warnings.push("Les colonnes de montants ont été attribuées d'après la vérification du solde.");
        break;
      }
    }
  }

  const columns: ColumnRole[] = ["date"];
  if (rows.some((r) => r.valueDate)) columns.push("valueDate");
  columns.push("description");
  for (const r of ["debit", "credit", "amount", "balance"] as AmountRole[]) {
    if (chosenRoles.includes(r)) columns.push(r);
  }

  warnings.push(...chosen.warnings);
  const undated = chosen.transactions.filter((t) => !t.date).length;
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
    openingBalance: chosen.opening,
    closingBalance: chosen.closing,
    printedTotals: chosen.printedTotals,
    transactions: chosen.transactions,
    columns,
    reconciliation: chosen.reconciliation,
    warnings,
    kind: "text",
  };
}

/** All ways to pick `k` roles from `roles` keeping their left-to-right order. */
function orderedCombinations<T>(roles: T[], k: number): T[][] {
  const out: T[][] = [];
  const rec = (start: number, acc: T[]) => {
    if (acc.length === k) {
      out.push([...acc]);
      return;
    }
    for (let i = start; i < roles.length; i++) rec(i + 1, [...acc, roles[i]]);
  };
  if (k > 0 && k <= roles.length) rec(0, []);
  return out;
}

/** Extracts amounts at the very end of a text cell ("VIR SALAIRE   2 000,00"). */
function trailingAmounts(cell: Cell): { amounts: PositionedAmount[]; rest: string } | null {
  const found = scanAmounts(cell.text);
  if (!found.length) return null;
  const lastFound = found[found.length - 1];
  if (lastFound.index + lastFound.text.length < cell.text.trimEnd().length) return null;
  // Keep a chain of amounts that ends the string (e.g. "... 45,10 1 234,56").
  const chain: typeof found = [lastFound];
  for (let i = found.length - 2; i >= 0; i--) {
    const between = cell.text.slice(found[i].index + found[i].text.length, chain[0].index);
    if (between.trim()) break;
    chain.unshift(found[i]);
  }
  const rest = cell.text.slice(0, chain[0].index).trim();
  if (!rest) return null;
  const len = Math.max(1, cell.text.length);
  const w = cell.x1 - cell.x0;
  return {
    rest,
    amounts: chain.map((a) => ({
      ...a,
      x0: cell.x0 + (a.index / len) * w,
      x1: cell.x0 + ((a.index + a.text.length) / len) * w,
    })),
  };
}

interface BuildInput {
  rows: Anchor[];
  roles: AmountRole[];
  clusterOf: (a: PositionedAmount) => number;
  centers: number[];
  key: (a: PositionedAmount) => number;
  dateOrder: DateOrder;
  period: { start?: string; end?: string };
  balanceLines: { line: Line; kind: "opening" | "closing" | "generic"; beforeFirstAnchor: boolean }[];
  totalLines: Line[];
}

/** Pass 3: transactions, balances, running-balance checks, printed totals and reconciliation for one column model. */
function buildResult({ rows, roles, clusterOf, centers, key, dateOrder, period, balanceLines, totalLines }: BuildInput) {
  const warnings: string[] = [];
  // In a single signed "amount" column, if some amounts carry an explicit minus (or parentheses),
  // unsigned ones are credits.
  const clusterHasNegative = centers.map(() => false);
  for (const r of rows) for (const a of r.amounts) if (a.sign === -1) clusterHasNegative[clusterOf(a)] = true;

  const transactions: Transaction[] = rows.map((r, idx) => {
    let debit: number | undefined;
    let credit: number | undefined;
    let amount: number | undefined;
    let amountSign: -1 | 0 | 1 = 0;
    let amountCluster = -1;
    let balance: number | undefined;
    for (const a of r.amounts) {
      const ci = clusterOf(a);
      const role = roles[ci];
      if (role === "debit") debit = (debit ?? 0) + a.cents;
      else if (role === "credit") credit = (credit ?? 0) + a.cents;
      else if (role === "balance") balance = a.sign === -1 ? -a.cents : a.cents;
      else {
        amount = a.cents;
        amountSign = a.sign;
        amountCluster = ci;
      }
    }
    let signed = 0;
    let signGuessed = false;
    if (debit !== undefined || credit !== undefined) {
      signed = (credit ?? 0) - (debit ?? 0);
    } else if (amount !== undefined) {
      if (amountSign !== 0) signed = amountSign * amount;
      else if (clusterHasNegative[amountCluster]) signed = amount;
      else {
        signed = -amount;
        signGuessed = true;
      }
    }
    const date = resolveDate(r.date, dateOrder, period) ?? "";
    const valueDate = r.valueDate ? (resolveDate(r.valueDate, dateOrder, period) ?? undefined) : undefined;
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

  const balanceAmount = (line: Line): number | undefined => {
    const amounts = amountCells(line, 0);
    const scanned = amounts.length ? amounts : scanAmounts(line.text).map((a) => ({ ...a, x0: 0, x1: 0 }));
    if (!scanned.length) return undefined;
    const a = scanned[scanned.length - 1];
    const n = normaliseText(line.text);
    let sign = a.sign === -1 ? -1 : 1;
    if (NEGATIVE_BALANCE_RE.test(n)) sign = -1;
    if (a.x1 > 0 && amounts.length) {
      const ci = clusterOf(a as PositionedAmount);
      if (roles[ci] === "debit" && Math.abs(key(a as PositionedAmount) - centers[ci]) < 30) sign = -1;
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
  if (transactions.some((t) => t.balance !== undefined)) {
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
  let guessed = 0;
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

  // Printed totals ("Total des opérations ..."). Statements may print one per page (page subtotals)
  // and/or a grand total: use the reading that matches the computed totals, else the sum of page totals.
  const totalsByLine: { debits?: number; credits?: number }[] = [];
  for (const l of totalLines) {
    const amounts = amountCells(l, 0);
    if (!amounts.length) continue;
    const t: { debits?: number; credits?: number } = {};
    for (const a of amounts) {
      const role = roles[clusterOf(a)];
      if (role === "debit") t.debits = a.cents;
      if (role === "credit") t.credits = a.cents;
    }
    if (t.debits !== undefined || t.credits !== undefined) totalsByLine.push(t);
  }
  let printedTotals: ParsedStatement["printedTotals"];
  if (totalsByLine.length) {
    let computedDebits = 0;
    let computedCredits = 0;
    for (const t of transactions) {
      if (t.amount >= 0) computedCredits += t.amount;
      else computedDebits -= t.amount;
    }
    const last = totalsByLine[totalsByLine.length - 1];
    const sum = totalsByLine.reduce(
      (acc, t) => ({
        debits: t.debits !== undefined ? (acc.debits ?? 0) + t.debits : acc.debits,
        credits: t.credits !== undefined ? (acc.credits ?? 0) + t.credits : acc.credits,
      }),
      {} as { debits?: number; credits?: number },
    );
    const matches = (t: { debits?: number; credits?: number }) =>
      (t.debits === undefined || t.debits === computedDebits) && (t.credits === undefined || t.credits === computedCredits);
    printedTotals = matches(last) ? last : matches(sum) ? sum : totalsByLine.length > 1 ? sum : last;
  }

  const reconciliation = reconcile(transactions, opening, closing, printedTotals);
  if (opening === undefined && !openingDerived) warnings.push("Solde de départ introuvable sur le relevé.");
  if (closing === undefined) warnings.push("Solde final introuvable sur le relevé.");
  return { transactions, opening, closing, printedTotals, reconciliation, warnings };
}
