export const site = {
  name: "Relevéo",
  tagline: "Vos relevés bancaires PDF, convertis et vérifiés au centime.",
  description:
    "Convertissez vos relevés bancaires PDF en Excel, CSV, OFX ou écritures comptables. Le fichier ne quitte jamais votre ordinateur, et chaque relevé est contrôlé : solde de départ + opérations = solde final.",
  url: process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  locale: "fr_FR",
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@releveo.fr",
} as const;

export function absoluteUrl(path = "/") {
  return new URL(path, site.url).toString();
}

const PLACEHOLDER = "[À COMPLÉTER";

function envValue(...keys: string[]): string | undefined {
  for (const k of keys) {
    const v = process.env[k]?.trim();
    if (v) return v;
  }
  return undefined;
}

/**
 * Legal identity of the publisher, read from the environment at request time
 * (LEGAL_* variables, NEXT_PUBLIC_LEGAL_* accepted for compatibility). Missing values
 * are rendered as clearly marked placeholders; production startup refuses to run with
 * placeholders unless ALLOW_INCOMPLETE_LEGAL=true (see src/lib/env.ts).
 */
export function legalIdentity() {
  const provider = envValue("PAYMENT_PROVIDER");
  const email = envValue("EMAIL_PROVIDER");
  return {
    publisherName: envValue("LEGAL_NAME", "NEXT_PUBLIC_LEGAL_NAME") ?? `${PLACEHOLDER} : nom et prénom de l'entrepreneur]`,
    status: envValue("LEGAL_STATUS", "NEXT_PUBLIC_LEGAL_STATUS") ?? "Entrepreneur individuel (micro-entreprise)",
    siren: envValue("LEGAL_SIREN", "NEXT_PUBLIC_LEGAL_SIREN") ?? `${PLACEHOLDER} : SIREN]`,
    address: envValue("LEGAL_ADDRESS", "NEXT_PUBLIC_LEGAL_ADDRESS") ?? `${PLACEHOLDER} : adresse de domiciliation]`,
    vat: envValue("LEGAL_VAT", "NEXT_PUBLIC_LEGAL_VAT") ?? "TVA non applicable, art. 293 B du CGI",
    director:
      envValue("LEGAL_DIRECTOR", "NEXT_PUBLIC_LEGAL_DIRECTOR") ??
      envValue("LEGAL_NAME", "NEXT_PUBLIC_LEGAL_NAME") ??
      `${PLACEHOLDER} : directeur de la publication]`,
    host: envValue("LEGAL_HOST", "NEXT_PUBLIC_LEGAL_HOST") ?? `${PLACEHOLDER} : nom, adresse et téléphone de l'hébergeur de l'application]`,
    dbHost: envValue("LEGAL_DB_HOST") ?? `${PLACEHOLDER} : nom, adresse et téléphone de l'hébergeur de la base de données]`,
    mediator: envValue("LEGAL_MEDIATOR") ?? `${PLACEHOLDER} : nom, adresse et site du médiateur de la consommation]`,
    contactEmail: envValue("SUPPORT_EMAIL", "NEXT_PUBLIC_SUPPORT_EMAIL") ?? site.supportEmail,
    paymentProvider:
      provider === "lemonsqueezy"
        ? "Lemon Squeezy (Lemon Squeezy, LLC)"
        : provider === "stripe"
          ? "Stripe (Stripe Payments Europe, Ltd.)"
          : "le prestataire de paiement",
    emailProvider:
      email === "resend"
        ? "Resend"
        : email === "smtp"
          ? (envValue("LEGAL_EMAIL_PROVIDER") ?? "le fournisseur d'envoi d'e-mails")
          : "le fournisseur d'envoi d'e-mails",
  };
}

/** Names of the legal identity fields still holding a placeholder. */
export function missingLegalFields(): string[] {
  return Object.entries(legalIdentity())
    .filter(([, v]) => v.startsWith(PLACEHOLDER))
    .map(([k]) => k);
}
