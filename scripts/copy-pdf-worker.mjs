// Copies the pdf.js worker next to the app so it is served from our own origin (CSP: worker-src 'self').
import fs from "node:fs";
import path from "node:path";
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const src = path.join(root, "node_modules/pdfjs-dist/legacy/build/pdf.worker.min.mjs");
const dest = path.join(root, "public/pdf.worker.min.mjs");
if (!fs.existsSync(src)) {
  console.error("pdfjs-dist is not installed");
  process.exit(1);
}
fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.copyFileSync(src, dest);
console.log("pdf.js worker copied to public/");
