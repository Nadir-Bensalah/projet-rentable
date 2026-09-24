"use client";

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="fr">
      <body style={{ fontFamily: "system-ui, sans-serif", padding: 48, textAlign: "center" }}>
        <h1>Une erreur est survenue</h1>
        <p>Rechargez la page. Si le problème persiste, contactez le support.</p>
        <button type="button" onClick={reset} style={{ padding: "10px 18px", marginTop: 16 }}>
          Réessayer
        </button>
      </body>
    </html>
  );
}
