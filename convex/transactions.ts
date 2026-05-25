import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import {
  query,
  mutation,
  action,
  internalMutation,
} from "./_generated/server";
import { internal } from "./_generated/api";
import { requireAdmin } from "./lib/auth";
import { checkRateLimit } from "./lib/rateLimit";

export const listTransactionsAdmin = query({
  args: {
    paginationOpts: paginationOptsValidator,
    filter: v.optional(
      v.object({
        status: v.optional(
          v.union(
            v.literal("pending"),
            v.literal("success"),
            v.literal("failed"),
            v.literal("expired"),
          ),
        ),
        fromDate: v.optional(v.number()),
        toDate: v.optional(v.number()),
      }),
    ),
  },
  handler: async (ctx, { paginationOpts, filter }) => {
    await requireAdmin(ctx);

    const result = await ctx.db
      .query("transactions")
      .order("desc")
      .paginate(paginationOpts);

    const filtered = result.page.filter((t) => {
      if (filter?.status && t.status !== filter.status) return false;
      if (filter?.fromDate && t.createdAt < filter.fromDate) return false;
      if (filter?.toDate && t.createdAt > filter.toDate) return false;
      return true;
    });

    const userIds = Array.from(new Set(filtered.map((t) => t.userId)));
    const users = await Promise.all(userIds.map((id) => ctx.db.get(id)));
    const userById = new Map(
      users.filter((u) => u !== null).map((u) => [u!._id, u!]),
    );

    const enriched = filtered.map((t) => {
      const user = userById.get(t.userId);
      return {
        _id: t._id,
        userId: t.userId,
        midtransOrderId: t.midtransOrderId,
        amount: t.amount,
        status: t.status,
        paymentMethod: t.paymentMethod ?? null,
        paidAt: t.paidAt ?? null,
        createdAt: t.createdAt,
        userName: user?.name ?? "Pengguna",
        userEmail: user?.email ?? "",
        userTier: user?.tier ?? null,
      };
    });

    return {
      page: enriched,
      isDone: result.isDone,
      continueCursor: result.continueCursor,
    };
  },
});

export const getTransactionStats = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const all = await ctx.db.query("transactions").collect();

    const byStatus = {
      pending: 0,
      success: 0,
      failed: 0,
      expired: 0,
    };
    let totalRevenue = 0;

    for (const t of all) {
      byStatus[t.status] += 1;
      if (t.status === "success") totalRevenue += t.amount;
    }

    return {
      total: all.length,
      byStatus,
      totalRevenue,
    };
  },
});

// ===========================================================================
// MUTATIONS - Payment & Trial Flow
// ===========================================================================

/**
 * Creates a new transaction record with pending status.
 * Called when user initiates payment from pricing page.
 */
export const createTransaction = mutation({
  args: {
    userId: v.id("users"),
    amount: v.number(),
    midtransOrderId: v.string(),
    snapToken: v.string(),
  },
  handler: async (ctx, args) => {
    // Rate limit: max 5 transaksi per 10 menit per user (anti-spam Midtrans
    // create order). User normal mestinya tidak retry > 5x dalam window ini.
    await checkRateLimit(ctx, {
      key: args.userId,
      action: "create-transaction",
      limit: 5,
      windowMs: 10 * 60 * 1000,
    });

    const transactionId = await ctx.db.insert("transactions", {
      userId: args.userId,
      midtransOrderId: args.midtransOrderId,
      amount: args.amount,
      status: "pending",
      snapToken: args.snapToken,
      createdAt: Date.now(),
    });

    return {
      transactionId,
      status: "pending" as const,
    };
  },
});

/**
 * Updates transaction status from Midtrans webhook notification.
 * Automatically upgrades user tier to "pro" if payment succeeds.
 */
export const updateTransactionStatus = mutation({
  args: {
    midtransOrderId: v.string(),
    status: v.union(
      v.literal("success"),
      v.literal("failed"),
      v.literal("expired"),
    ),
    paymentMethod: v.optional(v.string()),
    paidAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const transaction = await ctx.db
      .query("transactions")
      .withIndex("by_order_id", (q) =>
        q.eq("midtransOrderId", args.midtransOrderId),
      )
      .first();

    if (!transaction) {
      throw new Error(`Transaction not found: ${args.midtransOrderId}`);
    }

    await ctx.db.patch(transaction._id, {
      status: args.status,
      paymentMethod: args.paymentMethod,
      paidAt: args.paidAt,
    });

    // If payment successful, upgrade user tier to "pro"
    if (args.status === "success") {
      await ctx.db.patch(transaction.userId, {
        tier: "pro",
        proExpiredAt: Date.now() + 365 * 24 * 60 * 60 * 1000, // 1 year from now
      });
    }

    return { success: true };
  },
});

/**
 * Triggers 3-day trial for user's first payment attempt.
 * Called when user clicks "Coba Gratis 3 Hari" and is authenticated.
 * Sets tier to "trial" with trialExpiredAt = now + 3 days.
 */
export const triggerTrial = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);

    if (!user) {
      throw new Error("User tidak ditemukan");
    }

    if (user.trialUsed) {
      throw new Error("Trial sudah pernah digunakan");
    }

    await ctx.db.patch(args.userId, {
      tier: "trial",
      trialUsed: true,
      trialExpiredAt: Date.now() + 3 * 24 * 60 * 60 * 1000, // 3 days from now
    });

    return { success: true };
  },
});

