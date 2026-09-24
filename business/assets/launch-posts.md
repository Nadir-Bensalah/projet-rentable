# Posts de lancement (prêts à publier)

## Show HN (anglais)
**Title:** Show HN: Relevéo – bank statement PDF to Excel/OFX, parsed in the browser and reconciled to the cent

I built a converter for bank statement PDFs that never uploads the file: pdf.js extracts positioned text in the browser, a layout analyser rebuilds the table (dates without years, debit/credit columns or signed amounts, running balances, page carry-overs), and then it re-does the bank's maths: opening balance + credits − debits must equal the printed closing balance. If it doesn't, you see the exact gap and the rows to check.

Why: most converters ask you to upload a document containing your IBAN and salary, and none tell you whether a row was dropped.

The CSP is `connect-src 'self'`, so the page can't send data elsewhere; it also works offline once loaded. Exports: XLSX (real dates/numbers), CSV, OFX 1.0.2, QIF, JSON, and a double-entry bank journal for French accounting (FEC columns).

UI is French for now (the parser handles US/UK formats). Free tier: 15 pages/month. Feedback on statement layouts it misreads is very welcome — there's an anonymous "report" button that only sends the structure (column roles, counts), never the content.

## Indie Hackers (anglais)
Title: Launching a privacy-first bank statement converter with a "proof" angle

Market signal: BankStatementConverter reportedly grew to 5 figures MRR with SEO only. The space is now full of clones, so I focused on two things clones don't do: (1) a verifiable to-the-cent reconciliation for every statement, (2) no upload at all. Target: French accountants who receive client statements as PDFs. Pricing: free 15 pages/month, 15 € pack, 12 €/month Pro, 39 €/month for firms. I'll share real numbers (visitors, signups, paid) after 30 days — currently zero.

## Communautés FR (indépendants / micro-entrepreneurs)
Titre : J'ai créé un outil gratuit pour convertir ses relevés bancaires PDF en Excel (sans envoyer le fichier)

Bonjour à tous, beaucoup d'entre nous doivent un jour recopier des relevés PDF (livre des recettes, déclaration, ancien compte clôturé…). J'ai développé Relevéo : vous déposez le PDF, il est lu dans votre navigateur (rien n'est envoyé), et l'outil vérifie que solde de départ + opérations = solde final, au centime. Export Excel/CSV gratuit jusqu'à 15 pages par mois. Je cherche surtout des retours sur les relevés qui seraient mal lus. Lien : {APP_URL}

## LinkedIn (annonce)
Recopier un relevé bancaire PDF, c'est long — et une ligne oubliée ne se voit pas.
J'ai lancé Relevéo : vos relevés PDF convertis en Excel, CSV, OFX ou écritures comptables, **vérifiés au centime** (solde de départ + opérations = solde final).
Et le fichier ne quitte jamais votre ordinateur : tout se passe dans le navigateur.
Gratuit jusqu'à 15 pages par mois : {APP_URL}
