/**
 * Regression tests built from PDFs produced by the independent QA team
 * (layouts deliberately different from our own synthetic fixtures).
 */
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { extractPdfText, PdfPasswordError, type PdfJsLike } from "@/lib/statement/extract";
import { parseStatement } from "@/lib/statement/parse";

const DIR = path.join(__dirname, "../fixtures/qa");

async function pdfjs(): Promise<PdfJsLike> {
  return (await import("pdfjs-dist/legacy/build/pdf.mjs")) as unknown as PdfJsLike;
}

async function parse(name: string, password?: string) {
  const data = new Uint8Array(fs.readFileSync(path.join(DIR, `${name}.pdf`)));
  const pages = await extractPdfText(await pdfjs(), data, { password });
  return parseStatement(pages, `${name}.pdf`);
}

interface Truth {
  o?: number;
  c?: number;
  n?: number;
  t?: { d: string; desc: string; amt: number }[];
}

const WITH_TRUTH = ["crdb-suffix", "long-desc", "long-desc-top", "multi-currency", "no-balances", "paren-neg-yy", "suffix-eur", "textdate-dotthousands", "three-pages-totals", "two-dates"];

describe("QA challenge statements", () => {
  for (const name of WITH_TRUTH) {
    it(`reads ${name} exactly`, async () => {
      const truth = JSON.parse(fs.readFileSync(path.join(DIR, `${name}.json`), "utf8")) as Truth;
      const r = await parse(name);
      if (truth.o !== undefined) {
        expect(r.openingBalance).toBe(truth.o);
        expect(r.closingBalance).toBe(truth.c);
        expect(r.reconciliation.status).toBe("verified");
      }
      if (truth.n !== undefined) expect(r.transactions).toHaveLength(truth.n);
      if (truth.t) {
        // multi-currency: the QA ground truth omits the foreign-amount text that IS printed in the label.
        const withLabel = name !== "multi-currency";
        const got = r.transactions.map((t) => ({
          d: `${t.date.slice(8, 10)}/${t.date.slice(5, 7)}/${t.date.slice(0, 4)}`,
          ...(withLabel ? { desc: t.description } : {}),
          amt: t.amount,
        }));
        expect(got).toEqual(truth.t.map((t) => (withLabel ? t : { d: t.d, amt: t.amt })));
      }
    });
  }

  it("keeps space-separated thousands in plain-text (Courier) statements", async () => {
    const r = await parse("courier-plain");
    expect(r.transactions.some((t) => t.amount === 200000)).toBe(true);
    expect(r.transactions.every((t) => t.amount !== 0)).toBe(true);
    expect(r.reconciliation.status).toBe("verified");
  });

  it("detects the account currency, not currencies quoted in labels", async () => {
    expect((await parse("multi-currency")).currency).toBe("EUR");
  });

  it("reads debit-only statements whatever the header alignment", async () => {
    for (const n of ["dup-nov", "dup-nov-r"]) {
      const r = await parse(n);
      expect(r.reconciliation.status, n).toBe("verified");
      expect(r.transactions.every((t) => t.amount < 0), n).toBe(true);
    }
  });

  it("opens password-protected PDFs only with the right password", async () => {
    await expect(parse("protected")).rejects.toBeInstanceOf(PdfPasswordError);
    await expect(parse("protected", "wrong")).rejects.toMatchObject({ incorrect: true });
    const r = await parse("protected", "1234");
    expect(r.reconciliation.status).toBe("verified");
  });

  it("reports blank PDFs without crashing", async () => {
    const r = await parse("empty");
    expect(r.transactions).toHaveLength(0);
    expect(["scanned", "empty"]).toContain(r.kind);
  });
});
