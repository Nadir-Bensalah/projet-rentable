import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginPageClient } from "@/components/auth/auth-pages";

export const metadata: Metadata = {
  title: "Connexion",
  description: "Connectez-vous à votre compte Relevéo.",
  alternates: { canonical: "/connexion" },
  robots: { index: true, follow: true },
};

export default function Page() {
  return (
    <div className="surface p-6 sm:p-8">
      <h1 className="text-2xl font-bold tracking-tight">Connexion</h1>
      <p className="mt-2 mb-6 text-muted">Heureux de vous revoir.</p>
      <Suspense fallback={null}>
        <LoginPageClient />
      </Suspense>
    </div>
  );
}
