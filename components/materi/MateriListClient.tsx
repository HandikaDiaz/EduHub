"use client";

import Link from "next/link";
import {
  ShieldCheck,
  Calculator,
  HeartHandshake,
  ChevronRight,
  BookOpen,
  Lock,
  CheckCircle2,
  type LucideIcon,
} from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Skeleton } from "@/components/ui/skeleton";
import { useUpgradeDialog } from "@/components/upgrade/useUpgradeDialog";

const ICON_BY_SLUG: Record<string, LucideIcon> = {
  twk: ShieldCheck,
  tiu: Calculator,
  tkp: HeartHandshake,
};

const COLOR_BY_SLUG: Record<
  string,
  { gradient: string; bg: string; border: string }
> = {
  twk: {
    gradient: "from-sky-500 to-cyan-500",
    bg: "from-sky-50 to-cyan-50",
    border: "border-sky-200",
  },
  tiu: {
    gradient: "from-purple-500 to-violet-500",
    bg: "from-purple-50 to-violet-50",
    border: "border-purple-200",
  },
  tkp: {
    gradient: "from-emerald-500 to-teal-500",
    bg: "from-emerald-50 to-teal-50",
    border: "border-emerald-200",
  },
};

const DEFAULT_COLOR = {
  gradient: "from-slate-500 to-slate-600",
  bg: "from-slate-50 to-slate-100",
  border: "border-slate-200",
};

export function MateriListClient() {
  const data = useQuery(api.materi.listCategoriesWithModules);
  const { openUpgradeDialog } = useUpgradeDialog();

  if (data === undefined) {
    return (
      <div className="min-h-screen bg-[#F8FAFC]">
        <PageHeader />
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-8 space-y-8">
          {[0, 1, 2].map((i) => (
            <Skeleton
              key={i}
              className="h-64 w-full rounded-3xl bg-slate-200/70"
            />
          ))}
        </div>
      </div>
    );
  }

  const { categories, userTier } = data;
  const isFreeUser = userTier === "free";

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <PageHeader />

      <div className="max-w-5xl mx-auto px-4 md:px-6 py-8 space-y-8">
        {categories.length === 0 ? (
          <div className="text-center py-20 text-slate-500">
            Belum ada materi. Silakan hubungi admin.
          </div>
        ) : (
          categories.map((cat) => {
            const Icon = ICON_BY_SLUG[cat.slug] ?? BookOpen;
            const color = COLOR_BY_SLUG[cat.slug] ?? DEFAULT_COLOR;
            const doneCount = cat.modules.filter((m) => m.isCompleted).length;
            const total = cat.modules.length;
            const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0;

            return (
              <div
                key={cat._id}
                id={cat.slug}
                className={`bg-gradient-to-br ${color.bg} border ${color.border} rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 scroll-mt-20`}
              >
                <div
                  className={`px-5 py-4 bg-gradient-to-r ${color.gradient} flex items-center justify-between`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-white font-bold text-lg leading-none">
                        {cat.name}
                      </p>
                      <p className="text-white/70 text-xs mt-0.5">
                        {cat.description}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-bold">{pct}%</p>
                    <p className="text-white/70 text-xs">
                      {doneCount}/{total} selesai
                    </p>
                  </div>
                </div>

                <div className="h-1.5 bg-white/40">
                  <div
                    className={`h-full bg-gradient-to-r ${color.gradient} transition-all duration-700`}
                    style={{ width: `${pct}%` }}
                  />
                </div>

                {cat.modules.length === 0 ? (
                  <div className="px-5 py-10 text-center text-slate-400 text-sm">
                    Belum ada materi di kategori ini.
                  </div>
                ) : (
                  <ul className="divide-y divide-white/60">
                    {cat.modules.map((m, i) => {
                      const locked = !m.isFree && isFreeUser;
                      return (
                        <li key={m._id}>
                          {locked ? (
                            <button
                              onClick={openUpgradeDialog}
                              className="w-full flex items-center gap-3 px-5 py-3.5 group hover:bg-white/50 transition-colors opacity-70 text-left"
                            >
                              <span
                                className={`text-xs font-bold w-6 h-6 rounded-lg flex items-center justify-center shrink-0 bg-gradient-to-br ${color.gradient} text-white opacity-30`}
                              >
                                {i + 1}
                              </span>
                              <span className="flex-1 text-sm font-medium text-slate-600">
                                {m.title}
                              </span>
                              <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-600 text-[10px] font-bold px-2 py-1 rounded-lg">
                                <Lock className="w-2.5 h-2.5" />
                                PRO
                              </span>
                            </button>
                          ) : (
                            <Link
                              href={`/materi/${cat.slug}/${m.slug}`}
                              className="flex items-center gap-3 px-5 py-3.5 group hover:bg-white/50 transition-colors"
                            >
                              <span
                                className={`text-xs font-bold w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                                  m.isCompleted
                                    ? "bg-emerald-500 text-white"
                                    : `bg-gradient-to-br ${color.gradient} text-white opacity-30`
                                }`}
                              >
                                {i + 1}
                              </span>
                              <span
                                className={`flex-1 text-sm font-medium ${
                                  m.isCompleted ? "text-slate-700" : "text-slate-600"
                                }`}
                              >
                                {m.title}
                              </span>
                              {m.isCompleted ? (
                                <span className="text-emerald-500 text-xs font-semibold inline-flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  Selesai
                                </span>
                              ) : (
                                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
                              )}
                            </Link>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function PageHeader() {
  return (
    <div className="bg-white border-b border-slate-100 px-4 md:px-6 py-5">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
          <BookOpen className="w-4 h-4" />
          <span>Semua Materi CPNS</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
          Pilih Materi Belajar
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Tiga kategori SKD CPNS — TWK, TIU, dan TKP
        </p>
      </div>
    </div>
  );
}
