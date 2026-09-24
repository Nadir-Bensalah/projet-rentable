import { zipSync, strToU8 } from "fflate";
import type { ParsedStatement, Transaction } from "./types";

export type ExportFormat = "csv-fr" | "csv-intl" | "xlsx" | "ofx" | "qif" | "fec" | "json";

export interface ExportFormatInfo {
  id: ExportFormat;
  label: string;
  extension: string;
  mime: string;
  description: string;
  /** Formats available on the free plan. */
  free: boolean;
}

export const EXPORT_FORMATS: ExportFormatInfo[] = [
  {
    id: "xlsx",
    label: "Excel (.xlsx)",
    extension: "xlsx",
    mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    description: "Dates et montants reconnus comme de vraies valeurs par Excel, LibreOffice et Google Sheets.",
    free: true,
  },
  {
    id: "csv-fr",
    label: "CSV (Excel France)",
    extension: "csv",
    mime: "text/csv",
    description: "Séparateur point-virgule, virgule décimale, dates JJ/MM/AAAA.",
    free: true,
  },
  {
    id: "csv-intl",
    label: "CSV international",
    extension: "csv",
    mime: "text/csv",
    description: "Séparateur virgule, point décimal, dates ISO (AAAA-MM-JJ).",
    free: false,
  },
  {
    id: "ofx",
    label: "OFX",
    extension: "ofx",
    mime: "application/x-ofx",
    description: "Format d'import bancaire standard (OFX 1.0.2), accepté par la plupart des logiciels de comptabilité et de budget.",
    free: false,
  },
  {
    id: "qif",
    label: "QIF",
    extension: "qif",
    mime: "application/qif",
    description: "Ancien format d'échange (Quicken, certains logiciels de gestion).",
    free: false,
  },
  {
    id: "fec",
    label: "Écritures (colonnes FEC)",
    extension: "txt",
    mime: "text/plain",
    description: "Journal de banque en partie double (512 / 471) avec les 18 colonnes du FEC, séparateur tabulation.",
    free: false,
  },
  {
    id: "json",
    label: "JSON",
    extension: "json",
    mime: "application/json",
    description: "Données structurées pour développeurs et automatisations.",
    free: false,
  },
];

export function formatInfo(id: ExportFormat): ExportFormatInfo {
  const f = EXPORT_FORMATS.find((f) => f.id === id);
  if (!f) throw new Error(`Unknown format ${id}`);
  return f;
}

const pad = (n: number) => n.toString().padStart(2, "0");
const frDate = (iso?: string) => (iso ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}` : "");
const compactDate = (iso?: string) => (iso ? iso.replace(/-/g, "") : "");

function money(cents: number, decimal: "," | "."): string {
  const neg = cents < 0;
  const abs = Math.abs(cents);
  return `${neg ? "-" : ""}${Math.floor(abs / 100)}${decimal}${pad(abs % 100)}`;
}

function csvCell(v: string, sep: string): string {
  // Neutralise spreadsheet formula injection (CSV injection) and quote when needed.
  let s = v;
  if (/^[=+\-@\t\r]/.test(s) && !/^-?\d+([.,]\d+)?$/.test(s)) s = "'" + s;
  if (s.includes(sep) || s.includes('"') || s.includes("\n") || s.includes("\r")) s = `"${s.replace(/"/g, '""')}"`;
  return s;
}

function included(st: ParsedStatement): Transaction[] {
  return st.transactions.filter((t) => !t.excluded);
}

/** Merges several statements into one chronological list, removing exact duplicates from overlapping periods. */
export function mergeTransactions(statements: ParsedStatement[]): { tx: Transaction; source: string }[] {
  const seen = new Map<string, number>();
  const out: { tx: Transaction; source: string }[] = [];
  for (const st of statements) {
    const local = new Map<string, number>();
    for (const t of included(st)) {
      const key = `${t.date}|${t.amount}|${t.description.toLowerCase().replace(/\s+/g, " ")}`;
      // The same operation can legitimately appear twice in one statement: only drop
      // duplicates that exceed what a single statement contains.
      const n = (local.get(key) ?? 0) + 1;
      local.set(key, n);
      if ((seen.get(key) ?? 0) >= n) continue;
      seen.set(key, n);
      out.push({ tx: t, source: st.fileName });
    }
  }
  out.sort((a, b) => a.tx.date.localeCompare(b.tx.date));
  return out;
}

function rowsFor(statements: ParsedStatement[]) {
  return statements.length === 1
    ? included(statements[0]).map((tx) => ({ tx, source: statements[0].fileName }))
    : mergeTransactions(statements);
}

