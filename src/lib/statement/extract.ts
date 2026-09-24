import type { PageText, TextItem } from "./types";

/** Minimal structural types of the pdf.js API we rely on (works with browser and Node builds). */
interface PdfTextItem {
  str: string;
  transform: number[];
  width: number;
  height: number;
}
interface PdfPage {
  getViewport(o: { scale: number }): { width: number; height: number };
  getTextContent(): Promise<{ items: unknown[] }>;
  cleanup?: () => void;
}
interface PdfDocument {
  numPages: number;
  getPage(n: number): Promise<PdfPage>;
  destroy?: () => Promise<void>;
}
export interface PdfJsLike {
  getDocument(src: { data: Uint8Array; password?: string; isEvalSupported?: boolean; disableFontFace?: boolean }): {
    promise: Promise<PdfDocument>;
    onPassword?: (cb: (pwd: string) => void, reason: number) => void;
    destroy?: () => Promise<void>;
  };
}

export const MAX_PAGES = 200;

export class PdfPasswordError extends Error {
  constructor(public readonly incorrect: boolean) {
    super(incorrect ? "Mot de passe incorrect" : "Ce PDF est protégé par un mot de passe");
    this.name = "PdfPasswordError";
  }
}

export class PdfTooLargeError extends Error {
  constructor(public readonly pages: number) {
    super(`Ce PDF contient ${pages} pages (maximum ${MAX_PAGES}).`);
    this.name = "PdfTooLargeError";
  }
}

export class PdfInvalidError extends Error {
  constructor() {
    super("Ce fichier n'est pas un PDF valide ou il est endommagé.");
    this.name = "PdfInvalidError";
  }
}

/** Extracts positioned text from every page. Runs entirely where it is called (the browser in production). */
export async function extractPdfText(
  pdfjs: PdfJsLike,
  data: Uint8Array,
  opts: { password?: string; onProgress?: (done: number, total: number) => void } = {},
): Promise<PageText[]> {
  if (data.byteLength < 8 || String.fromCharCode(...data.slice(0, 5)) !== "%PDF-") {
    throw new PdfInvalidError();
  }
  const task = pdfjs.getDocument({
    data,
    password: opts.password,
    isEvalSupported: false,
    disableFontFace: true,
  });
  let doc: PdfDocument;
  try {
    doc = await task.promise;
  } catch (e: unknown) {
    const err = e as { name?: string; code?: number };
    if (err?.name === "PasswordException") throw new PdfPasswordError(err.code === 2);
    throw new PdfInvalidError();
  }
  try {
    if (doc.numPages > MAX_PAGES) throw new PdfTooLargeError(doc.numPages);
    const pages: PageText[] = [];
    for (let n = 1; n <= doc.numPages; n++) {
      const page = await doc.getPage(n);
      const vp = page.getViewport({ scale: 1 });
      const content = await page.getTextContent();
      const items: TextItem[] = [];
      for (const raw of content.items) {
        const it = raw as PdfTextItem;
        if (typeof it.str !== "string" || !Array.isArray(it.transform)) continue;
        if (!it.str.trim()) continue;
        const [a, b, , d, e, f] = it.transform;
        // Skip rotated text (watermarks, side margins).
        if (Math.abs(b) > Math.abs(a) * 0.2) continue;
        const height = Math.abs(d) || it.height;
        items.push({ str: it.str, x: e, y: vp.height - f, width: it.width, height, page: n });
      }
      pages.push({ page: n, width: vp.width, height: vp.height, items });
      page.cleanup?.();
      opts.onProgress?.(n, doc.numPages);
    }
    return pages;
  } finally {
    await doc.destroy?.();
  }
}
