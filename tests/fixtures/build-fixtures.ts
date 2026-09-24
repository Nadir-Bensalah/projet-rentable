/**
 * Builds synthetic bank statements (fictional bank, fictional data) as real text PDFs
 * printed by Chromium, together with the ground truth used by the parser tests.
 *
 *   npx tsx tests/fixtures/build-fixtures.ts
 *
 * Each layout mimics a family of real-world statement layouts (debit/credit columns,
 * signed amounts, running balance, US/UK formats, no header row, overdrawn account...).
 */
import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const OUT = path.join(__dirname, "pdf");

interface Tx {
  day: number;
  month: number;
  year: number;
  label: string[];
  cents: number; // signed
}

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

const DEBIT_LABELS = [
  ["CARTE X4821 MONOPRIX PARIS 11"],
  ["PRLV SEPA EDF CLIENTS PARTICULIERS", "REF: 7788221 MANDAT FR12EDF"],
  ["RETRAIT DAB LYON BELLECOUR"],
  ["CARTE X4821 SNCF VOYAGEURS", "INTERNET"],
  ["PRLV SEPA FREE MOBILE"],
  ["COTISATION OFFRE ESSENTIEL"],
  ["VIR SEPA EMIS VERS DUPONT MARTIN", "MOTIF: LOYER AOUT"],
  ["CARTE X4821 BOULANGERIE DU MARCHE"],
  ["FRAIS TENUE DE COMPTE"],
  ["PRLV SEPA URSSAF ILE DE FRANCE", "COTISATIONS T2"],
  ["CARTE X4821 AMAZON EU SARL", "LUXEMBOURG"],
];
const CREDIT_LABELS = [
  ["VIR SEPA RECU /DE ACME CONSEIL SARL", "/MOTIF FACTURE 2026-031"],
  ["REMISE CHEQUE N 1234567"],
  ["VIR SEPA RECU /DE CAF DE PARIS"],
  ["VIREMENT SALAIRE AOUT"],
  ["REMBOURSEMENT CARTE X4821 FNAC"],
];
const EN_DEBIT = [
  ["CARD PURCHASE WHOLE FOODS #123"],
  ["ATM WITHDRAWAL 5TH AVE"],
  ["DIRECT DEBIT CITY WATER"],
  ["ONLINE TRANSFER TO SAVINGS"],
  ["CARD PURCHASE AMAZON MKTPLACE", "SEATTLE WA"],
];
const EN_CREDIT = [["PAYROLL DEPOSIT ACME CORP"], ["TRANSFER FROM J SMITH"], ["REFUND ACME STORE"]];

function makeTxs(seed: number, n: number, year: number, month: number, en = false, startDay = 1, span = 28): Tx[] {
  const r = rng(seed);
  const txs: Tx[] = [];
  for (let i = 0; i < n; i++) {
    const credit = r() < 0.22;
    const labels = en ? (credit ? EN_CREDIT : EN_DEBIT) : credit ? CREDIT_LABELS : DEBIT_LABELS;
    const label = labels[Math.floor(r() * labels.length)];
    const magnitude = credit ? Math.round(20000 + r() * 250000) : Math.round(150 + r() * (r() < 0.15 ? 180000 : 12000));
    let day = startDay + Math.floor((i / n) * span);
    let m = month;
    let y = year;
    const dim = new Date(Date.UTC(y, m, 0)).getUTCDate();
    if (day > dim) {
      day -= dim;
      m = m === 12 ? 1 : m + 1;
      if (m === 1) y++;
    }
    txs.push({ day, month: m, year: y, label, cents: credit ? magnitude : -magnitude });
  }
  return txs;
}

