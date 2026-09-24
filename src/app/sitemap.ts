import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/config/site";
import { FORMAT_PAGES } from "@/content/formats";
import { GUIDES } from "@/content/guides";
import { LEGAL_PAGES } from "@/content/legal";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date("2026-09-24");
  const page = (path: string, priority: number, changeFrequency: "weekly" | "monthly" | "yearly" = "monthly", lastModified = now) => ({
    url: absoluteUrl(path),
    lastModified,
    changeFrequency,
    priority,
  });
  return [
    page("/", 1, "weekly"),
    page("/convertir", 0.9, "weekly"),
    page("/tarifs", 0.8),
    page("/cabinets-comptables", 0.8),
    page("/securite", 0.7),
    page("/comparatif", 0.6),
    page("/guides", 0.7, "weekly"),
    ...GUIDES.map((g) => page(`/guides/${g.slug}`, 0.7, "monthly", new Date(g.updated))),
    ...FORMAT_PAGES.map((f) => page(`/formats/${f.slug}`, 0.7)),
    page("/outils/verification-solde", 0.6),
    page("/outils/modele-rapprochement-bancaire", 0.6),
    page("/parrainage", 0.3),
    page("/contact", 0.3, "yearly"),
    page("/inscription", 0.3, "yearly"),
    page("/connexion", 0.2, "yearly"),
    ...LEGAL_PAGES.map((l) => page(`/${l.slug}`, 0.1, "yearly")),
  ];
}
