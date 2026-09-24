import type { Metadata } from "next";
import { Suspense } from "react";
import { ForgotPageClient } from "@/components/auth/auth-pages";

export const metadata: Metadata = {
  title: "Mot de passe oublié",
  description: "Recevez un lien pour choisir un nouveau mot de passe.",
  alternates: { canonical: "/mot-de-passe-oublie" },
  robots: { index: false, follow: true },
};

export default function Page() {
  return (
    <div className="surface p-6 sm:p-8">
      <h1 className="text-2xl font-bold tracking-tight">Mot de passe oublié</h1>
      <p className="mt-2 mb-6 text-muted">Indiquez votre adresse : nous vous envoyons un lien de réinitialisation.</p>
      <Suspense fallback={null}>
        <ForgotPageClient />
      </Suspense>
    </div>
  );
}
