/**
 * Commercial offer. Shared by the pricing page, the paywall, the quota engine
 * and the payment providers so there is a single source of truth.
 * Prices are TTC (VAT included) — the merchant of record handles VAT.
 */
export type PlanId = "free" | "pro" | "business";
export type BillingInterval = "month" | "year";
export type ProductId = "pack" | "pro_monthly" | "pro_yearly" | "business_monthly" | "business_yearly";

export interface Plan {
  id: PlanId;
  name: string;
  monthlyPages: number;
  priceMonthly: number; // cents
  priceYearly: number; // cents
  features: string[];
  highlight?: boolean;
}

export const FREE_MONTHLY_PAGES = 15;

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: "free",
    name: "Gratuit",
    monthlyPages: FREE_MONTHLY_PAGES,
    priceMonthly: 0,
    priceYearly: 0,
    features: [
      `${FREE_MONTHLY_PAGES} pages exportées par mois`,
      "Excel (.xlsx) et CSV",
      "Vérification du solde au centime",
      "Traitement 100 % dans votre navigateur",
    ],
  },
  pro: {
    id: "pro",
    name: "Pro",
    monthlyPages: 400,
    priceMonthly: 1200,
    priceYearly: 12000,
    highlight: true,
    features: [
      "400 pages par mois",
      "Tous les formats : Excel, CSV, OFX, QIF, JSON, journal de banque 512/471 paramétrable",
      "Plusieurs relevés à la fois et fusion en un seul fichier",
      "Rapport de contrôle imprimable pour chaque relevé",
      "Ré-export gratuit d'un même relevé pendant le mois",
    ],
  },
  business: {
    id: "business",
    name: "Cabinet",
    monthlyPages: 2500,
    priceMonthly: 3900,
    priceYearly: 39000,
    features: [
      "2 500 pages par mois",
      "Tout le plan Pro",
      "Volume adapté au traitement des dossiers clients",
      "Support prioritaire par e-mail",
    ],
  },
};

export const PACK = {
  id: "pack" as const,
  name: "Pack 150 pages",
  pages: 150,
  price: 1500,
  validityMonths: 12,
  features: ["150 pages à utiliser pendant 12 mois", "Tous les formats et toutes les fonctions Pro", "Paiement unique, sans abonnement"],
};

export interface ProductInfo {
  id: ProductId;
  kind: "pack" | "subscription";
  plan?: Exclude<PlanId, "free">;
  interval?: BillingInterval;
  price: number;
  label: string;
}

export const PRODUCTS: Record<ProductId, ProductInfo> = {
  pack: { id: "pack", kind: "pack", price: PACK.price, label: PACK.name },
  pro_monthly: {
    id: "pro_monthly",
    kind: "subscription",
    plan: "pro",
    interval: "month",
    price: PLANS.pro.priceMonthly,
    label: "Pro mensuel",
  },
  pro_yearly: { id: "pro_yearly", kind: "subscription", plan: "pro", interval: "year", price: PLANS.pro.priceYearly, label: "Pro annuel" },
  business_monthly: {
    id: "business_monthly",
    kind: "subscription",
    plan: "business",
    interval: "month",
    price: PLANS.business.priceMonthly,
    label: "Cabinet mensuel",
  },
  business_yearly: {
    id: "business_yearly",
    kind: "subscription",
    plan: "business",
    interval: "year",
    price: PLANS.business.priceYearly,
    label: "Cabinet annuel",
  },
};

export function isProductId(v: unknown): v is ProductId {
  return typeof v === "string" && v in PRODUCTS;
}

export const REFERRAL_REWARD_PAGES = 30;

export function formatPrice(cents: number): string {
  const euros = cents / 100;
  return euros % 1 === 0 ? `${euros} €` : `${euros.toFixed(2).replace(".", ",")} €`;
}
