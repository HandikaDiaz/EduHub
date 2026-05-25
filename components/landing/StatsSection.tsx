"use client";

import { Users, BookMarked, LayoutGrid } from "lucide-react";

const stats = [
  {
    icon: Users,
    value: "10.000+",
    label: "Pengguna Aktif",
    description: "Pelajar yang sudah bergabung",
    gradient: "from-sky-400 to-sky-600",
    bg: "from-sky-50 to-sky-100/50",
    border: "border-sky-200",
    textColor: "text-sky-600",
  },
  {
    icon: BookMarked,
    value: "500+",
    label: "Soal Bank",
    description: "Soal latihan ter-update",
    gradient: "from-purple-400 to-purple-600",
    bg: "from-purple-50 to-purple-100/50",
    border: "border-purple-200",
    textColor: "text-purple-600",
  },
  {
    icon: LayoutGrid,
    value: "3 Kategori",
    label: "Ujian CPNS",
    description: "TWK · TIU · TKP",
    gradient: "from-emerald-400 to-teal-600",
    bg: "from-emerald-50 to-teal-100/50",
    border: "border-emerald-200",
    textColor: "text-emerald-600",
  },
];

export function StatsSection() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div
                key={i}
                className={`group relative bg-gradient-to-br ${stat.bg} border ${stat.border} rounded-3xl p-8 hover:shadow-xl hover:-translate-y-2 transition-all duration-300 overflow-hidden`}
              >
                {/* Background decoration */}
                <div className={`absolute -top-6 -right-6 w-24 h-24 rounded-full bg-gradient-to-br ${stat.gradient} opacity-10 group-hover:opacity-20 transition-opacity duration-300`} />
                <div className={`absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-gradient-to-br ${stat.gradient} opacity-5 group-hover:opacity-10 transition-opacity duration-300`} />

                <div className="relative z-10 flex flex-col items-center text-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <p className={`text-4xl font-bold ${stat.textColor} mb-1`}>{stat.value}</p>
                    <p className="text-lg font-semibold text-slate-800">{stat.label}</p>
                    <p className="text-sm text-slate-500 mt-1">{stat.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