export function toCsv(statements: ParsedStatement[], variant: "fr" | "intl"): string {
  const sep = variant === "fr" ? ";" : ",";
  const dec = variant === "fr" ? "," : ".";
  const date = variant === "fr" ? frDate : (s?: string) => s ?? "";
  const multi = statements.length > 1;
  const header =
    variant === "fr"
      ? ["Date", "Date de valeur", "Libellé", "Débit", "Crédit", "Montant", "Solde", ...(multi ? ["Relevé"] : [])]
      : ["date", "value_date", "description", "debit", "credit", "amount", "balance", ...(multi ? ["statement"] : [])];
  const lines = [header.map((h) => csvCell(h, sep)).join(sep)];
  for (const { tx, source } of rowsFor(statements)) {
    lines.push(
      [
        date(tx.date),
        date(tx.valueDate),
        tx.description,
        tx.amount < 0 ? money(-tx.amount, dec) : "",
        tx.amount >= 0 ? money(tx.amount, dec) : "",
        money(tx.amount, dec),
        tx.balance !== undefined ? money(tx.balance, dec) : "",
        ...(multi ? [source] : []),
      ]
        .map((c) => csvCell(c, sep))
        .join(sep),
    );
  }
  return (variant === "fr" ? "﻿" : "") + lines.join("\r\n") + "\r\n";
}

function xmlEscape(s: string) {
  return (
    s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      // Strip control characters that are invalid in XML 1.0.
      .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "")
  );
}

function excelSerial(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  return Math.round((Date.UTC(y, m - 1, d) - Date.UTC(1899, 11, 30)) / 86400000);
}

