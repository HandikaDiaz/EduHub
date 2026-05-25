import type { MutationCtx } from "../_generated/server";

/**
 * Sliding window rate limiter berbasis Convex DB.
 *
 * Pakai dari mutation/action — pass `ctx`, key (mis. clerkId), action name,
 * dan limit. Throw error jika limit terlampaui.
 *
 * Catatan: Ini fixed-window sederhana, bukan true sliding-window. Cukup untuk
 * proteksi anti-spam. Untuk traffic tinggi (>100 req/s) pakai Upstash atau
 * Redis-backed limiter karena Convex transaction conflict bisa terjadi pada
 * key yang sama saat racing.
 */
export async function checkRateLimit(
  ctx: MutationCtx,
  args: {
    key: string;
    action: string;
    /** Maks request per window. */
    limit: number;
    /** Window dalam milisecond. */
    windowMs: number;
  },
): Promise<void> {
  const now = Date.now();

  const existing = await ctx.db
    .query("rateLimits")
    .withIndex("by_key_action", (q) =>
      q.eq("key", args.key).eq("action", args.action),
    )
    .first();

  if (!existing) {
    await ctx.db.insert("rateLimits", {
      key: args.key,
      action: args.action,
      count: 1,
      windowStartedAt: now,
    });
    return;
  }

  const windowExpired = now - existing.windowStartedAt > args.windowMs;

  if (windowExpired) {
    // Reset window
    await ctx.db.patch(existing._id, {
      count: 1,
      windowStartedAt: now,
    });
    return;
  }

  if (existing.count >= args.limit) {
    const retryAfterMs =
      args.windowMs - (now - existing.windowStartedAt);
    throw new Error(
      `Rate limit exceeded. Coba lagi dalam ${Math.ceil(retryAfterMs / 1000)} detik.`,
    );
  }

  await ctx.db.patch(existing._id, { count: existing.count + 1 });
}
