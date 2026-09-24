import type { Metadata } from "next";
import { ConverterApp } from "@/components/converter/converter-app";

export const metadata: Metadata = {
  title: "Convertir un relevé bancaire PDF en Excel, CSV ou OFX",
  description:
    "Déposez votre relevé bancaire PDF : les opérations sont extraites dans votre navigateur, vérifiées au centime, puis exportées en Excel, CSV, OFX, QIF ou écritures comptables.",
  alternates: { canonical: "/convertir" },
};

export default function ConvertPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 pb-10 pt-8 sm:px-6 sm:pt-12">
      <div className="mb-8 max-w-3xl">
        <h1 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">Convertir un relevé bancaire PDF</h1>
        <p className="mt-3 text-pretty text-lg text-muted">
          Le fichier est lu par votre navigateur : il n&apos;est jamais envoyé. Chaque relevé est contrôlé au centime avant l&apos;export.
        </p>
      </div>
      <ConverterApp />
    </div>
  );
}
