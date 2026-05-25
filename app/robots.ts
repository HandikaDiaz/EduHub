import type { MetadataRoute } from "next";

const SITE_URL =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "https://eduhub.id";

/**
 * Robots.txt — kontrol crawl untuk search engines.
 *
 * Yang di-allow: halaman marketing publik (landing).
 * Yang di-disallow: route auth, dashboard, admin, API, monitoring.
 * Crawler boleh resolve sitemap untuk menemukan halaman publik.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/monitoring", // Sentry tunnel route
          "/admin/",
          "/dashboard",
          "/materi",
          "/latihan",
          "/ujian",
          "/profil",
          "/hasil",
          "/sign-in",
          "/sign-up",
          "/sso-callback",
        ],
      },
      // Block AI scrapers yang umum agresif. Sesuaikan kalau mau.
      {
        userAgent: ["GPTBot", "ChatGPT-User", "CCBot", "anthropic-ai"],
        disallow: "/",
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
