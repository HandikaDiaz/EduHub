// Seed script untuk demo data — kategori, modul, quiz, soal CPNS realistis.
//
// Cara menjalankan:
//   npx convex run seed:seedAll        # full reseed (idempotent — wipe+insert)
//   npx convex run seed:wipeAll        # wipe content tables saja
//
// Aman: pakai `internalMutation` (tidak callable dari client). Tidak menyentuh
// tabel users/transactions/attempts/videoProgress — data user dipertahankan.

import { internalMutation } from "./_generated/server";
import { CATEGORIES } from "./seed/categories";
import { MODULES } from "./seed/modules";
import type { Id } from "./_generated/dataModel";
import type { QuestionBank } from "./seed/types";

// Question banks per modul — di-import statis supaya bundle stabil.
import twkPancasila from "./seed/questions/twk_pancasila";
import twkUud1945 from "./seed/questions/twk_uud_1945";
import twkBhinneka from "./seed/questions/twk_bhinneka";
import twkNkri from "./seed/questions/twk_nkri";
import tiuVerbal from "./seed/questions/tiu_verbal";
import tiuNumerik from "./seed/questions/tiu_numerik";
import tiuFigural from "./seed/questions/tiu_figural";
import tiuLogika from "./seed/questions/tiu_logika";
import tkpPelayananPublik from "./seed/questions/tkp_pelayanan_publik";
import tkpJejaringKerja from "./seed/questions/tkp_jejaring_kerja";
import tkpSosialBudaya from "./seed/questions/tkp_sosial_budaya";

const QUESTION_BANKS: Record<string, QuestionBank> = {
  twk_pancasila: twkPancasila,
  twk_uud_1945: twkUud1945,
  twk_bhinneka: twkBhinneka,
  twk_nkri: twkNkri,
  tiu_verbal: tiuVerbal,
  tiu_numerik: tiuNumerik,
  tiu_figural: tiuFigural,
  tiu_logika: tiuLogika,
  tkp_pelayanan_publik: tkpPelayananPublik,
  tkp_jejaring_kerja: tkpJejaringKerja,
  tkp_sosial_budaya: tkpSosialBudaya,
};

// ---------------------------------------------------------------------------
// Wipe — hapus content tables dengan urutan FK yang aman.
// users, transactions, attempts, videoProgress TIDAK disentuh.
// ---------------------------------------------------------------------------

export const wipeAll = internalMutation({
  args: {},
  handler: async (ctx) => {
    const counts = { questions: 0, quizzes: 0, modules: 0, categories: 0 };

    const questions = await ctx.db.query("questions").collect();
    for (const q of questions) await ctx.db.delete(q._id);
    counts.questions = questions.length;

    const quizzes = await ctx.db.query("quizzes").collect();
    for (const q of quizzes) await ctx.db.delete(q._id);
    counts.quizzes = quizzes.length;

    const modules = await ctx.db.query("modules").collect();
    for (const m of modules) await ctx.db.delete(m._id);
    counts.modules = modules.length;

    const categories = await ctx.db.query("categories").collect();
    for (const c of categories) await ctx.db.delete(c._id);
    counts.categories = categories.length;

    return counts;
  },
});

// ---------------------------------------------------------------------------
// Seed — wipe lalu insert semua content.
// ---------------------------------------------------------------------------

export const seedAll = internalMutation({
  args: {},
  handler: async (ctx) => {
    // 1. Wipe content tables (idempotent).
    const questions = await ctx.db.query("questions").collect();
    for (const q of questions) await ctx.db.delete(q._id);
    const quizzes = await ctx.db.query("quizzes").collect();
    for (const q of quizzes) await ctx.db.delete(q._id);
    const modules = await ctx.db.query("modules").collect();
    for (const m of modules) await ctx.db.delete(m._id);
    const categories = await ctx.db.query("categories").collect();
    for (const c of categories) await ctx.db.delete(c._id);

    const now = Date.now();

    // 2. Insert categories.
    const categoryIdBySlug = new Map<string, Id<"categories">>();
    for (const cat of CATEGORIES) {
      const id = await ctx.db.insert("categories", {
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        color: cat.color,
        icon: cat.icon,
        order: cat.order,
      });
      categoryIdBySlug.set(cat.slug, id);
    }

    // 3. Insert modules + (per modul) 2 quizzes (latihan + ujian) + questions.
    let totalQuizzes = 0;
    let totalQuestions = 0;

    for (const mod of MODULES) {
      const categoryId = categoryIdBySlug.get(mod.categorySlug);
      if (!categoryId) {
        throw new Error(
          `Module ${mod.slug} references unknown category ${mod.categorySlug}`,
        );
      }

      const moduleId = await ctx.db.insert("modules", {
        categoryId,
        title: mod.title,
        slug: mod.slug,
        description: mod.description,
        videoUrl: mod.videoUrl,
        isFree: mod.isFree,
        isPublished: true,
        order: mod.order,
        createdAt: now,
      });

      const bank = QUESTION_BANKS[mod.questionsKey];
      if (!bank) {
        throw new Error(
          `Module ${mod.slug} references unknown question bank ${mod.questionsKey}`,
        );
      }

      // Latihan quiz: 15 menit, max = jumlah soal di bank.
      const latihanQuizId = await ctx.db.insert("quizzes", {
        moduleId,
        title: `Latihan — ${mod.title}`,
        type: "latihan",
        duration: 15,
        maxQuestions: bank.latihan.length,
        isPublished: true,
        createdAt: now,
      });
      totalQuizzes++;

      for (let i = 0; i < bank.latihan.length; i++) {
        const q = bank.latihan[i];
        await ctx.db.insert("questions", {
          quizId: latihanQuizId,
          question: q.question,
          optionA: q.optionA,
          optionB: q.optionB,
          optionC: q.optionC,
          optionD: q.optionD,
          optionE: q.optionE,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          order: i,
        });
        totalQuestions++;
      }

      // Ujian quiz: 60 menit.
      const ujianQuizId = await ctx.db.insert("quizzes", {
        moduleId,
        title: `Ujian — ${mod.title}`,
        type: "ujian",
        duration: 60,
        maxQuestions: bank.ujian.length,
        isPublished: true,
        createdAt: now,
      });
      totalQuizzes++;

      for (let i = 0; i < bank.ujian.length; i++) {
        const q = bank.ujian[i];
        await ctx.db.insert("questions", {
          quizId: ujianQuizId,
          question: q.question,
          optionA: q.optionA,
          optionB: q.optionB,
          optionC: q.optionC,
          optionD: q.optionD,
          optionE: q.optionE,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          order: i,
        });
        totalQuestions++;
      }
    }

    return {
      categories: CATEGORIES.length,
      modules: MODULES.length,
      quizzes: totalQuizzes,
      questions: totalQuestions,
    };
  },
});
