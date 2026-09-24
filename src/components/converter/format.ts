import { formatCents } from "@/lib/statement/amounts";

const SYMBOLS: Record<string, string> = { EUR: "€", USD: "$", GBP: "£", CHF: "CHF" };

export function money(cents: number | undefined, currency = "EUR", signed = false): string {
  if (cents === undefined) return "—";
  const s = formatCents(cents, ",");
  const sym = SYMBOLS[currency] ?? currency;
  const plus = signed && cents > 0 ? "+" : "";
  return `${plus}${s.replace("-", "−")} ${sym}`;
}

export function frDate(iso?: string) {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export function frLongDate(iso?: string) {
  if (!iso) return "";
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(iso + "T00:00:00Z"),
  );
}
