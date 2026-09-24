"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ProductId } from "@/config/plans";
import { track } from "@/lib/analytics/client";
import { api } from "@/lib/api-client";
import { useAccount } from "@/components/layout/use-account";
import { Button } from "@/components/ui/button";

export function CheckoutButton({
  product,
  label,
  variant = "primary",
}: {
  product: ProductId;
  label: string;
  variant?: "primary" | "secondary";
}) {
  const { state } = useAccount();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const subscribed =
    state.status === "authenticated" &&
    state.account.subscription &&
    product !== "pack" &&
    state.account.subscription.status !== "canceled";
  return (
    <div>
      <Button
        className="w-full"
        variant={variant}
        size="lg"
        loading={loading}
        onClick={async () => {
          track("checkout_clicked", { product });
          if (state.status !== "authenticated") {
            router.push(`/inscription?suite=${encodeURIComponent(`/tarifs?offre=${product}`)}`);
            return;
          }
          if (subscribed) {
            router.push("/compte/abonnement");
            return;
          }
          setLoading(true);
          setError(null);
          const res = await api<{ url: string }>("/api/billing/checkout", { body: { product } });
          if (res.ok && res.data.url) {
            window.location.href = res.data.url;
            return;
          }
          setLoading(false);
          if (res.data.code === "email_unverified") setError("Confirmez d'abord votre adresse e-mail (lien reçu à l'inscription).");
          else setError(res.data.error ?? "Paiement indisponible pour le moment.");
        }}
      >
        {subscribed ? "Gérer mon abonnement" : label}
      </Button>
      {error ? (
        <p role="alert" className="mt-2 text-sm font-medium text-rose-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}
