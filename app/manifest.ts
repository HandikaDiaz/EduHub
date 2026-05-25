import type { MetadataRoute } from "next";

/**
 * Web App Manifest — supaya bisa "Install to Home Screen" di Android & iOS,
 * dan supaya browser tahu identitas brand (warna theme, nama short, dll).
 *
 * File `public/icon-192.png`, `public/icon-512.png`, `public/apple-touch-icon.png`
 * harus tersedia. Sementara belum ada, browser akan fallback ke favicon.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "EduHub — Persiapan CPNS",
    short_name: "EduHub",
    description:
      "Platform persiapan CPNS dengan video materi, latihan soal, dan ujian simulasi.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#F0F9FF",
    theme_color: "#0EA5E9",
    lang: "id-ID",
    dir: "ltr",
    categories: ["education", "productivity"],
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
