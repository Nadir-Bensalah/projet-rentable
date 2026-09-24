import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { extractPdfText, type PdfJsLike } from "@/lib/statement/extract";
import { parseStatement } from "@/lib/statement/parse";

const DIR = path.join(__dirname, "../fixtures/pdf");

async function pdfjs(): Promise<PdfJsLike> {
  return (await import("pdfjs-dist/legacy/build/pdf.mjs")) as unknown as PdfJsLike;
}

async function parseFixture(name: string) {
  const data = new Uint8Array(fs.readFileSync(path.join(DIR, `${name}.pdf`)));
  const pages = await extractPdfText(await pdfjs(), data);
  return parseStatement(pages, `${name}.pdf`);
}

const fixtures = fs
  .readdirSync(DIR)
  .filter((f) => f.endsWith(".json"))
  .map((f) => f.replace(/\.json$/, ""));

describe("statement parser on synthetic PDFs", () => {
  for (const name of fixtures) {
    it(`parses ${name}`, async () => {
      const expected = JSON.parse(fs.readFileSync(path.join(DIR, `${name}.json`), "utf8"));
      const result = await parseFixture(name);
      if (expected.kind) expect(result.kind).toBe(expected.kind);
      expect(result.reconciliation.status).toBe(expected.status);
      if (expected.opening !== undefined) expect(result.openingBalance).toBe(expected.opening);
      if (expected.closing !== undefined) expect(result.closingBalance).toBe(expected.closing);
      if (expected.currency) expect(result.currency).toBe(expected.currency);
      if (expected.transactions) {
        const got = result.transactions.map((t) => ({ date: t.date, description: t.description, amount: t.amount }));
        expect(got).toEqual(expected.transactions);
        const guessed = result.transactions.filter((t) => t.signGuessed).length;
        expect(guessed).toBeLessThanOrEqual(expected.allowGuessed ?? 0);
      }
    });
  }
});
