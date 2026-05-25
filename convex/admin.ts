import { query } from "./_generated/server";
import { requireAdmin } from "./lib/auth";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export const getDashboardStats = query({
  args: {},
  handler: async (ctx) => { 
    await requireAdmin(ctx);

    const [users, modules, quizzes, questions, categories, attempts, transactions] =
      await Promise.all([
        ctx.db.query("users").collect(),
        ctx.db.query("modules").collect(),
        ctx.db.query("quizzes").collect(),
        ctx.db.query("questions").collect(),
        ctx.db.query("categories").collect(),
        ctx.db.query("attempts").collect(),
        ctx.db.query("transactions").collect(),
      ]);

    const activeUsers = users.filter((u) => !u.isDeleted);

    const tierCounts = activeUsers.reduce(
      (acc, u) => {
        acc[u.tier] = (acc[u.tier] ?? 0) + 1;
        return acc;
      },
      { free: 0, trial: 0, pro: 0 } as Record<"free" | "trial" | "pro", number>,
    );

    const adminCount = activeUsers.filter((u) => u.role === "admin").length;

    const passedCount = attempts.filter((a) => a.isPassed).length;
    const passRate =
      attempts.length > 0
        ? Math.round((passedCount / attempts.length) * 100)
        : 0;

    const successTransactions = transactions.filter((t) => t.status === "success");
    const pendingTransactions = transactions.filter((t) => t.status === "pending");
    const totalRevenue = successTransactions.reduce((s, t) => s + t.amount, 0);
    const now = Date.now();
    const last30DaysRevenue = successTransactions
      .filter((t) => (t.paidAt ?? t.createdAt) >= now - THIRTY_DAYS_MS)
      .reduce((s, t) => s + t.amount, 0);

    const userById = new Map(users.map((u) => [u._id, u]));

    const recentTransactions = [...transactions]
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 5)
      .map((t) => {
        const user = userById.get(t.userId);
        return {
          _id: t._id,
          orderId: t.midtransOrderId,
          amount: t.amount,
          status: t.status,
          paymentMethod: t.paymentMethod ?? null,
          createdAt: t.createdAt,
          userName: user?.name ?? "Pengguna",
          userEmail: user?.email ?? "",
        };
      });

    const quizById = new Map(quizzes.map((q) => [q._id, q]));

    const recentAttempts = [...attempts]
      .sort((a, b) => b.completedAt - a.completedAt)
      .slice(0, 5)
      .map((a) => {
        const user = userById.get(a.userId);
        const quiz = quizById.get(a.quizId);
        return {
          _id: a._id,
          userName: user?.name ?? "Pengguna",
          quizTitle: quiz?.title ?? "",
          score: a.score,
          isPassed: a.isPassed,
          completedAt: a.completedAt,
        };
      });

    return {
      users: {
        total: activeUsers.length,
        free: tierCounts.free,
        trial: tierCounts.trial,
        pro: tierCounts.pro,
        admin: adminCount,
      },
      content: {
        modules: modules.length,
        publishedModules: modules.filter((m) => m.isPublished).length,
        quizzes: quizzes.length,
        publishedQuizzes: quizzes.filter((q) => q.isPublished).length,
        questions: questions.length,
        categories: categories.length,
      },
      activity: {
        attempts: attempts.length,
        passedAttempts: passedCount,
        passRate,
      },
      revenue: {
        totalIDR: totalRevenue,
        successCount: successTransactions.length,
        pendingCount: pendingTransactions.length,
        last30DaysIDR: last30DaysRevenue,
      },
      recentTransactions,
      recentAttempts,
    };
  },
});
