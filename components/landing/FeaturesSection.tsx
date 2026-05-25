"use client";

import {
  Video,
  PenLine,
  FileText,
  MessageSquare,
  Clock,
  BarChart3,
} from "lucide-react";

const features = [
  {
    icon: Video,
    title: "Video Materi Interaktif",
    description: "Tonton ratusan video pembelajaran berkualitas tinggi dengan penjelasan mendalam dari instruktur berpengalaman.",
    gradient: "from-sky-400 to-cyan-500",
    bg: "hover:bg-sky-50",
    iconBg: "bg-sky-100 group-hover:bg-sky-200",
    iconColor: "text-sky-600",
  },
  {
    icon: PenLine,
    title: "Latihan Soal Harian",
    description: "Asah kemampuan dengan soal-soal terbaru yang diperbarui setiap hari, mencakup semua sub-tes CPNS.",
    gradient: "from-purple-400 to-violet-500",
    bg: "hover:bg-purple-50",
    iconBg: "bg-purple-100 group-hover:bg-purple-200",
    iconColor: "text-purple-600",
  },
  {
    icon: FileText,
    title: "Ujian Simulasi CPNS",
    description: "Rasakan pengalaman ujian sesungguhnya dengan simulasi SKD yang menyerupai format tes resmi.",
    gradient: "from-amber-400 to-orange-500",
    bg: "hover:bg-amber-50",
    iconBg: "bg-amber-100 group-hover:bg-amber-200",
    iconColor: "text-amber-600",
  },
  {
    icon: MessageSquare,
    title: "Pembahasan Soal Detail",
    description: "Setiap soal dilengkapi pembahasan lengkap dan terperinci agar kamu benar-benar paham konsepnya.",
    gradient: "from-emerald-400 to-teal-500",
    bg: "hover:bg-emerald-50",
    iconBg: "bg-emerald-100 group-hover:bg-emerald-200",
    iconColor: "text-emerald-600",
  },
  {
    icon: Clock,
    title: "Belajar Kapan Saja",
    description: "Akses semua materi 24/7 melalui web dan aplikasi. Belajar sesuai ritme dan jadwalmu sendiri.",
    gradient: "from-rose-400 to-pink-500",
    bg: "hover:bg-rose-50",
    iconBg: "bg-rose-100 group-hover:bg-rose-200",
    iconColor: "text-rose-600",
  },
  {
    icon: BarChart3,
    title: "Progress Tracking",
    description: "Pantau perkembangan belajarmu dengan dashboard analitik yang menampilkan skor, waktu belajar, dan area lemah.",
    gradient: "from-indigo-400 to-blue-500",
    bg: "hover:bg-indigo-50",
    iconBg: "bg-indigo-100 group-hover:bg-indigo-200",
    iconColor: "text-indigo-600",
  },
];

export function FeaturesSection() {
  return (
    <section id="materi" className="py-24 bg-[#F0F9FF] scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 bg-sky-100 border border-sky-200 text-sky-700 text-sm font-medium px-4 py-2 rounded-full mb-4">
            ✨ Fitur Unggulan
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
            Kenapa Pilih{" "}
            <span className="bg-gradient-to-r from-sky-500 to-purple-500 bg-clip-text text-transparent">
              EduHub?
            </span>
          </h2>
          <p className="text-lg text-slate-600">
            Semua yang kamu butuhkan untuk persiapan CPNS tersedia dalam satu platform terintegrasi.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <div
                key={i}
                className={`group relative bg-white rounded-3xl p-7 border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2 ${feature.bg} overflow-hidden cursor-pointer`}
              >
                {/* Gradient accent top border */}
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${feature.gradient} rounded-t-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

                {/* Decorative background blob */}
                <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full bg-gradient-to-br ${feature.gradient} opacity-5 group-hover:opacity-10 transition-opacity duration-300`} />

                <div className="relative z-10 space-y-4">
                  <div className={`inline-flex w-12 h-12 rounded-2xl ${feature.iconBg} items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:rotate-3`}>
                    <Icon className={`w-6 h-6 ${feature.iconColor}`} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">{feature.title}</h3>
                    <p className="text-slate-500 text-sm leading-relaxed">{feature.description}</p>
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