const pad = (n: number) => n.toString().padStart(2, "0");
function fr(cents: number) {
  const abs = Math.abs(cents);
  const int = Math.floor(abs / 100)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${int},${pad(abs % 100)}`;
}
function en(cents: number) {
  const abs = Math.abs(cents);
  const int = Math.floor(abs / 100)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${int}.${pad(abs % 100)}`;
}
const FR_MONTHS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
const EN_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const CSS = `
  @page { size: A4; margin: 14mm 12mm; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 8.5pt; color: #111; }
  h1 { font-size: 14pt; margin: 0 0 4pt; }
  .meta { margin: 0 0 8pt; }
  table { width: 100%; border-collapse: collapse; }
  th { text-align: left; border-bottom: 1px solid #333; padding: 3pt 4pt; font-weight: bold; }
  td { padding: 2pt 4pt; vertical-align: top; }
  .r { text-align: right; white-space: nowrap; }
  .num { width: 18%; }
  .d { width: 9%; white-space: nowrap; }
  .bal { margin-top: 6pt; font-weight: bold; }
  .footer { margin-top: 18pt; font-size: 7pt; color: #555; }
  .pb { page-break-after: always; }
`;

interface Fixture {
  name: string;
  html: string;
  expected: {
    opening?: number;
    closing?: number;
    status: "verified" | "mismatch" | "unverifiable";
    transactions?: { date: string; description: string; amount: number }[];
    kind?: "text" | "scanned";
    allowGuessed?: number;
    currency?: string;
  };
}

function iso(t: Tx) {
  return `${t.year}-${pad(t.month)}-${pad(t.day)}`;
}

function sum(txs: Tx[]) {
  return txs.reduce((s, t) => s + t.cents, 0);
}

/** A: classic French layout, Débit / Crédit columns, value date, 2 pages with carry-over lines and totals. */
function layoutA(): Fixture {
  const txs = makeTxs(1, 46, 2026, 8);
  const opening = 152034;
  const closing = opening + sum(txs);
  const debits = txs.filter((t) => t.cents < 0).reduce((s, t) => s - t.cents, 0);
  const credits = txs.filter((t) => t.cents > 0).reduce((s, t) => s + t.cents, 0);
  const row = (t: Tx) => `<tr><td class="d">${pad(t.day)}/${pad(t.month)}</td><td class="d">${pad(t.day)}/${pad(t.month)}</td>
    <td>${t.label.join("<br>")}</td><td class="r num">${t.cents < 0 ? fr(t.cents) : ""}</td><td class="r num">${t.cents > 0 ? fr(t.cents) : ""}</td></tr>`;
  const head = `<tr><th>Date</th><th>Valeur</th><th>Libellé</th><th class="r">Débit</th><th class="r">Crédit</th></tr>`;
  const first = txs.slice(0, 26);
  const second = txs.slice(26);
  const carry = sum(first);
  const html = `<h1>BANQUE EXEMPLE</h1>
  <p class="meta">M. JEAN EXEMPLE — Compte courant n° 00012345678<br>Relevé n° 8 du 01/08/2026 au 31/08/2026</p>
  <table>${head}
  <tr><td></td><td></td><td><b>Solde précédent au 31/07/2026</b></td><td></td><td class="r num"><b>${fr(opening)}</b></td></tr>
  ${first.map(row).join("")}
  <tr><td></td><td></td><td><b>Total à reporter</b></td><td class="r num">${fr(first.filter((t) => t.cents < 0).reduce((s, t) => s - t.cents, 0))}</td><td class="r num">${fr(first.filter((t) => t.cents > 0).reduce((s, t) => s + t.cents, 0))}</td></tr>
  </table><p class="footer">Banque Exemple SA au capital de 1 000 000 euros — RCS Exemple 000 000 000 — Page 1/2</p>
  <div class="pb"></div>
  <table>${head}
  <tr><td></td><td></td><td><b>Report</b></td><td class="r num">${carry < 0 ? fr(carry) : ""}</td><td class="r num">${carry >= 0 ? fr(carry) : ""}</td></tr>
  ${second.map(row).join("")}
  <tr><td></td><td></td><td><b>Total des opérations</b></td><td class="r num">${fr(debits)}</td><td class="r num">${fr(credits)}</td></tr>
  <tr><td></td><td></td><td><b>Nouveau solde au 31/08/2026</b></td><td class="r num">${closing < 0 ? fr(closing) : ""}</td><td class="r num">${closing >= 0 ? fr(closing) : ""}</td></tr>
  </table><p class="footer">Page 2/2 — Pensez à vérifier vos opérations.</p>`;
  return {
    name: "fr-debit-credit",
    html,
    expected: {
      opening,
      closing,
      status: "verified",
      transactions: txs.map((t) => ({ date: iso(t), description: t.label.join(" "), amount: t.cents })),
    },
  };
}

