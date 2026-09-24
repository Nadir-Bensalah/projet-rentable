import { strFromU8, unzipSync } from "fflate";
import { describe, expect, it } from "vitest";
import { formatCents, parseAmount, scanAmounts, detectCurrency } from "@/lib/statement/amounts";
import { detectBank } from "@/lib/statement/banks";
import { inferDateOrder, leadingDate, parseRawDate, resolveDate } from "@/lib/statement/dates";
import { buildExport, mergeTransactions, toCsv, toFec, toOfx, toQif, toXlsx } from "@/lib/statement/export";
import { reconcile } from "@/lib/statement/reconcile";
import { parseStatement } from "@/lib/statement/parse";
import type { ParsedStatement, PageText, Transaction } from "@/lib/statement/types";

describe("parseAmount", () => {
  it.each([
    ["1 234,56", 123456, 0, ","],
    ["1 234,56", 123456, 0, ","],
    ["1.234,56", 123456, 0, ","],
    ["1,234.56", 123456, 0, "."],
    ["12,50", 1250, 0, ","],
    ["-12,50 €", 1250, -1, ","],
    ["+1 200,00 €", 120000, 1, ","],
    ["$1,520.34", 152034, 0, "."],
    ["(45.00)", 4500, -1, "."],
    ["45.00 CR", 4500, 1, "."],
    ["45.00 DR", 4500, -1, "."],
    ["12,50-", 1250, -1, ","],
    ["−7,00", 700, -1, ","],
    ["1'234.50", 123450, 0, "."],
  ])("parses %s", (raw, cents, sign, dec) => {
    const a = parseAmount(raw);
    expect(a).not.toBeNull();
    expect(a!.cents).toBe(cents);
    expect(a!.sign).toBe(sign);
    expect(a!.decimal).toBe(dec);
  });

  it.each(["2026", "12/08", "4821", "FR76 3000", "1,5", "abc", "12.345", "", "1 234,567"])("rejects %s", (raw) => {
    expect(parseAmount(raw)).toBeNull();
  });

  it("scans amounts inside text", () => {
    const found = scanAmounts("Nouveau solde au 31/08/2026 : 1 265,44");
    expect(found.map((a) => a.cents)).toEqual([126544]);
  });

  it("formats cents", () => {
    expect(formatCents(-123456)).toBe("-1 234,56");
    expect(formatCents(5, ".")).toBe("0.05");
  });

  it("detects currency", () => {
    expect(detectCurrency("Total 12,00 € EUR")).toBe("EUR");
    expect(detectCurrency("Balance $1,000.00 USD")).toBe("USD");
    expect(detectCurrency("£12.00 GBP")).toBe("GBP");
  });
});

describe("dates", () => {
  it("parses common formats", () => {
    expect(parseRawDate("02/08")).toMatchObject({ a: 2, b: 8, year: undefined });
    expect(parseRawDate("02.08.2026")).toMatchObject({ a: 2, b: 8, year: 2026 });
    expect(parseRawDate("2 août 2026")).toMatchObject({ a: 2, b: 8, year: 2026, textual: true });
    expect(parseRawDate("12 Aug 2026")).toMatchObject({ a: 12, b: 8, year: 2026 });
    expect(parseRawDate("Aug 12, 2026")).toMatchObject({ a: 12, b: 8, year: 2026 });
    expect(parseRawDate("2026-08-12")).toMatchObject({ a: 12, b: 8, year: 2026 });
    expect(parseRawDate("1er janv. 26")).toMatchObject({ a: 1, b: 1, year: 2026 });
    expect(parseRawDate("32/13")).toBeNull();
    expect(parseRawDate("hello")).toBeNull();
  });

  it("finds leading dates and rest of line", () => {
    expect(leadingDate("02/08 02/08 CARTE X1234")?.rest).toBe("02/08 CARTE X1234");
    expect(leadingDate("12 Aug 2026 CARD PAYMENT")?.rest).toBe("CARD PAYMENT");
    expect(leadingDate("CARTE 02/08")).toBeNull();
  });

  it("infers day/month order", () => {
    expect(inferDateOrder([parseRawDate("08/25")!], ".", "USD")).toBe("MDY");
    expect(inferDateOrder([parseRawDate("25/08")!], ",", "EUR")).toBe("DMY");
    expect(inferDateOrder([parseRawDate("05/08")!], ".", "USD")).toBe("MDY");
  });

  it("completes missing years across new year", () => {
    const period = { start: "2025-12-15", end: "2026-01-14" };
    expect(resolveDate(parseRawDate("20/12")!, "DMY", period)).toBe("2025-12-20");
    expect(resolveDate(parseRawDate("03/01")!, "DMY", period)).toBe("2026-01-03");
    expect(resolveDate(parseRawDate("31/02")!, "DMY", period)).toBeNull();
  });
});

