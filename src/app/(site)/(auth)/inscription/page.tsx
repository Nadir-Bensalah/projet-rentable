import type { Metadata } from "next";
import { Suspense } from "react";
import { SignupPageClient } from "@/components/auth/auth-pages";

export const metadata: Metadata = {
  title: "Créer un compte gratuit",
  description: "Créez votre compte Relevéo gratuit : 15 pages de relevés bancaires converties chaque mois, sans carte bancaire.",
  alternates: { canonical: "/inscription" },
  robots: { index: false, follow: true },
};

export default function Page() {
  return (
    <div className="surface p-6 sm:p-8">
      <h1 className="text-2xl font-bold tracking-tight">Créer un compte gratuit</h1>
      <p className="mt-2 mb-6 text-muted">15 pages par mois, sans carte bancaire. Vos relevés restent sur votre appareil.</p>
      <Suspense fallback={null}>
        <SignupPageClient />
      </Suspense>
    </div>
  );
}
