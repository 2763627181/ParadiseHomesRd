import type { MetadataRoute } from "next";
import { SITE } from "@paradise/config";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE.name,
    short_name: SITE.shortName,
    description: SITE.description,
    start_url: "/",
    display: "standalone",
    background_color: SITE.themeColor.light,
    theme_color: SITE.themeColor.light,
    lang: "es-DO",
    categories: ["business", "lifestyle", "shopping"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Buscar propiedades", url: "/properties" },
      { name: "Proyectos", url: "/projects" },
      { name: "Favoritos", url: "/favorites" },
    ],
  };
}