describe("detectBank", () => {
  it("uses the earliest mention", () => {
    expect(detectBank("BNP PARIBAS\nVIR RECU DE CREDIT AGRICOLE")?.id).toBe("bnp-paribas");
    expect(detectBank("Relevé Qonto")?.id).toBe("qonto");
    expect(detectBank("Nothing here")).toBeUndefined();
  });
});

const tx = (date: string, amount: number, description = "OP"): Transaction => ({ id: date + amount, date, amount, description, page: 1 });

function statement(transactions: Transaction[], extra: Partial<ParsedStatement> = {}): ParsedStatement {
  return {
    fileName: "test.pdf",
    pageCount: 1,
    currency: "EUR",
    decimalSeparator: ",",
    dateOrder: "DMY",
    transactions,
    columns: ["date", "description", "amount"],
    reconciliation: reconcile(transactions, extra.openingBalance, extra.closingBalance),
    warnings: [],
    kind: "text",
    ...extra,
  };
}

describe("reconcile", () => {
  it("verifies to the cent", () => {
    const r = reconcile([tx("2026-01-01", -1000), tx("2026-01-02", 2500)], 10000, 11500);
    expect(r.status).toBe("verified");
    expect(r.totalDebits).toBe(1000);
    expect(r.totalCredits).toBe(2500);
  });
  it("reports differences", () => {
    const r = reconcile([tx("2026-01-01", -1000)], 10000, 9001);
    expect(r).toMatchObject({ status: "mismatch", difference: 1 });
  });
  it("ignores excluded rows", () => {
    const r = reconcile([tx("2026-01-01", -1000), { ...tx("2026-01-01", -5), excluded: true }], 10000, 9000);
    expect(r.status).toBe("verified");
  });
  it("is unverifiable without balances or totals", () => {
    expect(reconcile([tx("2026-01-01", -1000)], undefined, undefined).status).toBe("unverifiable");
  });
  it("can verify with printed totals only", () => {
    expect(reconcile([tx("2026-01-01", -1000)], undefined, undefined, { debits: 1000 }).status).toBe("verified");
  });
});