function colName(i: number) {
  let s = "";
  let n = i + 1;
  while (n > 0) {
    const r = (n - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

/** Minimal, valid Office Open XML workbook with typed cells (dates, numbers, text). */
export function toXlsx(statements: ParsedStatement[]): Uint8Array {
  const multi = statements.length > 1;
  const header = ["Date", "Date de valeur", "Libellé", "Débit", "Crédit", "Montant", "Solde", ...(multi ? ["Relevé"] : [])];
  type C = { t: "s"; v: string } | { t: "n"; v: number; style?: number } | { t: "d"; v: string } | null;
  const rows: C[][] = [header.map((h) => ({ t: "s", v: h }) as C)];
  for (const { tx, source } of rowsFor(statements)) {
    rows.push([
      tx.date ? { t: "d", v: tx.date } : null,
      tx.valueDate ? { t: "d", v: tx.valueDate } : null,
      { t: "s", v: tx.description },
      tx.amount < 0 ? { t: "n", v: -tx.amount / 100 } : null,
      tx.amount >= 0 ? { t: "n", v: tx.amount / 100 } : null,
      { t: "n", v: tx.amount / 100 },
      tx.balance !== undefined ? { t: "n", v: tx.balance / 100 } : null,
      ...(multi ? [{ t: "s", v: source } as C] : []),
    ]);
  }
  const sheetRows = rows
    .map((r, ri) => {
      const cells = r
        .map((c, ci) => {
          if (!c) return "";
          const ref = `${colName(ci)}${ri + 1}`;
          if (ri === 0) return `<c r="${ref}" t="inlineStr" s="3"><is><t>${xmlEscape((c as { v: string }).v)}</t></is></c>`;
          if (c.t === "s") return `<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${xmlEscape(c.v)}</t></is></c>`;
          if (c.t === "d") return `<c r="${ref}" s="1"><v>${excelSerial(c.v)}</v></c>`;
          return `<c r="${ref}" s="2"><v>${c.v.toFixed(2)}</v></c>`;
        })
        .join("");
      return `<row r="${ri + 1}">${cells}</row>`;
    })
    .join("");
  const lastRow = rows.length;
  const sheet = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols><col min="1" max="2" width="12" customWidth="1"/><col min="3" max="3" width="60" customWidth="1"/><col min="4" max="7" width="14" customWidth="1"/><col min="8" max="8" width="28" customWidth="1"/></cols><sheetData>${sheetRows}</sheetData><autoFilter ref="A1:${colName(header.length - 1)}${lastRow}"/></worksheet>`;
  const styles = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><numFmts count="2"><numFmt numFmtId="164" formatCode="dd/mm/yyyy"/><numFmt numFmtId="165" formatCode="#,##0.00"/></numFmts><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="4"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="165" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/></cellXfs></styleSheet>`;
  const files: Record<string, Uint8Array> = {
    "[Content_Types].xml": strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`),
    "_rels/.rels": strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`),
    "xl/workbook.xml": strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Opérations" sheetId="1" r:id="rId1"/></sheets><definedNames><definedName name="_xlnm._FilterDatabase" localSheetId="0" hidden="1">'Opérations'!$A$1:$${colName(header.length - 1)}$${lastRow}</definedName></definedNames></workbook>`),
    "xl/_rels/workbook.xml.rels": strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`),
    "xl/worksheets/sheet1.xml": strToU8(sheet),
    "xl/styles.xml": strToU8(styles),
  };
  return zipSync(files, { level: 6 });
}

/** Stable identifier so re-importing the same file does not create duplicates in accounting software. */
function fitid(tx: Transaction, index: number): string {
  let h = 2166136261;
  const s = `${tx.date}|${tx.amount}|${tx.description}|${index}`;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return `${compactDate(tx.date)}${(h >>> 0).toString(36).toUpperCase()}`;
}

/** OFX 1.0.2 is declared as US-ASCII: transliterate accents and drop anything else. */
function sgml(s: string) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7e]/g, " ")
    .replace(/[<>&]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function toOfx(statements: ParsedStatement[], opts: { accountId?: string; bankId?: string } = {}): string {
  const rows = rowsFor(statements);
  const currency = statements[0]?.currency ?? "EUR";
  const dates = rows
    .map((r) => r.tx.date)
    .filter(Boolean)
    .sort();
  const start =
    statements
      .map((s) => s.periodStart)
      .filter(Boolean)
      .sort()[0] ?? dates[0];
  const end =
    statements
      .map((s) => s.periodEnd)
      .filter(Boolean)
      .sort()
      .at(-1) ?? dates.at(-1);
  const last = statements[statements.length - 1];
  const closing = last?.closingBalance ?? last?.transactions.at(-1)?.balance;
  const stmttrn = rows
    .map(({ tx }, i) =>
      [
        "<STMTTRN>",
        `<TRNTYPE>${tx.amount < 0 ? "DEBIT" : "CREDIT"}`,
        `<DTPOSTED>${compactDate(tx.date)}`,
        ...(tx.valueDate ? [`<DTAVAIL>${compactDate(tx.valueDate)}`] : []),
        `<TRNAMT>${money(tx.amount, ".")}`,
        `<FITID>${fitid(tx, i)}`,
        `<NAME>${sgml(tx.description).slice(0, 32)}`,
        `<MEMO>${sgml(tx.description).slice(0, 255)}`,
        "</STMTTRN>",
      ].join("\n"),
    )
    .join("\n");
  const now = new Date();
  const dtServer = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}`;
  return [
    "OFXHEADER:100",
    "DATA:OFXSGML",
    "VERSION:102",
    "SECURITY:NONE",
    "ENCODING:USASCII",
    "CHARSET:1252",
    "COMPRESSION:NONE",
    "OLDFILEUID:NONE",
    "NEWFILEUID:NONE",
    "",
    "<OFX>",
    "<SIGNONMSGSRSV1><SONRS><STATUS><CODE>0<SEVERITY>INFO</STATUS>",
    `<DTSERVER>${dtServer}<LANGUAGE>FRA</SONRS></SIGNONMSGSRSV1>`,
    "<BANKMSGSRSV1><STMTTRNRS><TRNUID>1<STATUS><CODE>0<SEVERITY>INFO</STATUS>",
    `<STMTRS><CURDEF>${currency}`,
    `<BANKACCTFROM><BANKID>${sgml(opts.bankId ?? "00000")}<ACCTID>${sgml(opts.accountId ?? "RELEVE")}<ACCTTYPE>CHECKING</BANKACCTFROM>`,
    `<BANKTRANLIST><DTSTART>${compactDate(start)}<DTEND>${compactDate(end)}`,
    stmttrn,
    "</BANKTRANLIST>",
    ...(closing !== undefined ? [`<LEDGERBAL><BALAMT>${money(closing, ".")}<DTASOF>${compactDate(end)}</LEDGERBAL>`] : []),
    "</STMTRS></STMTTRNRS></BANKMSGSRSV1>",
    "</OFX>",
    "",
  ].join("\n");
}

export function toQif(statements: ParsedStatement[]): string {
  const us = statements[0]?.dateOrder === "MDY";
  const date = (iso: string) => (us ? `${iso.slice(5, 7)}/${iso.slice(8, 10)}/${iso.slice(0, 4)}` : frDate(iso));
  const out = ["!Type:Bank"];
  for (const { tx } of rowsFor(statements)) {
    out.push(`D${date(tx.date)}`, `T${money(tx.amount, ".")}`, `P${tx.description.replace(/[\r\n]/g, " ")}`, "^");
  }
  return out.join("\r\n") + "\r\n";
}

/**
 * Bank journal in double entry (bank account 512 vs suspense account 471), using the
 * 18 columns of the French FEC layout. Accountants then reallocate 471 lines.
 */
export function toFec(
  statements: ParsedStatement[],
  opts: { journal?: string; bankAccount?: string; suspenseAccount?: string } = {},
): string {
  const journal = opts.journal ?? "BQ";
  const bank = opts.bankAccount ?? "512000";
  const suspense = opts.suspenseAccount ?? "471000";
  const cols = [
    "JournalCode",
    "JournalLib",
    "EcritureNum",
    "EcritureDate",
    "CompteNum",
    "CompteLib",
    "CompAuxNum",
    "CompAuxLib",
    "PieceRef",
    "PieceDate",
    "EcritureLib",
    "Debit",
    "Credit",
    "EcritureLet",
    "DateLet",
    "ValidDate",
    "Montantdevise",
    "Idevise",
  ];
  const clean = (s: string) => s.replace(/[\t\r\n|]/g, " ").slice(0, 200);
  const lines = [cols.join("\t")];
  rowsFor(statements).forEach(({ tx }, i) => {
    const num = `${journal}${(i + 1).toString().padStart(5, "0")}`;
    const d = compactDate(tx.date);
    const amt = money(Math.abs(tx.amount), ",");
    const lib = clean(tx.description);
    const bankLine = [
      journal,
      "Banque",
      num,
      d,
      bank,
      "Banque",
      "",
      "",
      num,
      d,
      lib,
      tx.amount >= 0 ? amt : "0,00",
      tx.amount < 0 ? amt : "0,00",
      "",
      "",
      "",
      "",
      "",
    ];
    const otherLine = [
      journal,
      "Banque",
      num,
      d,
      suspense,
      "Compte d'attente",
      "",
      "",
      num,
      d,
      lib,
      tx.amount < 0 ? amt : "0,00",
      tx.amount >= 0 ? amt : "0,00",
      "",
      "",
      "",
      "",
      "",
    ];
    lines.push(bankLine.join("\t"), otherLine.join("\t"));
  });
  return lines.join("\r\n") + "\r\n";
}

export function toJson(statements: ParsedStatement[]): string {
  return JSON.stringify(
    statements.map((s) => ({
      file: s.fileName,
      bank: s.bankName ?? null,
      currency: s.currency,
      period: { start: s.periodStart ?? null, end: s.periodEnd ?? null },
      openingBalance: s.openingBalance !== undefined ? s.openingBalance / 100 : null,
      closingBalance: s.closingBalance !== undefined ? s.closingBalance / 100 : null,
      reconciliation: {
        status: s.reconciliation.status,
        difference: s.reconciliation.difference !== undefined ? s.reconciliation.difference / 100 : null,
      },
      transactions: included(s).map((t) => ({
        date: t.date,
        valueDate: t.valueDate ?? null,
        description: t.description,
        amount: t.amount / 100,
        balance: t.balance !== undefined ? t.balance / 100 : null,
      })),
    })),
    null,
    2,
  );
}

export interface ExportOptions {
  fec?: { journal?: string; bankAccount?: string; suspenseAccount?: string };
}

export function buildExport(
  format: ExportFormat,
  statements: ParsedStatement[],
  options: ExportOptions = {},
): { data: Uint8Array | string; mime: string; filename: string } {
  const info = formatInfo(format);
  const base =
    statements.length === 1 ? statements[0].fileName.replace(/\.pdf$/i, "") : `releves-fusionnes-${new Date().toISOString().slice(0, 10)}`;
  const safeBase =
    base
      .replace(/[^\p{L}\p{N}._-]+/gu, "-")
      .replace(/^[.-]+/, "")
      .slice(0, 80) || "releve";
  const filename = `${safeBase}.${info.extension}`;
  let data: Uint8Array | string;
  switch (format) {
    case "csv-fr":
      data = toCsv(statements, "fr");
      break;
    case "csv-intl":
      data = toCsv(statements, "intl");
      break;
    case "xlsx":
      data = toXlsx(statements);
      break;
    case "ofx":
      data = toOfx(statements);
      break;
    case "qif":
      data = toQif(statements);
      break;
    case "fec":
      data = toFec(statements, options.fec);
      break;
    case "json":
      data = toJson(statements);
      break;
  }
  return { data, mime: info.mime, filename };
}
