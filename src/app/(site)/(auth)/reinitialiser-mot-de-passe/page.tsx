import type { Metadata } from "next";
import { Suspense } from "react";
import { ResetPageClient } from "@/components/auth/auth-pages";

export const metadata: Metadata = {
  title: "Nouveau mot de passe",
  description: "Choisissez un nouveau mot de passe.",
  alternates: { canonical: "/reinitialiser-mot-de-passe" },
  robots: { index: false, follow: true },
};

export default function Page() {
  return (
    <div className="surface p-6 sm:p-8">
      <h1 className="text-2xl font-bold tracking-tight">Choisir un nouveau mot de passe</h1>
      <p className="mt-2 mb-6 text-muted">Toutes vos autres sessions seront déconnectées.</p>
      <Suspense fallback={null}>
        <ResetPageClient />
      </Suspense>
    </div>
  );
}
