import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

// ---------------------------------------------------------------------------
// Content Security Policy
// ---------------------------------------------------------------------------
// Strategi: explicit allowlist per domain integrasi yang kita pakai.
//
// Catatan 'unsafe-inline' & 'unsafe-eval':
//   - 'unsafe-inline' di style-src: dipakai TailwindCSS + Next inline styles,
//     belum bisa dihindari tanpa nonce strategy (over-engineering).
//   - 'unsafe-eval' di script-src: dibutuhkan Clerk SDK + dev mode Next.js
//     (HMR). Untuk strict CSP, perlu set hanya di production + skip Clerk.
//   - 'unsafe-inline' di script-src: dibutuhkan untuk JSON-LD structured data
//     yang kita pakai untuk SEO (StructuredData component).
const cspDirectives = [
  "default-src 'self'",
  // Tambahkan https://clerk.eduspeed.id dan https://*.clerk.services
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.clerk.com https://*.clerk.accounts.dev https://clerk.eduspeed.id https://*.clerk.services https://challenges.cloudflare.com https://app.midtrans.com https://app.sandbox.midtrans.com https://*.vercel-analytics.com https://va.vercel-scripts.com",
  
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: blob: https://res.cloudinary.com https://lh3.googleusercontent.com https://img.clerk.com https://images.clerk.dev",
  
  // Tambahkan https://clerk.eduspeed.id dan https://*.clerk.services di connect-src
  "connect-src 'self' https://*.convex.cloud wss://*.convex.cloud https://*.clerk.com https://*.clerk.accounts.dev https://clerk.eduspeed.id https://*.clerk.services https://*.ingest.us.sentry.io https://*.ingest.sentry.io https://api.midtrans.com https://api.sandbox.midtrans.com",
  
  "frame-src 'self' https://*.clerk.com https://challenges.cloudflare.com https://app.midtrans.com https://app.sandbox.midtrans.com https://www.youtube.com https://www.youtube-nocookie.com",
  "media-src 'self' https://res.cloudinary.com",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

// HTTP security headers — defense in depth
const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: cspDirectives,
  },
  {
    // HSTS — paksa HTTPS untuk 2 tahun + subdomain + preload list
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    // Anti-clickjacking — tidak boleh di-iframe (juga sudah di CSP frame-ancestors)
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    // Browser MIME-sniffing protection
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    // Referrer minimal (origin saja, tanpa path) untuk privasi user
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    // Disable browser API yang tidak kita pakai
    key: "Permissions-Policy",
    value:
      "camera=(), microphone=(), geolocation=(), interest-cohort=(), payment=(self), usb=(), magnetometer=(), gyroscope=()",
  },
  {
    // Cross-origin isolation (anti-Spectre, optional tapi best practice)
    key: "Cross-Origin-Opener-Policy",
    value: "same-origin-allow-popups", // allow-popups supaya OAuth Clerk popup bisa
  },
];

const nextConfig: NextConfig = {
  // Allow remote image hosts. `<Image>` Next.js memvalidasi domain di build
  // time — kalau host tidak ada di sini, render image pasti error di prod.
  images: {
    remotePatterns: [
      // Cloudinary (storage gambar soal & pembahasan)
      { protocol: "https", hostname: "res.cloudinary.com" },
      // Google CDN (legacy GDrive thumbnail, kalau-kalau masih ada URL lama)
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      // Clerk avatar (user profile pictures)
      { protocol: "https", hostname: "img.clerk.com" },
      { protocol: "https", hostname: "images.clerk.dev" },
    ],
  },

  // Strip console.log/info/debug dari production bundle. console.error +
  // console.warn TETAP untuk Sentry capture & debugging issue produksi.
  compiler: {
    removeConsole:
      process.env.NODE_ENV === "production"
        ? { exclude: ["error", "warn"] }
        : false,
  },

  // React Strict Mode aktif — bantu cari double-effect bug di dev.
  reactStrictMode: true,

  // Buang HTTP header `X-Powered-By: Next.js` (security through obscurity).
  poweredByHeader: false,

  // Apply security headers ke SEMUA route (kecuali API webhook yang butuh
  // header Midtrans/Svix mereka).
  async headers() {
    return [
      {
        // Catch-all — semua path
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: "alexa-uz",

  project: "eduhub",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Uncomment to route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  // tunnelRoute: "/monitoring",

  webpack: {
    // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
    // See the following for more information:
    // https://docs.sentry.io/product/crons/
    // https://vercel.com/docs/cron-jobs
    automaticVercelMonitors: true,

    // Tree-shaking options for reducing bundle size
    treeshake: {
      // Automatically tree-shake Sentry logger statements to reduce bundle size
      removeDebugLogging: true,
    },
  }
});
