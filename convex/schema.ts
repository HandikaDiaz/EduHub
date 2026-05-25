import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
    role: v.union(v.literal("user"), v.literal("admin")),
    tier: v.union(v.literal("free"), v.literal("trial"), v.literal("pro")),
    trialUsed: v.boolean(),
    trialExpiredAt: v.optional(v.number()),
    proExpiredAt: v.optional(v.number()),
    isDeleted: v.boolean(),
    createdAt: v.number(),
  }).index("by_clerk_id", ["clerkId"]),

  categories: defineTable({
    name: v.string(),
    slug: v.string(),
    description: v.string(),
    color: v.string(),
    icon: v.string(),
    order: v.number(),
  }).index("by_slug", ["slug"]),

  modules: defineTable({
    categoryId: v.id("categories"),
    title: v.string(),
    slug: v.string(),
    description: v.string(),
    videoUrl: v.string(),
    isFree: v.boolean(),
    isPublished: v.boolean(),
    order: v.number(),
    createdAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_category", ["categoryId"])
    .index("by_published", ["isPublished"]),

  quizzes: defineTable({
    moduleId: v.id("modules"),
    title: v.string(),
    type: v.union(v.literal("latihan"), v.literal("ujian")),
    duration: v.number(),
    maxQuestions: v.number(),
    // Tier akses quiz — independen dari modul. Memungkinkan modul free
    // memiliki latihan yang locked untuk pro, dan sebaliknya.
    // Optional supaya backward-compatible saat migrasi; query default ke
    // isFree dari modul induk jika field ini absent.
    isFree: v.optional(v.boolean()),
    isPublished: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_module", ["moduleId"])
    .index("by_type", ["type"]),

  questions: defineTable({
    quizId: v.id("quizzes"),
    question: v.string(),
    // Gambar di teks soal (mis. soal figural TIU, simbol negara TWK).
    // Disimpan di Cloudinary sebagai WebP, URL publik.
    imageUrl: v.optional(v.string()),

    // -----------------------------------------------------------------
    // Tipe soal — discriminator. Default "single" (backward-compat).
    //   "single"           : pilihan ganda klasik, 1 jawaban benar (A-E)
    //   "multiple"         : pilihan ganda kompleks, beberapa jawaban benar
    //   "truefalse_table"  : tabel pernyataan dengan kolom centang B / S
    // -----------------------------------------------------------------
    type: v.optional(
      v.union(
        v.literal("single"),
        v.literal("multiple"),
        v.literal("truefalse_table"),
      ),
    ),

    // ---- single & multiple ----
    // Optional supaya tipe truefalse_table tidak wajib mengisi A-E.
    optionA: v.optional(v.string()),
    optionB: v.optional(v.string()),
    optionC: v.optional(v.string()),
    optionD: v.optional(v.string()),
    optionE: v.optional(v.string()),

    // Tipe "single" → 1 huruf jawaban benar
    correctAnswer: v.optional(
      v.union(
        v.literal("A"),
        v.literal("B"),
        v.literal("C"),
        v.literal("D"),
        v.literal("E"),
      ),
    ),
    // Tipe "multiple" → array huruf jawaban benar (≥ 1 item)
    correctAnswers: v.optional(
      v.array(
        v.union(
          v.literal("A"),
          v.literal("B"),
          v.literal("C"),
          v.literal("D"),
          v.literal("E"),
        ),
      ),
    ),

    // ---- truefalse_table ----
    // Array 3-10 pernyataan, masing-masing punya kunci jawaban B/S.
    statements: v.optional(
      v.array(
        v.object({
          text: v.string(),
          isTrue: v.boolean(),
        }),
      ),
    ),

    explanation: v.string(),
    explanationImageUrl: v.optional(v.string()),
    explanationVideoUrl: v.optional(v.string()),
    order: v.number(),
  }).index("by_quiz", ["quizId"]),

  attempts: defineTable({
    userId: v.id("users"),
    quizId: v.id("quizzes"),
    // Jawaban per soal — bentuk berbeda tergantung tipe pertanyaan:
    //   single           → chosen: "A".."E" (atau "" jika tidak dijawab)
    //   multiple         → chosens: ["A","C"] (urutan tidak penting)
    //   truefalse_table  → chosenStatements: [true, false, ...]
    //                       (per index pernyataan; missing index = unanswered)
    // chosen wajib ada untuk backward-compat. Field lain optional.
    answers: v.array(
      v.object({
        questionId: v.id("questions"),
        chosen: v.string(),
        chosens: v.optional(v.array(v.string())),
        chosenStatements: v.optional(v.array(v.boolean())),
      }),
    ),
    score: v.number(),
    totalCorrect: v.number(),
    totalWrong: v.number(),
    totalUnanswered: v.number(),
    timeTaken: v.number(),
    isPassed: v.boolean(),
    completedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_quiz", ["quizId"]),

  videoProgress: defineTable({
    userId: v.id("users"),
    moduleId: v.id("modules"),
    isCompleted: v.boolean(),
    watchedAt: v.number(),
  }).index("by_user_module", ["userId", "moduleId"]),

  transactions: defineTable({
    userId: v.id("users"),
    midtransOrderId: v.string(),
    amount: v.number(),
    status: v.union(
      v.literal("pending"),
      v.literal("success"),
      v.literal("failed"),
      v.literal("expired"),
    ),
    paymentMethod: v.optional(v.string()),
    snapToken: v.optional(v.string()),
    paidAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_order_id", ["midtransOrderId"])
    .index("by_user", ["userId"]),

  settings: defineTable({
    key: v.union(
      v.literal("platform"),
      v.literal("content"),
      v.literal("payment"),
    ),
    value: v.string(),
    updatedAt: v.number(),
    updatedBy: v.id("users"),
  }).index("by_key", ["key"]),

  /**
   * Rate limit counters — sliding window per (key, action).
   * `key` biasanya `clerkId` atau `ip:1.2.3.4` untuk anonymous.
   * `count` = jumlah request di window saat ini.
   * `windowStartedAt` = epoch start window. Setelah window habis, di-reset.
   *
   * Cleanup: dokumen lama dihapus saat counter di-touch dan window-nya sudah
   * lewat. Tidak perlu cron — self-cleaning per akses.
   */
  rateLimits: defineTable({
    key: v.string(),
    action: v.string(),
    count: v.number(),
    windowStartedAt: v.number(),
  }).index("by_key_action", ["key", "action"]),
});