/** B: dotted dates, "Date opé." header, balance lines outside the table. */
function layoutB(): Fixture {
  const txs = makeTxs(2, 22, 2026, 7);
  const opening = 48210;
  const closing = opening + sum(txs);
  const html = `<h1>CAISSE EXEMPLE</h1><p class="meta">Relevé de compte — période du 01.07.2026 au 31.07.2026</p>
  <p class="bal">SOLDE CREDITEUR AU 30.06.2026 &nbsp;&nbsp;&nbsp;&nbsp; ${fr(opening)}</p>
  <table><tr><th>Date opé.</th><th>Date valeur</th><th>Libellé des opérations</th><th class="r">Débit</th><th class="r">Crédit</th></tr>
  ${txs.map((t) => `<tr><td class="d">${pad(t.day)}.${pad(t.month)}</td><td class="d">${pad(Math.min(t.day + 1, 31))}.${pad(t.month)}</td><td>${t.label.join("<br>")}</td><td class="r num">${t.cents < 0 ? fr(t.cents) : ""}</td><td class="r num">${t.cents > 0 ? fr(t.cents) : ""}</td></tr>`).join("")}
  </table>
  <p class="bal">NOUVEAU SOLDE ${closing < 0 ? "DEBITEUR" : "CREDITEUR"} AU 31.07.2026 &nbsp;&nbsp;&nbsp;&nbsp; ${fr(closing)}</p>`;
  return {
    name: "fr-dotted-dates",
    html,
    expected: {
      opening,
      closing,
      status: "verified",
      transactions: txs.map((t) => ({ date: iso(t), description: t.label.join(" "), amount: t.cents })),
    },
  };
}

/** C: neobank style — one signed amount column with €, textual dates. */
function layoutC(): Fixture {
  const txs = makeTxs(3, 18, 2026, 6);
  const opening = 1250000;
  const closing = opening + sum(txs);
  const html = `<h1>Néobanque Exemple</h1><p class="meta">Relevé de compte professionnel<br>Période : 1 juin 2026 - 30 juin 2026</p>
  <p>Solde au 1 juin 2026 : ${fr(opening)} €</p>
  <table><tr><th>Date</th><th>Opération</th><th class="r">Montant</th></tr>
  ${txs.map((t) => `<tr><td class="d">${t.day} ${FR_MONTHS[t.month - 1]} ${t.year}</td><td>${t.label.join(" ")}</td><td class="r num">${t.cents < 0 ? "-" : "+"}${fr(t.cents)} €</td></tr>`).join("")}
  </table><p>Solde au 30 juin 2026 : ${fr(closing)} €</p>`;
  return {
    name: "fr-neobank-signed",
    html,
    expected: {
      opening,
      closing,
      status: "verified",
      transactions: txs.map((t) => ({ date: iso(t), description: t.label.join(" "), amount: t.cents })),
    },
  };
}

