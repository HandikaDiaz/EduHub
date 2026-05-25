// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://c09c61255e33d5fe19d99dcfd8016aab@o4510082944335872.ingest.us.sentry.io/4511279646769152",

  // Sample 10% transaksi di production. tracesSampleRate=1 (100%) burn quota
  // free tier (5k events/bulan) dalam < 1 hari. Naikkan ke 0.5+ saat debug.
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1,

  // Enable logs to be sent to Sentry
  enableLogs: true,

  // Enable sending user PII (Personally Identifiable Information)
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#sendDefaultPii
  sendDefaultPii: true,
});
