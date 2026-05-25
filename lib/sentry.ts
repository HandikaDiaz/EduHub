import * as Sentry from "@sentry/nextjs";

/**
 * Capture error dari Convex mutation/query/action.
 *
 * Convex jalan di runtime terpisah → Sentry tidak bisa instrument langsung.
 * Pakai helper ini di catch block komponen yang panggil useMutation/useAction
 * untuk korelasi error client → backend.
 */
export const captureConvexError = (
  err: unknown,
  context: Record<string, unknown> = {},
) => {
  if (process.env.NODE_ENV === "development") {
    console.error("[convex error]", err, context);
  }
  Sentry.captureException(err, {
    tags: { source: "convex" },
    extra: context,
  });
};

/**
 * Capture generic client-side error dengan context.
 * Wrapper untuk Sentry.captureException yang menambahkan source tag.
 */
export const captureClientError = (
  err: unknown,
  context: Record<string, unknown> = {},
) => {
  if (process.env.NODE_ENV === "development") {
    console.error("[client error]", err, context);
  }
  Sentry.captureException(err, {
    tags: { source: "client" },
    extra: context,
  });
};