/** D: US layout — MM/DD, Withdrawals / Deposits / Balance, dollars. */
function layoutD(): Fixture {
  const txs = makeTxs(4, 20, 2026, 8, true);
  const opening = 342015;
  let bal = opening;
  const rows = txs
    .map((t) => {
      bal += t.cents;
      return `<tr><td class="d">${pad(t.month)}/${pad(t.day)}</td><td>${t.label.join("<br>")}</td><td class="r num">${t.cents < 0 ? en(t.cents) : ""}</td><td class="r num">${t.cents > 0 ? en(t.cents) : ""}</td><td class="r num">${bal < 0 ? "-" : ""}${en(bal)}</td></tr>`;
    })
    .join("");
  const html = `<h1>EXAMPLE NATIONAL BANK</h1><p class="meta">Statement Period: 08/01/2026 to 08/31/2026<br>Account ending 4821 — USD</p>
  <p>Beginning Balance on 08/01/2026 &nbsp;&nbsp; $${en(opening)}</p>
  <table><tr><th>Date</th><th>Description</th><th class="r">Withdrawals</th><th class="r">Deposits</th><th class="r">Balance</th></tr>${rows}</table>
  <p>Ending Balance on 08/31/2026 &nbsp;&nbsp; $${bal < 0 ? "-" : ""}${en(bal)}</p>`;
  return {
    name: "en-us-running-balance",
    html,
    expected: {
      opening,
      closing: bal,
      status: "verified",
      currency: "USD",
      transactions: txs.map((t) => ({ date: iso(t), description: t.label.join(" "), amount: t.cents })),
    },
  };
}

/** E: UK layout — textual dates, date printed only on the first operation of the day. */
function layoutE(): Fixture {
  const r = rng(5);
  const base = makeTxs(5, 24, 2026, 3, true, 1, 10);
  const opening = 98000;
  let bal = opening;
  let lastDay = -1;
  const rows = base
    .map((t) => {
      bal += t.cents;
      const showDate = t.day !== lastDay;
      lastDay = t.day;
      void r;
      return `<tr><td class="d">${showDate ? `${pad(t.day)} ${EN_MONTHS[t.month - 1]} ${t.year}` : ""}</td><td>${t.label.join(" ")}</td><td class="r num">${t.cents < 0 ? en(t.cents) : ""}</td><td class="r num">${t.cents > 0 ? en(t.cents) : ""}</td><td class="r num">${en(bal)}${bal < 0 ? " OD" : ""}</td></tr>`;
    })
    .join("");
  const html = `<h1>Example Bank plc</h1><p class="meta">Your statement — 1 March 2026 to 11 March 2026 — GBP</p>
  <table><tr><th>Date</th><th>Description</th><th class="r">Paid out</th><th class="r">Paid in</th><th class="r">Balance</th></tr>
  <tr><td class="d">01 Mar 2026</td><td>BALANCE BROUGHT FORWARD</td><td></td><td></td><td class="r num">${en(opening)}</td></tr>
  ${rows}
  <tr><td class="d">11 Mar 2026</td><td>BALANCE CARRIED FORWARD</td><td></td><td></td><td class="r num">${en(bal)}${bal < 0 ? " OD" : ""}</td></tr></table>`;
  return {
    name: "en-uk-same-day",
    html,
    expected: {
      opening,
      closing: bal,
      status: "verified",
      currency: "GBP",
      transactions: base.map((t) => ({ date: iso(t), description: t.label.join(" "), amount: t.cents })),
    },
  };
}

/** F: no header row, unsigned amount + running balance (sign must come from the balance). */
function layoutF(): Fixture {
  const txs = makeTxs(6, 16, 2026, 5);
  const opening = 300000;
  let bal = opening;
  const rows = txs
    .map((t) => {
      bal += t.cents;
      return `<tr><td class="d">${pad(t.day)}/${pad(t.month)}/${t.year}</td><td>${t.label.join(" ")}</td><td class="r num">${fr(t.cents)}</td><td class="r num">${fr(bal)}</td></tr>`;
    })
    .join("");
  const html = `<h1>Coopérative Exemple</h1><p class="meta">Extrait de compte du 01/05/2026 au 31/05/2026</p>
  <table>${rows}</table>`;
  return {
    name: "fr-no-header-running-balance",
    html,
    expected: {
      // No opening balance is printed: the sign of the very first row cannot be proven.
      allowGuessed: 1,
      opening,
      closing: bal,
      status: "verified",
      transactions: txs.map((t) => ({ date: iso(t), description: t.label.join(" "), amount: t.cents })),
    },
  };
}

