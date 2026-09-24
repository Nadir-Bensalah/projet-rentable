import type { Metadata } from "next";
import { PageHeader } from "@/components/marketing/page-header";
import { ContactForm } from "@/components/marketing/contact-form";

export const metadata: Metadata = {
  title: "Contact",
  description: "Une question sur Relevéo, un relevé mal lu, la facturation ou vos données personnelles ? Écrivez-nous.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <>
      <PageHeader
        title="Nous contacter"
        lead="Une question, un relevé mal lu, une demande pour votre cabinet ? Nous lisons tous les messages."
        breadcrumbs={[
          { href: "/", label: "Accueil" },
          { href: "/contact", label: "Contact" },
        ]}
      />
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <div className="surface p-6 sm:p-8">
          <ContactForm />
        </div>
      </div>
    </>
  );
}
