import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ConvexClerkProvider } from "@/components/providers/ConvexClerkProvider";
import { OnlineStatusBanner } from "@/components/layout/OnlineStatusBanner";

const inter = Inter({ subsets: ["latin"] });

// ---------------------------------------------------------------------------
// SEO setup global
// ---------------------------------------------------------------------------

const SITE_URL =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
  "https://eduhub.id";

const SITE_NAME = "EduHub";
const SITE_DESCRIPTION =
  "Platform persiapan CPNS terlengkap dengan video materi, latihan soal, dan ujian simulasi. Kuasai TWK, TIU, dan TKP. Belajar kapan saja, di mana saja.";

export const metadata: Metadata = {
  // Anchor URL untuk semua relative URLs di metadata children (OG image, dll).
  metadataBase: new URL(SITE_URL),

  // Title template — child page bisa override atau pakai template "X | EduHub"
  title: {
    default: "EduHub — Belajar Lebih Pintar, Lolos CPNS Lebih Cepat",
    template: "%s | EduHub",
  },
  description: SITE_DESCRIPTION,

  applicationName: SITE_NAME,
  authors: [{ name: "EduHub Indonesia" }],
  creator: "EduHub Indonesia",
  publisher: "EduHub Indonesia",

  // Keywords utama — fokus CPNS Indonesia
  keywords: [
    "CPNS",
    "persiapan CPNS",
    "latihan soal CPNS",
    "ujian simulasi CPNS",
    "tryout CPNS online",
    "TWK",
    "Tes Wawasan Kebangsaan",
    "TIU",
    "Tes Intelegensi Umum",
    "TKP",
    "Tes Karakteristik Pribadi",
    "SKD CPNS",
    "Pancasila",
    "UUD 1945",
    "Bhinneka Tunggal Ika",
    "soal CPNS terbaru",
    "platform belajar CPNS",
    "ASN",
    "pegawai negeri sipil",
  ],
  category: "education",

  // Default robots — pages individual bisa override (mis. dashboard noindex)
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },

  // Open Graph (Facebook, LinkedIn, WhatsApp, dll)
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: "EduHub — Belajar Lebih Pintar, Lolos CPNS Lebih Cepat",
    description: SITE_DESCRIPTION,
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "EduHub — Platform Persiapan CPNS",
      },
    ],
  },

  // Twitter / X cards
  twitter: {
    card: "summary_large_image",
    title: "EduHub — Belajar Lebih Pintar, Lolos CPNS Lebih Cepat",
    description: SITE_DESCRIPTION,
    images: ["/og-image.png"],
  },

  // Canonical & alternates
  alternates: {
    canonical: SITE_URL,
    languages: {
      "id-ID": SITE_URL,
    },
  },

  // Icons — pakai logo-only.svg sebagai favicon utama supaya brand konsisten
  // di tab browser. Browser modern semua support SVG favicon. ICO fallback
  // tetap di public/favicon.ico untuk lawas.
  icons: {
    icon: [
      { url: "/logo-only.svg", type: "image/svg+xml" },
      { url: "/logo-only.svg", sizes: "any" },
    ],
    shortcut: "/logo-only.svg",
    apple: "/logo-only.svg",
  },

  // Manifest untuk install ke home screen / PWA
  manifest: "/manifest.webmanifest",

  // Search Console verification (kosong dulu — isi setelah daftar)
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION || undefined,
  },

  // Format detection — phone numbers di Indonesia jangan auto-link ke caller
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0EA5E9" },
    { media: "(prefers-color-scheme: dark)", color: "#0F172A" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <head />
      <body className={inter.className}>
        <OnlineStatusBanner />
        <ConvexClerkProvider>{children}</ConvexClerkProvider>
        {/*
          Midtrans Snap Script di-load HANYA di dashboard layout (lihat
          app/(dashboard)/layout.tsx) supaya URL sandbox vs production
          dipilih dinamis berdasarkan client key. Tidak perlu di root supaya
          marketing/auth pages tidak load script payment yang tidak dipakai.
        */}
      </body>
    </html>
  );
}
