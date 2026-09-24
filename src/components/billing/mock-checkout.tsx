"use client";

import { useState } from "react";
import { api } from "@/lib/api-client";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export function MockCheckoutActions({ token }: { token: string }) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const act = async (outcome: "paid" | "failed" | "canceled") => {
    setLoading(outcome);
    setError(null);
    const res = await api<{ redirect: string }>("/api/billing/mock/complete", { body: { token, outcome } });
    if (res.ok && res.data.redirect) {
      window.location.href = res.data.redirect;
      return;
    }
    setLoading(null);
    setError(res.data.error ?? "Erreur de simulation.");
  };
  return (
    <div className="grid gap-3">
      {error ? <Alert tone="error">{error}</Alert> : null}
      <Button size="lg" onClick={() => act("paid")} loading={loading === "paid"} disabled={!!loading} data-testid="mock-pay">
        Payer (simulation)
      </Button>
      <Button variant="secondary" onClick={() => act("failed")} loading={loading === "failed"} disabled={!!loading} data-testid="mock-fail">
        Simuler un paiement refusé
      </Button>
      <Button
        variant="ghost"
        onClick={() => act("canceled")}
        loading={loading === "canceled"}
        disabled={!!loading}
        data-testid="mock-cancel"
      >
        Annuler et revenir
      </Button>
    </div>
  );
}

export function MockPortalActions({ token, canceling }: { token: string; canceling: boolean }) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const act = async (action: string) => {
    setLoading(action);
    setError(null);
    const res = await api<{ redirect: string }>("/api/billing/mock/portal", { body: { token, action } });
    if (res.ok && res.data.redirect) {
      window.location.href = res.data.redirect;
      return;
    }
    setLoading(null);
    setError(res.data.error ?? "Erreur de simulation.");
  };
  return (
    <div className="grid gap-3">
      {error ? <Alert tone="error">{error}</Alert> : null}
      {canceling ? (
        <Button onClick={() => act("resume")} loading={loading === "resume"} data-testid="mock-resume">
          Reprendre l&apos;abonnement
        </Button>
      ) : (
        <Button variant="danger" onClick={() => act("cancel")} loading={loading === "cancel"} data-testid="mock-cancel-sub">
          Résilier à la fin de la période
        </Button>
      )}
      <Button variant="secondary" onClick={() => act("renew")} loading={loading === "renew"} data-testid="mock-renew">
        Simuler un renouvellement payé
      </Button>
      <Button variant="secondary" onClick={() => act("fail_renewal")} loading={loading === "fail_renewal"} data-testid="mock-fail-renewal">
        Simuler un échec de renouvellement
      </Button>
      <Button variant="ghost" onClick={() => act("expire")} loading={loading === "expire"} data-testid="mock-expire">
        Simuler la fin de l&apos;abonnement
      </Button>
    </div>
  );
}
