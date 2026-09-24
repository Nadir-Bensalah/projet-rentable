import type { Metadata } from "next";
import { Suspense } from "react";
import { VerifyPageClient } from "@/components/auth/auth-pages";

export const metadata: Metadata = {
  title: "Confirmation de l'adresse e-mail",
  description: "Confirmation de votre adresse e-mail.",
  alternates: { canonical: "/verifier-email" },
  robots: { index: false, follow: true },
};

export default function Page() {
  return (
    <div className="surface p-6 sm:p-8">
      <h1 className="text-2xl font-bold tracking-tight">Confirmation de votre adresse</h1>
      <p className="mt-2 mb-6 text-muted">Un instant…</p>
      <Suspense fallback={null}>
        <VerifyPageClient />
      </Suspense>
    </div>
  );
}
