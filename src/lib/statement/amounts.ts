/**
 * Money parsing for bank statements.
 * Bank statements print amounts with exactly two decimals, which lets us tell
 * amounts apart from reference numbers, card numbers or dates.
 */

const SPACES = "\\s\\u00a0\\u202f\\u2009";
const CURRENCY = "(?:€|EUR|\\$|USD|£|GBP|CHF|Fr\\.?)";
const SIGN = "[-+−–]";

// Thousands groups: 1 234,56 / 1.234,56 / 1'234.56 / 1,234.56 / 1234,56
const FR_BODY = `\\d{1,3}(?:[${SPACES}.']\\d{3})*,\\d{2}|\\d+,\\d{2}`;
const EN_BODY = `\\d{1,3}(?:[,'${SPACES}]\\d{3})*\\.\\d{2}|\\d+\\.\\d{2}`;

const AMOUNT_RE = new RegExp(
  `^(?<pre>${SIGN}|\\()?[${SPACES}]*(?:${CURRENCY}[${SPACES}]*)?(?<presign>${SIGN})?[${SPACES}]*` +
    `(?<body>${FR_BODY}|${EN_BODY})` +
    `[${SPACES}]*(?:${CURRENCY})?[${SPACES}]*(?<post>${SIGN}|\\)|CR|DB|DR|Cr|Dr|C|D)?$`,
);

/** Finds amount-looking substrings inside a longer string (used for "Solde ... 1 234,56" lines). */
const AMOUNT_SCAN_RE = new RegExp(
  `(?<![\\d,.])(?:${SIGN}[${SPACES}]?)?(?:${CURRENCY}[${SPACES}]?)?(?:${FR_BODY}|${EN_BODY})(?:[${SPACES}]?${CURRENCY})?(?:[${SPACES}]?(?:CR|DB|DR)\\b)?(?![\\d])`,
  "g",
);

export interface ParsedAmount {
  /** Absolute value in cents. */
  cents: number;
  /** -1 when explicitly negative (minus, parentheses, DB/DR/D), +1 when explicitly positive, 0 unknown. */
  sign: -1 | 0 | 1;
  decimal: "," | ".";
}

function bodyToCents(body: string): { cents: number; decimal: "," | "." } | null {
  const compact = body.replace(/[\s   ']/g, "");
  const lastComma = compact.lastIndexOf(",");
  const lastDot = compact.lastIndexOf(".");
  const decimalPos = Math.max(lastComma, lastDot);
  if (decimalPos < 0 || compact.length - decimalPos !== 3) return null;
  const decimal = compact[decimalPos] as "," | ".";
  const intPart = compact.slice(0, decimalPos).replace(/[.,]/g, "");
  const frac = compact.slice(decimalPos + 1);
  if (!/^\d+$/.test(intPart) || !/^\d{2}$/.test(frac)) return null;
  const cents = Number(intPart) * 100 + Number(frac);
  if (!Number.isSafeInteger(cents)) return null;
  return { cents, decimal };
}

export function parseAmount(raw: string): ParsedAmount | null {
  const s = raw.trim();
  if (!s || s.length > 32) return null;
  const m = AMOUNT_RE.exec(s);
  if (!m || !m.groups) return null;
  const conv = bodyToCents(m.groups.body);
  if (!conv) return null;
  const { pre, presign, post } = m.groups;
  let sign: -1 | 0 | 1 = 0;
  const neg = (t?: string) => t !== undefined && /^[-−–(]$|^(DB|DR|Dr|D)$/.test(t);
  const pos = (t?: string) => t !== undefined && /^\+$|^(CR|Cr|C)$/.test(t);
  if (neg(pre) || neg(presign) || neg(post) || (pre === "(" && post === ")")) sign = -1;
  else if (pos(pre) || pos(presign) || pos(post)) sign = 1;
  return { cents: conv.cents, sign, decimal: conv.decimal };
}

export interface ScannedAmount extends ParsedAmount {
  index: number;
  text: string;
}

/** Returns all amounts found in a free-text string, in reading order. */
export function scanAmounts(text: string): ScannedAmount[] {
  const out: ScannedAmount[] = [];
  for (const m of text.matchAll(AMOUNT_SCAN_RE)) {
    const parsed = parseAmount(m[0]);
    if (parsed) out.push({ ...parsed, index: m.index ?? 0, text: m[0] });
  }
  return out;
}

/**
 * Currency of the account. Markers next to amounts and on balance/header lines are strong
 * signals; currencies quoted inside operation labels (card payments abroad) are not.
 */
export function detectCurrency(text: string, strongText?: string): string {
  if (strongText) {
    const strong = detectCurrencyCounts(strongText);
    const best = Object.entries(strong).sort((a, b) => b[1] - a[1])[0];
    if (best && best[1] > 0) return best[0];
  }
  const counts = detectCurrencyCounts(text);
  let best = "EUR";
  let max = 0;
  for (const [k, v] of Object.entries(counts)) {
    if (v > max) {
      best = k;
      max = v;
    }
  }
  return best;
}

function detectCurrencyCounts(text: string): Record<string, number> {
  return {
    EUR: (text.match(/€|\bEUR\b|\beuros?\b/gi) || []).length,
    USD: (text.match(/\$|\bUSD\b/g) || []).length,
    GBP: (text.match(/£|\bGBP\b/g) || []).length,
    CHF: (text.match(/\bCHF\b/g) || []).length,
  };
}

/** Formats cents for display, e.g. 123456 -> "1 234,56" (fr) or "1,234.56" (en). */
export function formatCents(cents: number, decimal: "," | "." = ",", thousands = true): string {
  const neg = cents < 0;
  const abs = Math.abs(cents);
  const int = Math.floor(abs / 100).toString();
  const frac = (abs % 100).toString().padStart(2, "0");
  const sep = decimal === "," ? " " : ",";
  const grouped = thousands ? int.replace(/\B(?=(\d{3})+(?!\d))/g, sep) : int;
  return `${neg ? "-" : ""}${grouped}${decimal}${frac}`;
}
