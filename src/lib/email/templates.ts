import { site } from "@/config/site";

export interface EmailContent {
  subject: string;
  html: string;
  text: string;
}

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

interface LayoutOptions {
  preheader: string;
  title: string;
  paragraphs: string[]; // plain text, escaped here
  cta?: { label: string; url: string };
  after?: string[];
  footerNote?: string;
}

/** Table-based, inline-styled layout that renders in Gmail, Outlook, Apple Mail and on mobile. */
function layout(o: LayoutOptions): { html: string; text: string } {
  const p = (t: string) =>
    `<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#1f2937;">${esc(t)}</p>`;
  const button = o.cta
    ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 24px;"><tr><td bgcolor="#1d4ed8" style="border-radius:10px;">
<a href="${esc(o.cta.url)}" style="display:inline-block;padding:14px 24px;font-size:16px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:10px;">${esc(o.cta.label)}</a>
</td></tr></table>
<p style="margin:0 0 16px;font-size:13px;line-height:1.5;color:#6b7280;">Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br><a href="${esc(o.cta.url)}" style="color:#1d4ed8;word-break:break-all;">${esc(o.cta.url)}</a></p>`
    : "";
  const html = `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light only"><title>${esc(o.title)}</title></head>
<body style="margin:0;padding:0;background:#f3f4f6;-webkit-text-size-adjust:100%;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(o.preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f3f4f6;"><tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background:#ffffff;border-radius:16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<tr><td style="padding:28px 28px 8px;"><span style="font-size:20px;font-weight:700;color:#0f172a;letter-spacing:-0.02em;">${esc(site.name)}</span></td></tr>
<tr><td style="padding:8px 28px 12px;">
<h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;color:#0f172a;">${esc(o.title)}</h1>
${o.paragraphs.map(p).join("\n")}
${button}
${(o.after ?? []).map(p).join("\n")}
</td></tr>
<tr><td style="padding:16px 28px 28px;border-top:1px solid #e5e7eb;">
<p style="margin:0;font-size:12px;line-height:1.5;color:#6b7280;">${esc(o.footerNote ?? "Vous recevez cet e-mail car vous avez un compte " + site.name + ".")}<br>${esc(site.name)} — ${esc(site.url.replace(/^https?:\/\//, ""))} — ${esc(site.supportEmail)}</p>
</td></tr></table></td></tr></table></body></html>`;
  const text = [
    o.title,
    "",
    ...o.paragraphs,
    ...(o.cta ? ["", `${o.cta.label} : ${o.cta.url}`] : []),
    ...(o.after?.length ? ["", ...o.after] : []),
    "",
    "—",
    `${site.name} — ${site.url}`,
  ].join("\n");
  return { html, text };
}

export type TemplateName =
  | "verify_email"
  | "reset_password"
  | "password_changed"
  | "pack_purchased"
  | "subscription_started"
  | "subscription_canceled"
  | "payment_failed"
  | "quota_warning"
  | "activation_nudge"
  | "account_deleted"
  | "referral_reward"
  | "support_message";

export type TemplateData = {
  verify_email: { url: string; name?: string | null };
  reset_password: { url: string };
  password_changed: Record<string, never>;
  pack_purchased: { pages: number; expires: string; appUrl: string };
  subscription_started: { planName: string; pages: number; appUrl: string };
  subscription_canceled: { planName: string; endDate: string | null; billingUrl: string };
  payment_failed: { planName: string; billingUrl: string };
  quota_warning: { used: number; limit: number; pricingUrl: string };
  activation_nudge: { appUrl: string };
  account_deleted: Record<string, never>;
  referral_reward: { pages: number; appUrl: string };
  support_message: { from: string; topic: string; message: string };
};

export function renderTemplate<T extends TemplateName>(name: T, data: TemplateData[T]): EmailContent {
  const d = data as Record<string, unknown>;
  switch (name) {
    case "verify_email": {
      const hello = d.name ? `Bonjour ${d.name},` : "Bonjour,";
      const l = layout({
        preheader: "Confirmez votre adresse pour activer vos pages gratuites.",
        title: "Bienvenue sur Relevéo",
        paragraphs: [
          hello,
          "Merci d'avoir créé votre compte. Confirmez votre adresse e-mail pour activer vos pages gratuites et télécharger vos premiers fichiers.",
        ],
        cta: { label: "Confirmer mon adresse", url: String(d.url) },
        after: [
          "Rappel : vos relevés sont lus directement dans votre navigateur. Ils ne sont jamais envoyés sur nos serveurs.",
          "Ce lien expire dans 48 heures. Si vous n'êtes pas à l'origine de cette inscription, ignorez simplement ce message.",
        ],
        footerNote: "Vous recevez cet e-mail suite à une inscription sur Relevéo.",
      });
      return { subject: "Confirmez votre adresse e-mail — Relevéo", ...l };
    }
    case "reset_password": {
      const l = layout({
        preheader: "Lien de réinitialisation valable 1 heure.",
        title: "Réinitialiser votre mot de passe",
        paragraphs: ["Vous avez demandé à réinitialiser votre mot de passe. Ce lien est valable 1 heure et ne peut servir qu'une fois."],
        cta: { label: "Choisir un nouveau mot de passe", url: String(d.url) },
        after: ["Si vous n'avez rien demandé, ignorez ce message : votre mot de passe actuel reste valable."],
      });
      return { subject: "Réinitialisation de votre mot de passe — Relevéo", ...l };
    }
    case "password_changed": {
      const l = layout({
        preheader: "Votre mot de passe a été modifié.",
        title: "Mot de passe modifié",
        paragraphs: [
          "Le mot de passe de votre compte vient d'être modifié et vos autres sessions ont été déconnectées.",
          `Si vous n'êtes pas à l'origine de ce changement, réinitialisez immédiatement votre mot de passe et écrivez-nous à ${site.supportEmail}.`,
        ],
      });
      return { subject: "Votre mot de passe a été modifié — Relevéo", ...l };
    }
    case "pack_purchased": {
      const l = layout({
        preheader: `${d.pages} pages ajoutées à votre compte.`,
        title: "Merci pour votre achat",
        paragraphs: [
          `${d.pages} pages ont été ajoutées à votre compte. Elles sont utilisables jusqu'au ${d.expires}, avec tous les formats d'export.`,
          "Votre facture vous est envoyée séparément par notre prestataire de paiement.",
        ],
        cta: { label: "Convertir un relevé", url: String(d.appUrl) },
      });
      return { subject: "Vos pages sont disponibles — Relevéo", ...l };
    }
    case "subscription_started": {
      const l = layout({
        preheader: `Votre abonnement ${d.planName} est actif.`,
        title: `Abonnement ${d.planName} activé`,
        paragraphs: [
          `Votre abonnement est actif : ${d.pages} pages par mois, tous les formats, la conversion de plusieurs relevés à la fois et la fusion.`,
          "Vous pouvez gérer ou résilier votre abonnement à tout moment depuis votre espace, rubrique Abonnement.",
        ],
        cta: { label: "Convertir un relevé", url: String(d.appUrl) },
      });
      return { subject: `Bienvenue dans ${d.planName} — Relevéo`, ...l };
    }
    case "subscription_canceled": {
      const until = d.endDate ? `Vous gardez l'accès jusqu'au ${d.endDate}.` : "L'accès aux fonctions payantes est terminé.";
      const l = layout({
        preheader: "Votre résiliation est prise en compte.",
        title: "Résiliation confirmée",
        paragraphs: [
          `Votre abonnement ${d.planName} est résilié. ${until}`,
          "Vous restez sur le plan gratuit, et vos données de compte sont conservées. Vous pouvez vous réabonner à tout moment.",
        ],
        cta: { label: "Gérer mon abonnement", url: String(d.billingUrl) },
      });
      return { subject: "Résiliation de votre abonnement — Relevéo", ...l };
    }
    case "payment_failed": {
      const l = layout({
        preheader: "Mettez à jour votre moyen de paiement.",
        title: "Le paiement n'a pas abouti",
        paragraphs: [
          `Nous n'avons pas pu encaisser le renouvellement de votre abonnement ${d.planName}. Notre prestataire va réessayer automatiquement dans les prochains jours.`,
          "Pour éviter une interruption, vérifiez ou mettez à jour votre moyen de paiement.",
        ],
        cta: { label: "Mettre à jour le paiement", url: String(d.billingUrl) },
      });
      return { subject: "Problème de paiement — Relevéo", ...l };
    }
    case "quota_warning": {
      const l = layout({
        preheader: "Vous approchez de votre limite mensuelle.",
        title: "Vous avez presque atteint votre limite",
        paragraphs: [
          `Vous avez utilisé ${d.used} pages sur ${d.limit} ce mois-ci.`,
          "Pour continuer sans attendre le mois prochain, vous pouvez acheter un pack de pages (sans abonnement) ou passer à un plan supérieur.",
        ],
        cta: { label: "Voir les offres", url: String(d.pricingUrl) },
      });
      return { subject: "Vous approchez de votre limite de pages — Relevéo", ...l };
    }
    case "activation_nudge": {
      const l = layout({
        preheader: "Votre premier relevé prend moins d'une minute.",
        title: "Votre premier relevé en moins d'une minute",
        paragraphs: [
          "Vous avez créé votre compte mais pas encore converti de relevé. Déposez simplement un relevé PDF dans Relevéo : le tableau des opérations apparaît, avec la vérification du solde.",
          "Le fichier reste sur votre ordinateur. Vos pages gratuites du mois sont disponibles.",
        ],
        cta: { label: "Convertir mon premier relevé", url: String(d.appUrl) },
        footerNote: "Vous recevez ce message une seule fois, après votre inscription.",
      });
      return { subject: "Il ne manque plus que votre premier relevé — Relevéo", ...l };
    }
    case "account_deleted": {
      const l = layout({
        preheader: "Votre compte a été supprimé.",
        title: "Compte supprimé",
        paragraphs: [
          "Votre compte Relevéo et les données qui y sont associées ont été supprimés. Si un abonnement était actif, il a été résilié.",
          "Les pièces comptables (factures) restent conservées par notre prestataire de paiement pendant la durée légale.",
        ],
        footerNote: "Dernier message lié à votre compte.",
      });
      return { subject: "Votre compte a été supprimé — Relevéo", ...l };
    }
    case "referral_reward": {
      const l = layout({
        preheader: `${d.pages} pages offertes.`,
        title: "Merci pour votre recommandation",
        paragraphs: [`Une personne que vous avez invitée vient de confirmer son compte. ${d.pages} pages ont été ajoutées à votre compte.`],
        cta: { label: "Utiliser mes pages", url: String(d.appUrl) },
      });
      return { subject: `${d.pages} pages offertes — Relevéo`, ...l };
    }
    case "support_message": {
      const l = layout({
        preheader: `Nouveau message : ${d.topic}`,
        title: `Message de contact : ${d.topic}`,
        paragraphs: [`De : ${d.from}`, String(d.message)],
        footerNote: "Message transmis par le formulaire de contact.",
      });
      return { subject: `[Contact] ${d.topic}`, ...l };
    }
  }
  throw new Error(`Unknown template ${name}`);
}
