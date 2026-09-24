import type { DateOrder } from "./types";

/** A date as printed; year may be missing (very common on French statements: "02/08"). */
export interface RawDate {
  a: number; // first numeric component (or day for textual months)
  b: number; // second numeric component (or month for textual months)
  year?: number;
  /** true when the month was spelled out, so the order is unambiguous */
  textual: boolean;
  iso: boolean;
  text: string;
}

const MONTHS: Record<string, number> = {
  janv: 1,
  janvier: 1,
  jan: 1,
  january: 1,
  fevr: 2,
  fevrier: 2,
  fev: 2,
  feb: 2,
  february: 2,
  mars: 3,
  mar: 3,
  march: 3,
  avr: 4,
  avril: 4,
  apr: 4,
  april: 4,
  mai: 5,
  may: 5,
  juin: 6,
  jun: 6,
  june: 6,
  juil: 7,
  juillet: 7,
  jul: 7,
  july: 7,
  aout: 8,
  aug: 8,
  august: 8,
  sept: 9,
  septembre: 9,
  sep: 9,
  september: 9,
  oct: 10,
  octobre: 10,
  october: 10,
  nov: 11,
  novembre: 11,
  november: 11,
  dec: 12,
  decembre: 12,
  december: 12,
};

function stripAccents(s: string) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

function normYear(y: string): number {
  const n = Number(y);
  return y.length === 2 ? 2000 + n : n;
}

const NUMERIC_RE = /^(\d{1,2})[/.\-](\d{1,2})(?:[/.\-](\d{2}|\d{4}))?$/;
const ISO_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const TEXT_DMY_RE = /^(\d{1,2})(?:er)?[\s.\-]+([a-zA-ZÀ-ſ]{3,10})\.?(?:[\s.\-]+(\d{2}|\d{4}))?$/;
const TEXT_MDY_RE = /^([a-zA-Z]{3,9})\.?\s+(\d{1,2}),?(?:\s+(\d{4}))?$/;

/** Parses a token that must be entirely a date. */
export function parseRawDate(token: string): RawDate | null {
  const t = token.trim();
  if (t.length < 3 || t.length > 20) return null;
  let m = ISO_RE.exec(t);
  if (m) {
    return { a: Number(m[3]), b: Number(m[2]), year: Number(m[1]), textual: true, iso: true, text: t };
  }
  m = NUMERIC_RE.exec(t);
  if (m) {
    const a = Number(m[1]);
    const b = Number(m[2]);
    if (a < 1 || b < 1 || a > 31 || b > 31 || (a > 12 && b > 12)) return null;
    return { a, b, year: m[3] ? normYear(m[3]) : undefined, textual: false, iso: false, text: t };
  }
  m = TEXT_DMY_RE.exec(t);
  if (m) {
    const month = MONTHS[stripAccents(m[2]).toLowerCase().replace(/\.$/, "")];
    const day = Number(m[1]);
    if (!month || day < 1 || day > 31) return null;
    return { a: day, b: month, year: m[3] ? normYear(m[3]) : undefined, textual: true, iso: false, text: t };
  }
  m = TEXT_MDY_RE.exec(t);
  if (m) {
    const month = MONTHS[stripAccents(m[1]).toLowerCase()];
    const day = Number(m[2]);
    if (!month || day < 1 || day > 31) return null;
    return { a: day, b: month, year: m[3] ? Number(m[3]) : undefined, textual: true, iso: false, text: t };
  }
  return null;
}

/**
 * Finds a date at the very start of a string. Returns the date and the rest of the text.
 * Handles "02/08", "02.08.2026", "2 août 2026", "12 Aug", "2026-08-02", "Aug 12, 2026".
 */
export function leadingDate(text: string): { date: RawDate; rest: string } | null {
  const t = text.trim();
  const candidates = [
    /^\d{4}-\d{2}-\d{2}/,
    /^\d{1,2}[/.\-]\d{1,2}[/.\-](?:\d{4}|\d{2})(?!\d)/,
    /^\d{1,2}[/.\-]\d{1,2}(?![/.\-]?\d)/,
    /^\d{1,2}(?:er)?[\s.\-]+[a-zA-ZÀ-ſ]{3,10}\.?(?:[\s.\-]+(?:\d{4}|\d{2}))?(?![a-zA-Z\d])/,
    /^[a-zA-Z]{3,9}\.?\s+\d{1,2},?(?:\s+\d{4})?(?!\d)/,
  ];
  for (const re of candidates) {
    const m = re.exec(t);
    if (!m) continue;
    // For "12 Aug 2026 CARD PAYMENT" also try without the year part when the full match fails.
    const date = parseRawDate(m[0]);
    if (date) return { date, rest: t.slice(m[0].length).trim() };
    const shorter = m[0].replace(/[\s.\-]+\d{2,4}$/, "");
    const date2 = shorter !== m[0] ? parseRawDate(shorter) : null;
    if (date2) return { date: date2, rest: t.slice(shorter.length).trim() };
  }
  return null;
}

/** Decides day/month order for a whole document from all numeric dates seen. */
export function inferDateOrder(dates: RawDate[], decimal: "," | ".", currency: string): DateOrder {
  let dmy = 0;
  let mdy = 0;
  for (const d of dates) {
    if (d.textual) continue;
    if (d.a > 12) dmy++;
    if (d.b > 12) mdy++;
  }
  if (dmy > mdy) return "DMY";
  if (mdy > dmy) return "MDY";
  return decimal === "." && currency === "USD" ? "MDY" : "DMY";
}

function daysInMonth(year: number, month: number) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function toISO(year: number, month: number, day: number): string | null {
  if (month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month)) return null;
  return `${year.toString().padStart(4, "0")}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
}

/** Day and month of a raw date according to the document order. */
export function dayMonth(d: RawDate, order: DateOrder): { day: number; month: number } {
  if (d.textual) return { day: d.a, month: d.b };
  return order === "MDY" ? { day: d.b, month: d.a } : { day: d.a, month: d.b };
}

/**
 * Resolves a raw date into ISO, inferring the missing year from the statement period.
 * If the statement spans December → January, months after the end month belong to the previous year.
 */
export function resolveDate(d: RawDate, order: DateOrder, period?: { start?: string; end?: string }): string | null {
  const { day, month } = dayMonth(d, order);
  if (d.year) return toISO(d.year, month, day);
  const end = period?.end ?? period?.start;
  if (!end) return null;
  const endYear = Number(end.slice(0, 4));
  const endMonth = Number(end.slice(5, 7));
  const year = month > endMonth + 1 ? endYear - 1 : endYear;
  return toISO(year, month, day);
}

/** Finds every full date (with year) in a string — used to find the statement period. */
export function findFullDates(text: string, order: DateOrder): string[] {
  const out: string[] = [];
  const re =
    /(\d{4}-\d{2}-\d{2})|(\d{1,2}[/.\-]\d{1,2}[/.\-]\d{4})|(\d{1,2}(?:er)?\s+[a-zA-ZÀ-ſ]{3,10}\.?\s+\d{4})|([a-zA-Z]{3,9}\.?\s+\d{1,2},?\s+\d{4})/g;
  for (const m of text.matchAll(re)) {
    const raw = parseRawDate(m[0]);
    if (!raw || !raw.year) continue;
    const { day, month } = dayMonth(raw, order);
    const iso = toISO(raw.year, month, day);
    if (iso) out.push(iso);
  }
  return out;
}
