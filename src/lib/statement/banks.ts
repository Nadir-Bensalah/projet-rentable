/**
 * Banks we can recognise from a statement's text. Recognition is only used to
 * label the statement: parsing itself is generic and verified by the balance check.
 */
export interface BankInfo {
  id: string;
  name: string;
  country: "FR" | "BE" | "CH" | "INT";
  patterns: RegExp[];
}

export const BANKS: BankInfo[] = [
  { id: "bnp-paribas", name: "BNP Paribas", country: "FR", patterns: [/bnp\s*paribas/i] },
  { id: "hello-bank", name: "Hello bank!", country: "FR", patterns: [/hello\s*bank/i] },
  { id: "credit-agricole", name: "Crédit Agricole", country: "FR", patterns: [/cr[ée]dit\s+agricole/i] },
  { id: "lcl", name: "LCL", country: "FR", patterns: [/\bLCL\b/, /cr[ée]dit\s+lyonnais/i] },
  { id: "societe-generale", name: "Société Générale", country: "FR", patterns: [/soci[ée]t[ée]\s+g[ée]n[ée]rale/i] },
  { id: "banque-postale", name: "La Banque Postale", country: "FR", patterns: [/banque\s+postale/i] },
  { id: "caisse-epargne", name: "Caisse d'Epargne", country: "FR", patterns: [/caisse\s+d.[ée]pargne/i] },
  { id: "banque-populaire", name: "Banque Populaire", country: "FR", patterns: [/banque\s+populaire/i] },
  { id: "credit-mutuel", name: "Crédit Mutuel", country: "FR", patterns: [/cr[ée]dit\s+mutuel/i] },
  { id: "cic", name: "CIC", country: "FR", patterns: [/\bCIC\b/] },
  { id: "boursobank", name: "BoursoBank (Boursorama)", country: "FR", patterns: [/bourso\s*bank/i, /boursorama/i] },
  { id: "fortuneo", name: "Fortuneo", country: "FR", patterns: [/fortuneo/i] },
  { id: "qonto", name: "Qonto", country: "FR", patterns: [/\bqonto\b/i] },
  { id: "shine", name: "Shine", country: "FR", patterns: [/\bshine\b/i] },
  { id: "revolut", name: "Revolut", country: "INT", patterns: [/revolut/i] },
  { id: "n26", name: "N26", country: "INT", patterns: [/\bN26\b/] },
  { id: "wise", name: "Wise", country: "INT", patterns: [/\bwise\b.*(payments|europe)/i] },
  { id: "hsbc", name: "HSBC", country: "INT", patterns: [/\bHSBC\b/] },
  { id: "ing", name: "ING", country: "INT", patterns: [/\bING\b/] },
  { id: "credit-cooperatif", name: "Crédit Coopératif", country: "FR", patterns: [/cr[ée]dit\s+coop[ée]ratif/i] },
  { id: "bred", name: "BRED", country: "FR", patterns: [/\bBRED\b/] },
  { id: "monabanq", name: "Monabanq", country: "FR", patterns: [/monabanq/i] },
];

export function detectBank(text: string): BankInfo | undefined {
  // Prefer the earliest mention: letterheads come first, while other banks may appear in transaction labels.
  let best: { bank: BankInfo; index: number } | undefined;
  for (const bank of BANKS) {
    for (const p of bank.patterns) {
      const m = p.exec(text);
      if (m && (best === undefined || m.index < best.index)) best = { bank, index: m.index };
    }
  }
  return best?.bank;
}
