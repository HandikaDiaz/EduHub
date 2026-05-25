import type { MetadataRoute } from "next";

const SITE_URL =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "https://eduhub.id";

/**
 * Sitemap statis — hanya halaman publik yang patut diindex.
 *
 * Halaman yang TIDAK masuk sini:
 *   - /sign-in, /sign-up, /sso-callback (auth flow, tidak unik konten)
 *   - /dashboard, /materi, /latihan, /ujian, /profil, /hasil (auth-required, konten dinamis user)
 *   - /admin/* (private)
 *
 * Anchor (#materi, #harga) di landing tidak butuh entri sendiri — search
 * engine akan menemukan via konten halaman utama.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    // Tambah landing pages SEO lain di sini di masa depan, mis:
    // {
    //   url: `${SITE_URL}/blog`,
    //   lastModified: now,
    //   changeFrequency: "weekly",
    //   priority: 0.7,
    // },
  ];
}