/**
 * Triggers 3-day trial for the currently authenticated user.
 * Called from the upgrade dialog when user clicks the "Aktifkan Trial" CTA.
 * Returns { success: true } on activation, throws if trial already used.
 */
export const triggerMyTrial = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Anda harus login terlebih dahulu");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user || user.isDeleted) {
      throw new Error("User tidak ditemukan");
    }

    if (user.trialUsed) {
      throw new Error("Trial sudah pernah digunakan");
    }

    await ctx.db.patch(user._id, {
      tier: "trial",
      trialUsed: true,
      trialExpiredAt: Date.now() + 3 * 24 * 60 * 60 * 1000, // 3 days
    });

    return { success: true };
  },
});

/**
 * Returns snapToken for the most recent pending transaction owned by the
 * authenticated user. Used by the profile page to let users resume payment.
 */
export const getMyPendingSnapToken = query({
  args: { transactionId: v.id("transactions") },
  handler: async (ctx, { transactionId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user || user.isDeleted) return null;

    const tx = await ctx.db.get(transactionId);
    if (!tx) return null;
    if (tx.userId !== user._id) return null;
    if (tx.status !== "pending") return null;

    return { snapToken: tx.snapToken, orderId: tx.midtransOrderId };
  },
});

// ===========================================================================
// CLIENT-INITIATED VERIFICATION (independent of webhook)
// ===========================================================================

/**
 * Internal mutation — apply verified status from Midtrans Status API to a
 * transaction owned by the given clerkId. Owner check prevents users from
 * upgrading tier on someone else's transaction. Idempotent: skip if already
 * at target status.
 *
 * NOT exported as `mutation` — only callable via `confirmMyTransaction` action.
 */
export const _applyVerifiedStatus = internalMutation({
  args: {
    orderId: v.string(),
    clerkId: v.string(),
    status: v.union(
      v.literal("success"),
      v.literal("failed"),
      v.literal("expired"),
    ),
    paymentMethod: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const tx = await ctx.db
      .query("transactions")
      .withIndex("by_order_id", (q) => q.eq("midtransOrderId", args.orderId))
      .first();

    if (!tx) throw new Error(`Transaction not found: ${args.orderId}`);

    const user = await ctx.db.get(tx.userId);
    if (!user || user.clerkId !== args.clerkId) {
      throw new Error("Transaction tidak dimiliki user ini");
    }

    // Idempotent — skip if already settled at target.
    if (tx.status === args.status) {
      return { alreadyApplied: true, status: tx.status };
    }

    await ctx.db.patch(tx._id, {
      status: args.status,
      paymentMethod: args.paymentMethod ?? tx.paymentMethod,
      paidAt: args.status === "success" ? Date.now() : tx.paidAt,
    });

    if (args.status === "success") {
      await ctx.db.patch(user._id, {
        tier: "pro",
        proExpiredAt: Date.now() + 365 * 24 * 60 * 60 * 1000,
      });
    }

    return { applied: true, status: args.status };
  },
});

/**
 * Action — verifikasi status transaksi langsung ke Midtrans Status API,
 * lalu patch DB jika sudah lunas. Dipanggil dari frontend setelah Snap
 * `onSuccess` supaya tier user pasti naik ke pro tanpa harus menunggu
 * webhook (yang sering tidak masuk di local dev / sandbox).
 *
 * Server-to-server fetch pakai MIDTRANS_SERVER_KEY → tidak bisa di-spoof
 * dari sisi client.
 */
export const confirmMyTransaction = action({
  args: { orderId: v.string() },
  handler: async (
    ctx,
    { orderId },
  ): Promise<{ confirmed: boolean; status: string }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    if (!serverKey) throw new Error("MIDTRANS_SERVER_KEY not configured");

    const isProd = process.env.MIDTRANS_IS_PRODUCTION === "true";
    const baseUrl = isProd
      ? "https://api.midtrans.com"
      : "https://api.sandbox.midtrans.com";

    // Basic auth: base64(serverKey + ":") — pakai btoa karena V8 runtime.
    const auth = btoa(`${serverKey}:`);

    const res = await fetch(`${baseUrl}/v2/${orderId}/status`, {
      headers: {
        Authorization: `Basic ${auth}`,
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      throw new Error(`Midtrans status query failed: ${res.status}`);
    }

    const data = (await res.json()) as {
      transaction_status?: string;
      payment_type?: string;
      fraud_status?: string;
    };

    const txStatus = data.transaction_status ?? "unknown";

    // Map Midtrans status → status internal kita.
    let newStatus: "success" | "failed" | "expired" | null = null;
    if (txStatus === "capture" || txStatus === "settlement") {
      // capture + fraud_status=challenge → masih pending review, jangan auto-success.
      if (txStatus === "capture" && data.fraud_status === "challenge") {
        newStatus = null;
      } else {
        newStatus = "success";
      }
    } else if (txStatus === "deny" || txStatus === "cancel") {
      newStatus = "failed";
    } else if (txStatus === "expire") {
      newStatus = "expired";
    }

    if (!newStatus) {
      return { confirmed: false, status: txStatus };
    }

    await ctx.runMutation(internal.transactions._applyVerifiedStatus, {
      orderId,
      clerkId: identity.subject,
      status: newStatus,
      paymentMethod: data.payment_type,
    });

    return { confirmed: newStatus === "success", status: txStatus };
  },
});

/**
 * Gets user ID by Clerk ID for payment flow.
 */
export const getUserIdByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user || user.isDeleted) {
      return null;
    }

    return user._id;
  },
});
