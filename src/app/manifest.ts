import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Relevéo — relevés bancaires PDF en Excel",
    short_name: "Relevéo",
    description: "Convertissez vos relevés bancaires PDF, vérifiés au centime, sans envoi de fichier.",
    start_url: "/convertir",
    display: "standalone",
    background_color: "#fbfbfd",
    theme_color: "#2547ea",
    lang: "fr",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
