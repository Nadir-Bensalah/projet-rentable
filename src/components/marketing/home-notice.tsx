"use client";

import { useEffect, useState } from "react";
import { Alert } from "@/components/ui/alert";

/** One-off confirmations shown on the home page after a redirect (e.g. account deleted). */
export function HomeNotice() {
  const [notice, setNotice] = useState<string | null>(null);
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (p.get("compte") === "supprime") setNotice("Votre compte et ses données ont été supprimés. Un e-mail de confirmation vous a été envoyé.");
  }, []);
  if (!notice) return null;
  return (
    <div className="mx-auto max-w-6xl px-4 pt-6 sm:px-6">
      <Alert tone="success">{notice}</Alert>
    </div>
  );
}
