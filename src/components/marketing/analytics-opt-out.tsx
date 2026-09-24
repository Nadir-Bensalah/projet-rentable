"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export function AnalyticsOptOut() {
  const [optedOut, setOptedOut] = useState<boolean | null>(null);
  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOptedOut(localStorage.getItem("rv_optout") === "1");
    } catch {
      setOptedOut(false);
    }
  }, []);
  if (optedOut === null) return null;
  return (
    <div className="surface flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-semibold">Mesure d&apos;audience</p>
        <p className="mt-1 text-sm text-muted" role="status">
          {optedOut ? "Désactivée sur ce navigateur : aucun événement n'est envoyé." : "Activée (interne, anonyme, sans cookie)."}
        </p>
      </div>
      <Button
        variant={optedOut ? "primary" : "secondary"}
        onClick={() => {
          try {
            if (optedOut) localStorage.removeItem("rv_optout");
            else localStorage.setItem("rv_optout", "1");
          } catch {
            /* ignore */
          }
          setOptedOut(!optedOut);
        }}
      >
        {optedOut ? "Réactiver la mesure d'audience" : "Désactiver la mesure d'audience"}
      </Button>
    </div>
  );
}
