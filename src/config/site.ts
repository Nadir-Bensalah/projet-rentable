export const site = {
  name: "Relevéo",
  tagline: "Vos relevés bancaires PDF, convertis et vérifiés au centime.",
  description:
    "Convertissez vos relevés bancaires PDF en Excel, CSV, OFX ou écritures comptables. Le fichier ne quitte jamais votre ordinateur, et chaque relevé est contrôlé : solde de départ + opérations = solde final.",
  url: process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  locale: "fr_FR",
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "support@releveo.fr",
  /**
   * Legal identity of the publisher. These values MUST be completed by the owner
   * before launch (see business/EXTERNAL-ACTIONS.md). They are displayed as clearly
   * marked placeholders until then.
   */
  legal: {
    publisherName: process.env.NEXT_PUBLIC_LEGAL_NAME ?? "[À COMPLÉTER : nom et prénom de l'entrepreneur]",
    status: process.env.NEXT_PUBLIC_LEGAL_STATUS ?? "[À COMPLÉTER : Entrepreneur individuel (micro-entreprise)]",
    siren: process.env.NEXT_PUBLIC_LEGAL_SIREN ?? "[À COMPLÉTER : SIREN]",
    address: process.env.NEXT_PUBLIC_LEGAL_ADDRESS ?? "[À COMPLÉTER : adresse de domiciliation]",
    vat: process.env.NEXT_PUBLIC_LEGAL_VAT ?? "TVA non applicable, art. 293 B du CGI [À CONFIRMER]",
    director: process.env.NEXT_PUBLIC_LEGAL_DIRECTOR ?? "[À COMPLÉTER : directeur de la publication]",
    host: process.env.NEXT_PUBLIC_LEGAL_HOST ?? "[À COMPLÉTER : nom, adresse et téléphone de l'hébergeur]",
  },
} as const;

export function absoluteUrl(path = "/") {
  return new URL(path, site.url).toString();
}
