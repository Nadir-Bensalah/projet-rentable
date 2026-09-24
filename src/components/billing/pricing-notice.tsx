"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { track } from "@/lib/analytics/client";
import { Alert } from "@/components/ui/alert";

function Inner() {
  const params = useSearchParams();
  useEffect(() => {
    track("pricing_viewed");
  }, []);
  if (params.get("paiement") === "annule") {
    return (
      <Alert tone="info" className="mb-8">
        Paiement annulé : aucun montant n&apos;a été débité. Vous pouvez choisir une offre quand vous le souhaitez.
      </Alert>
    );
  }
  if (params.get("offre")) {
    return (
      <Alert tone="info" className="mb-8">
        Votre compte est créé. Confirmez votre adresse e-mail (lien reçu), puis choisissez votre offre ci-dessous.
      </Alert>
    );
  }
  return null;
}

export function PricingNotice() {
  return (
    <Suspense fallback={null}>
      <Inner />
    </Suspense>
  );
}