describe("exports", () => {
  const s = statement(
    [tx("2026-08-02", -123456, "=HYPERLINK(\"http://evil\")"), tx("2026-08-03", 250000, 'VIR "SALAIRE"; août')],
    { openingBalance: 0, closingBalance: 126544, periodStart: "2026-08-01", periodEnd: "2026-08-31" },
  );

  it("writes French CSV with BOM, semicolons and formula protection", () => {
    const csv = toCsv([s], "fr");
    expect(csv.startsWith("﻿Date;")).toBe(true);
    expect(csv).toContain(`02/08/2026;;"'=HYPERLINK(""http://evil"")";1234,56;;-1234,56;`);
    expect(csv).toContain('"VIR ""SALAIRE""; août"');
  });

  it("writes international CSV", () => {
    const csv = toCsv([s], "intl");
    expect(csv.split("\r\n")[0]).toBe("date,value_date,description,debit,credit,amount,balance");
    expect(csv).toContain("2026-08-03,,\"VIR \"\"SALAIRE\"\"; août\",,2500.00,2500.00,");
  });

  it("writes a valid xlsx package", () => {
    const files = unzipSync(toXlsx([s]));
    expect(Object.keys(files)).toEqual(
      expect.arrayContaining(["[Content_Types].xml", "xl/workbook.xml", "xl/worksheets/sheet1.xml", "xl/styles.xml"]),
    );
    const sheet = strFromU8(files["xl/worksheets/sheet1.xml"]);
    expect(sheet).toContain("<v>46236</v>"); // 2026-08-02 as Excel serial
    expect(sheet).toContain("<v>-1234.56</v>");
    expect(sheet).toContain("=HYPERLINK(&quot;http://evil&quot;)");
  });

  it("writes OFX with ASCII-only content and ledger balance", () => {
    const ofx = toOfx([s]);
    expect(ofx).toContain("<TRNAMT>-1234.56");
    expect(ofx).toContain("<TRNTYPE>CREDIT");
    expect(ofx).toContain("<LEDGERBAL><BALAMT>1265.44<DTASOF>20260831");
    expect(ofx).toContain("aout");
    expect(/[^\x00-\x7f]/.test(ofx)).toBe(false);
  });

  it("writes QIF", () => {
    const qif = toQif([s]);
    expect(qif.startsWith("!Type:Bank\r\nD02/08/2026\r\nT-1234.56")).toBe(true);
  });

  it("writes balanced FEC journal entries", () => {
    const fec = toFec([s]);
    const rows = fec.replace(/\r\n$/, "").split("\r\n").slice(1).map((r) => r.split("\t"));
    expect(rows).toHaveLength(4);
    expect(rows.every((r) => r.length === 18)).toBe(true);
    const toNum = (v: string) => Number(v.replace(",", "."));
    const debit = rows.reduce((a, r) => a + toNum(r[11]), 0);
    const credit = rows.reduce((a, r) => a + toNum(r[12]), 0);
    expect(debit).toBeCloseTo(credit, 2);
    expect(rows[0][4]).toBe("512000");
    expect(rows[0][12]).toBe("1234,56");
  });

  it("merges overlapping statements without losing genuine duplicates", () => {
    const a = statement([tx("2026-01-01", -500, "CAFE"), tx("2026-01-01", -500, "CAFE"), tx("2026-01-05", -100)]);
    const b = statement([tx("2026-01-05", -100), tx("2026-02-01", 900)], { fileName: "b.pdf" });
    const merged = mergeTransactions([a, b]);
    expect(merged.map((m) => m.tx.amount)).toEqual([-500, -500, -100, 900]);
  });

  it("names files safely", () => {
    const out = buildExport("json", [{ ...s, fileName: "../../etc/pass wd.pdf" }]);
    expect(out.filename).toBe("etc-pass-wd.json");
  });
});

describe("parseStatement edge cases", () => {
  it("flags empty documents", () => {
    expect(parseStatement([], "x.pdf").kind).toBe("empty");
  });
  it("flags image-only documents", () => {
    const pages: PageText[] = [{ page: 1, width: 595, height: 842, items: [] }];
    expect(parseStatement(pages).kind).toBe("scanned");
  });
  it("returns a helpful warning when no operations are found", () => {
    const items = Array.from({ length: 10 }, (_, i) => ({
      str: `Conditions générales de banque, article ${i} du contrat`,
      x: 40,
      y: 60 + i * 14,
      width: 300,
      height: 10,
      page: 1,
    }));
    const r = parseStatement([{ page: 1, width: 595, height: 842, items }]);
    expect(r.transactions).toHaveLength(0);
    expect(r.warnings.join(" ")).toMatch(/Aucune opération/);
  });
});
