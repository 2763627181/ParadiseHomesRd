import type { MetadataRoute } from "next";

import { env } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/dashboard", "/agent/dashboard", "/agency/dashboard", "/admin", "/login", "/register"],
      },
    ],
    sitemap: `${env.APP_URL.replace(/\/$/, "")}/sitemap.xml`,
    host: env.APP_URL,
  };
}
