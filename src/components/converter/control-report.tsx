import type { ParsedStatement } from "@/lib/statement/types";
import { frDate, frLongDate, money } from "./format";

/** Printable control report (paid feature). Rendered off-screen and printed with window.print(). */
export function ControlReport({ statements }: { statements: ParsedStatement[] }) {
  const now = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeStyle: "short" }).format(new Date());
  return (
    <div className="print-area hidden print:block" aria-hidden>
      <div style={{ fontFamily: "Arial, sans-serif", fontSize: 11, color: "#000" }}>
        <h1 style={{ fontSize: 18, margin: 0 }}>Rapport de contrôle des relevés</h1>
        <p style={{ margin: "4px 0 16px", color: "#444" }}>Généré par Relevéo le {now}. Contrôle : solde de départ + crédits − débits = solde final imprimé.</p>
        {statements.map((st) => {
          const r = st.reconciliation;
          const included = st.transactions.filter((t) => !t.excluded);
          return (
            <section key={st.fileName} style={{ marginBottom: 24, pageBreakInside: "avoid" }}>
              <h2 style={{ fontSize: 14, margin: "0 0 6px" }}>{st.fileName}</h2>
              <table style={{ borderCollapse: "collapse", marginBottom: 8 }}>
                <tbody>
                  {[
                    ["Banque reconnue", st.bankName ?? "—"],
                    ["Période", st.periodStart ? `du ${frLongDate(st.periodStart)} au ${frLongDate(st.periodEnd)}` : "—"],
                    ["Pages", String(st.pageCount)],
                    ["Opérations exportées", `${included.length} (${st.transactions.length - included.length} exclue(s))`],
                    ["Solde de départ", money(r.opening, st.currency)],
                    ["Total des crédits", money(r.totalCredits, st.currency)],
                    ["Total des débits", money(r.totalDebits, st.currency)],
                    ["Solde final imprimé", money(r.closing, st.currency)],
                    [
                      "Résultat",
                      r.status === "verified" ? "VÉRIFIÉ AU CENTIME" : r.status === "mismatch" ? `ÉCART de ${money(Math.abs(r.difference ?? 0), st.currency)}` : "NON VÉRIFIABLE (soldes absents)",
                    ],
                  ].map(([k, v]) => (
                    <tr key={k}>
                      <td style={{ padding: "2px 16px 2px 0", color: "#444" }}>{k}</td>
                      <td style={{ padding: "2px 0", fontWeight: 600 }}>{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10 }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: "left", borderBottom: "1px solid #000", padding: 3 }}>Date</th>
                    <th style={{ textAlign: "left", borderBottom: "1px solid #000", padding: 3 }}>Libellé</th>
                    <th style={{ textAlign: "right", borderBottom: "1px solid #000", padding: 3 }}>Montant</th>
                  </tr>
                </thead>
                <tbody>
                  {included.map((t) => (
                    <tr key={t.id}>
                      <td style={{ padding: 3, borderBottom: "1px solid #ddd", whiteSpace: "nowrap" }}>{frDate(t.date)}</td>
                      <td style={{ padding: 3, borderBottom: "1px solid #ddd" }}>{t.description}</td>
                      <td style={{ padding: 3, borderBottom: "1px solid #ddd", textAlign: "right", whiteSpace: "nowrap" }}>{money(t.amount, st.currency, true)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          );
        })}
        <p style={{ color: "#666", fontSize: 9 }}>Relevéo est un outil d&apos;aide à la saisie. Ce rapport ne constitue pas une attestation bancaire.</p>
      </div>
    </div>
  );
}