/** G: statement across new year, overdrawn closing balance ("débiteur"). */
function layoutG(): Fixture {
  const txs = makeTxs(7, 20, 2025, 12, false, 15, 30).map((t, i) => (i === 3 ? { ...t, cents: -400000 } : t));
  const opening = 12000;
  const closing = opening + sum(txs);
  const html = `<h1>BANQUE EXEMPLE</h1><p class="meta">Relevé du 15/12/2025 au 14/01/2026</p>
  <table><tr><th>Date</th><th>Libellé</th><th class="r">Débit</th><th class="r">Crédit</th></tr>
  <tr><td></td><td><b>Ancien solde créditeur</b></td><td></td><td class="r num">${fr(opening)}</td></tr>
  ${txs.map((t) => `<tr><td class="d">${pad(t.day)}/${pad(t.month)}</td><td>${t.label.join("<br>")}</td><td class="r num">${t.cents < 0 ? fr(t.cents) : ""}</td><td class="r num">${t.cents > 0 ? fr(t.cents) : ""}</td></tr>`).join("")}
  <tr><td></td><td><b>Nouveau solde ${closing < 0 ? "débiteur" : "créditeur"} au 14/01/2026</b></td><td class="r num">${closing < 0 ? fr(closing) : ""}</td><td class="r num">${closing >= 0 ? fr(closing) : ""}</td></tr></table>`;
  return {
    name: "fr-year-crossing-overdrawn",
    html,
    expected: {
      opening,
      closing,
      status: "verified",
      transactions: txs.map((t) => ({ date: iso(t), description: t.label.join(" "), amount: t.cents })),
    },
  };
}

/** H: a wrong statement (closing balance does not match) — the product must say so. */
function layoutH(): Fixture {
  const f = layoutB();
  const txs = makeTxs(2, 22, 2026, 7);
  const wrongClosing = 48210 + sum(txs) + 1000;
  return {
    name: "fr-mismatch",
    html: f.html.replace(
      /NOUVEAU SOLDE (DEBITEUR|CREDITEUR) AU 31.07.2026 &nbsp;&nbsp;&nbsp;&nbsp; [\d ,]+/,
      `NOUVEAU SOLDE ${wrongClosing < 0 ? "DEBITEUR" : "CREDITEUR"} AU 31.07.2026 &nbsp;&nbsp;&nbsp;&nbsp; ${fr(wrongClosing)}`,
    ),
    expected: { opening: 48210, closing: wrongClosing, status: "mismatch" },
  };
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const fixtures = [layoutA(), layoutB(), layoutC(), layoutD(), layoutE(), layoutF(), layoutG(), layoutH()];
  for (const f of fixtures) {
    await page.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>${CSS}</style></head><body>${f.html}</body></html>`);
    await page.pdf({ path: path.join(OUT, `${f.name}.pdf`), format: "A4", printBackground: true });
    fs.writeFileSync(path.join(OUT, `${f.name}.json`), JSON.stringify(f.expected, null, 2));
  }
  // Scanned statement: the same content rendered as an image only (no text layer).
  await page.setContent(
    `<!doctype html><html><head><meta charset="utf-8"><style>${CSS}</style></head><body>${layoutB().html}</body></html>`,
  );
  const png = await page.screenshot({ fullPage: true });
  await page.setContent(
    `<!doctype html><html><body style="margin:0"><img style="width:100%" src="data:image/png;base64,${png.toString("base64")}"></body></html>`,
  );
  await page.pdf({ path: path.join(OUT, "scanned.pdf"), format: "A4" });
  fs.writeFileSync(path.join(OUT, "scanned.json"), JSON.stringify({ status: "unverifiable", kind: "scanned" }, null, 2));
  await browser.close();
  console.log(`Built ${fixtures.length + 1} fixtures in ${OUT}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
