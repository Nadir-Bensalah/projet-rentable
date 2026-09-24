import { strToU8, zipSync } from "fflate";

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

type Cell = { v?: string | number; f?: string; s?: number } | null;

function sheetXml(rows: Cell[][], cols: number[]) {
  const colName = (i: number) => String.fromCharCode(65 + i);
  const body = rows
    .map((r, ri) => {
      const cells = r
        .map((c, ci) => {
          if (!c) return "";
          const ref = `${colName(ci)}${ri + 1}`;
          const s = c.s !== undefined ? ` s="${c.s}"` : "";
          if (c.f) return `<c r="${ref}"${s}><f>${esc(c.f)}</f></c>`;
          if (typeof c.v === "number") return `<c r="${ref}"${s}><v>${c.v}</v></c>`;
          return `<c r="${ref}" t="inlineStr"${s}><is><t xml:space="preserve">${esc(String(c.v ?? ""))}</t></is></c>`;
        })
        .join("");
      return `<row r="${ri + 1}">${cells}</row>`;
    })
    .join("");
  const colsXml = cols.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><cols>${colsXml}</cols><sheetData>${body}</sheetData></worksheet>`;
}

/** A free, formula-driven bank reconciliation workbook (lead magnet). */
export function buildReconciliationTemplate(): Uint8Array {
  const h = (v: string): Cell => ({ v, s: 1 });
  const n = (v?: number): Cell => (v === undefined ? { s: 2 } : { v, s: 2 });
  const rows: Cell[][] = [
    [{ v: "Rapprochement bancaire — modèle Relevéo", s: 3 }],
    [{ v: "Complétez les cellules jaunes. Les totaux se calculent seuls." }],
    [],
    [h("Solde du relevé bancaire à la date de clôture"), { v: 0, s: 4 }],
    [h("+ Encaissements enregistrés en comptabilité, pas encore sur le relevé"), { f: "SUM(C15:C64)", s: 2 }],
    [h("− Décaissements enregistrés en comptabilité, pas encore sur le relevé"), { f: "SUM(D15:D64)", s: 2 }],
    [h("= Solde bancaire rapproché"), { f: "B4+B5-B6", s: 5 }],
    [],
    [h("Solde du compte 512 en comptabilité"), { v: 0, s: 4 }],
    [h("+ Crédits sur le relevé non encore comptabilisés"), { f: "SUM(E15:E64)", s: 2 }],
    [h("− Débits sur le relevé non encore comptabilisés"), { f: "SUM(F15:F64)", s: 2 }],
    [h("= Solde comptable rapproché"), { f: "B9+B10-B11", s: 5 }],
    [h("Écart (doit être égal à 0)"), { f: "ROUND(B7-B12,2)", s: 5 }],
    [
      h("Date"),
      h("Libellé"),
      h("Encaissement en compta, absent du relevé"),
      h("Décaissement en compta, absent du relevé"),
      h("Crédit du relevé, absent de la compta"),
      h("Débit du relevé, absent de la compta"),
    ],
    ...Array.from({ length: 50 }, () => [{ s: 6 }, { v: "" }, n(), n(), n(), n()] as Cell[]),
  ];
  const styles = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><numFmts count="2"><numFmt numFmtId="164" formatCode="#,##0.00"/><numFmt numFmtId="165" formatCode="dd/mm/yyyy"/></numFmts><fonts count="3"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="14"/><name val="Calibri"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFFFF3C4"/></patternFill></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="7"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/><xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"/><xf numFmtId="164" fontId="0" fillId="2" borderId="0" xfId="0" applyNumberFormat="1" applyFill="1"/><xf numFmtId="164" fontId="1" fillId="0" borderId="0" xfId="0" applyNumberFormat="1" applyFont="1"/><xf numFmtId="165" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/></cellXfs></styleSheet>`;
  return zipSync({
    "[Content_Types].xml": strToU8(
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`,
    ),
    "_rels/.rels": strToU8(
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
    ),
    "xl/workbook.xml": strToU8(
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Rapprochement" sheetId="1" r:id="rId1"/></sheets><calcPr calcId="191029" fullCalcOnLoad="1"/></workbook>`,
    ),
    "xl/_rels/workbook.xml.rels": strToU8(
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`,
    ),
    "xl/worksheets/sheet1.xml": strToU8(sheetXml(rows, [62, 34, 22, 22, 22, 22])),
    "xl/styles.xml": strToU8(styles),
  });
}
