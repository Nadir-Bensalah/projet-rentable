"use client";

import { Check } from "lucide-react";
import { useState } from "react";
import { FREE_MONTHLY_PAGES, MAX_FREE_REEXPORTS, PACK, PLANS, formatPrice } from "@/config/plans";
import { ButtonLink } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { CheckoutButton } from "./checkout-button";
import { WithdrawalConsent } from "./withdrawal-consent";

export function PricingTable() {
  const [yearly, setYearly] = useState(false);
  const [consent, setConsent] = useState(false);
  const [consentMissing, setConsentMissing] = useState(false);
  const consentProps = {
    consent,
    onMissingConsent: () => {
      setConsentMissing(true);
      document.getElementById("withdrawal-consent")?.focus();
    },
  };
  const plan = (id: "pro" | "business") => {
    const p = PLANS[id];
    const price = yearly ? p.priceYearly / 12 : p.priceMonthly;
    return { p, price };
  };
  return (
    <div>
      <div className="mb-8 flex justify-center">
        <div
          className="inline-flex rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-1"
          role="radiogroup"
          aria-label="Période de facturation"
        >
          {[false, true].map((y) => (
            <button
              key={String(y)}
              type="button"
              role="radio"
              aria-checked={yearly === y}
              onClick={() => setYearly(y)}
              className={cn(
                "rounded-lg px-4 py-2 text-sm font-semibold transition-colors",
                yearly === y ? "bg-brand-600 text-white" : "text-muted hover:text-[var(--fg)]",
              )}
            >
              {y ? "Annuel (2 mois offerts)" : "Mensuel"}
            </button>
          ))}
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-4">
        <Card title="Gratuit" price="0 €" note="pour toujours" features={PLANS.free.features}>
          <ButtonLink href="/convertir" variant="secondary" size="lg" className="w-full" data-cta="pricing-free">
            Commencer
          </ButtonLink>
        </Card>
        <Card title={PACK.name} price={formatPrice(PACK.price)} note="paiement unique" features={PACK.features}>
          <CheckoutButton product="pack" label="Acheter le pack" variant="secondary" {...consentProps} />
        </Card>
        {(["pro", "business"] as const).map((id) => {
          const { p, price } = plan(id);
          return (
            <Card
              key={id}
              title={p.name}
              price={formatPrice(Math.round(price))}
              note={yearly ? `par mois, facturé ${formatPrice(p.priceYearly)} / an` : "par mois, sans engagement"}
              features={p.features}
              highlight={p.highlight}
            >
              <CheckoutButton
                product={`${id}_${yearly ? "yearly" : "monthly"}`}
                label={`Choisir ${p.name}`}
                variant={p.highlight ? "primary" : "secondary"}
                {...consentProps}
              />
            </Card>
          );
        })}
      </div>
      <WithdrawalConsent
        className="mx-auto mt-6 max-w-2xl"
        checked={consent}
        invalid={consentMissing && !consent}
        onChange={(v) => {
          setConsent(v);
          if (v) setConsentMissing(false);
        }}
      />
      <p className="mt-6 text-center text-sm text-subtle">
        Prix TTC. Une « page » = une page de relevé PDF exportée. {FREE_MONTHLY_PAGES} pages gratuites renouvelées chaque mois. Les pages du
        pack s&apos;ajoutent à votre forfait mensuel. Ré-exporter un même relevé dans un autre format pendant le mois ne consomme pas de
        page, jusqu&apos;à {MAX_FREE_REEXPORTS} fois par relevé (toutes offres).
      </p>
    </div>
  );
}

function Card({
  title,
  price,
  note,
  features,
  highlight,
  children,
}: {
  title: string;
  price: string;
  note: string;
  features: string[];
  highlight?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "relative flex flex-col rounded-2xl border bg-[var(--bg-elevated)] p-6",
        highlight ? "border-2 border-brand-500 shadow-[var(--shadow-lift)]" : "border-[var(--border)]",
      )}
    >
      {highlight ? (
        <span className="absolute -top-3 left-6 rounded-full bg-brand-600 px-3 py-1 text-xs font-semibold text-white">
          Recommandé pour les indépendants
        </span>
      ) : null}
      <h2 className="text-lg font-bold">{title}</h2>
      <p className="mt-4">
        <span className="tabular text-4xl font-bold tracking-tight">{price}</span>
      </p>
      <p className="mt-1 text-sm text-subtle">{note}</p>
      <ul className="mt-6 grid flex-1 gap-2.5 text-[0.95rem]">
        {features.map((f) => (
          <li key={f} className="flex gap-2.5">
            <Check className="mt-0.5 size-4.5 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
            <span className="text-muted">{f}</span>
          </li>
        ))}
      </ul>
      <div className="mt-7">{children}</div>
    </div>
  );
}
