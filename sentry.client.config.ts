import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://c09c61255e33d5fe19d99dcfd8016aab@o4510082944335872.ingest.us.sentry.io/4511279646769152",

  // Performance Monitoring — sample 10% transaksi (hemat quota free tier 5k/bulan).
  tracesSampleRate: 0.1,

  // Session Replay — hanya record saat ada error (replaysOnErrorSampleRate: 1.0).
  // replaysSessionSampleRate: 0 → tidak ada baseline session record.
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 1.0,

  integrations: [
    Sentry.replayIntegration({
      maskAllText: false,
      blockAllMedia: false,
    }),
  ],

  // Environment tagging — bedakan dev/preview/prod di dashboard.
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.NODE_ENV,

  // Filter out development noise — di dev kita pakai console.error langsung.
  beforeSend(event) {
    if (process.env.NODE_ENV === "development") return null;
    return event;
  },
});
