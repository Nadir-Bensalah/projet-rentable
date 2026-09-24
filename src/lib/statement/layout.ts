import type { Cell, Line, PageText, TextItem } from "./types";

/**
 * Groups positioned text items into visual lines, and merges items that are
 * close together on a line into cells. Column gaps are kept as separate cells.
 */
export function buildLines(pages: PageText[]): Line[] {
  const lines: Line[] = [];
  for (const page of pages) {
    const items = page.items.filter((it) => it.str.trim().length > 0 && it.height > 0).sort((a, b) => a.y - b.y || a.x - b.x);

    const rows: TextItem[][] = [];
    for (const it of items) {
      const row = rows.find((r) => {
        const ref = r[0];
        const tol = Math.max(ref.height, it.height) * 0.45;
        return Math.abs(ref.y - it.y) <= tol;
      });
      if (row) row.push(it);
      else rows.push([it]);
    }

    for (const row of rows) {
      row.sort((a, b) => a.x - b.x);
      const cells: Cell[] = [];
      for (const it of row) {
        const last = cells[cells.length - 1];
        const gap = last ? it.x - last.x1 : Infinity;
        const joinTol = it.height * 0.55;
        if (last && gap <= joinTol) {
          const needsSpace = gap > it.height * 0.12 && !last.text.endsWith(" ") && !it.str.startsWith(" ");
          last.text += (needsSpace ? " " : "") + it.str;
          last.x1 = Math.max(last.x1, it.x + it.width);
        } else {
          cells.push({ text: it.str, x0: it.x, x1: it.x + it.width });
        }
      }
      for (const c of cells) c.text = c.text.replace(/\s+/g, " ").trim();
      const nonEmpty = cells.filter((c) => c.text.length > 0);
      if (!nonEmpty.length) continue;
      const y = row.reduce((s, it) => s + it.y, 0) / row.length;
      const height = Math.max(...row.map((it) => it.height));
      lines.push({
        page: page.page,
        y,
        height,
        cells: nonEmpty,
        text: nonEmpty.map((c) => c.text).join("  "),
      });
    }
  }
  lines.sort((a, b) => a.page - b.page || a.y - b.y);
  return lines;
}

/** Lower-case, accent-free, single-spaced text for keyword matching. */
export function normaliseText(s: string) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
}
