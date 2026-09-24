"use client";

import { useEffect } from "react";
import { Button, ButtonLink } from "@/components/ui/button";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <h1 className="text-3xl font-bold tracking-tight">Une erreur est survenue</h1>
      <p className="mt-3 text-muted">Nous n&apos;avons pas pu afficher cette page. Réessayez ; si le problème persiste, contactez-nous.</p>
      {error.digest ? <p className="mt-2 text-xs text-subtle">Référence : {error.digest}</p> : null}
      <div className="mt-8 flex justify-center gap-3">
        <Button onClick={reset}>Réessayer</Button>
        <ButtonLink href="/contact" variant="secondary">
          Contact
        </ButtonLink>
      </div>
    </div>
  );
}
