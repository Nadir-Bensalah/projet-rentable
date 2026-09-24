"use client";

import { extractPdfText, PdfInvalidError, PdfPasswordError, PdfTooLargeError, type PdfJsLike } from "@/lib/statement/extract";
import { parseStatement } from "@/lib/statement/parse";
import { reconcile } from "@/lib/statement/reconcile";
import type { ParsedStatement } from "@/lib/statement/types";

export const MAX_FILE_BYTES = 25 * 1024 * 1024;
export const MAX_FILES = 24;
const STORAGE_KEY = "releveo:workspace";

export type DocStatus = "reading" | "password" | "parsed" | "error";

export interface Doc {
  id: string;
  fileName: string;
  size: number;
  hash?: string;
  status: DocStatus;
  progress?: { done: number; total: number };
  error?: string;
  passwordIncorrect?: boolean;
  statement?: ParsedStatement;
}

let pdfjsPromise: Promise<PdfJsLike> | null = null;
export function loadPdfJs(): Promise<PdfJsLike> {
  if (!pdfjsPromise) {
    pdfjsPromise = import("pdfjs-dist/legacy/build/pdf.mjs").then((mod) => {
      mod.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
      return mod as unknown as PdfJsLike;
    });
  }
  return pdfjsPromise;
}

export async function sha256Hex(data: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function newId() {
  return typeof crypto.randomUUID === "function" ? crypto.randomUUID() : Math.random().toString(36).slice(2);
}

export type ProcessResult =
  | { kind: "parsed"; statement: ParsedStatement; hash: string }
  | { kind: "password"; incorrect: boolean; hash: string }
  | { kind: "error"; message: string; hash?: string };

/** Reads and parses one PDF entirely in the browser. */
export async function processPdf(
  bytes: ArrayBuffer,
  fileName: string,
  opts: { password?: string; onProgress?: (done: number, total: number) => void } = {},
): Promise<ProcessResult> {
  const hash = await sha256Hex(bytes);
  try {
    const pdfjs = await loadPdfJs();
    // pdf.js transfers the buffer to its worker: give it a copy.
    const pages = await extractPdfText(pdfjs, new Uint8Array(bytes.slice(0)), opts);
    const statement = parseStatement(pages, fileName);
    return { kind: "parsed", statement, hash };
  } catch (e) {
    if (e instanceof PdfPasswordError) return { kind: "password", incorrect: e.incorrect, hash };
    if (e instanceof PdfTooLargeError || e instanceof PdfInvalidError) return { kind: "error", message: e.message, hash };
    console.error(e);
    return { kind: "error", message: "Ce PDF n'a pas pu être lu. Il est peut-être endommagé ou dans un format inhabituel.", hash };
  }
}

export function withReconciliation(st: ParsedStatement): ParsedStatement {
  return { ...st, reconciliation: reconcile(st.transactions, st.openingBalance, st.closingBalance, st.printedTotals) };
}

/** The workspace is kept in this tab's sessionStorage only — it never leaves the browser. */
export function saveWorkspace(docs: Doc[]) {
  try {
    const persistable = docs.filter((d) => d.status === "parsed" && d.statement).map((d) => ({ ...d, progress: undefined }));
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ v: 1, docs: persistable }));
  } catch {
    /* quota exceeded or storage disabled: the workspace simply won't survive a reload */
  }
}

export function loadWorkspace(): Doc[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { v: number; docs: Doc[] };
    if (parsed.v !== 1 || !Array.isArray(parsed.docs)) return [];
    return parsed.docs.filter((d) => d.statement && d.status === "parsed");
  } catch {
    return [];
  }
}

export function clearWorkspace() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function formatBytes(n: number) {
  if (n < 1024) return `${n} o`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} Ko`;
  return `${(n / 1024 / 1024).toFixed(1).replace(".", ",")} Mo`;
}
