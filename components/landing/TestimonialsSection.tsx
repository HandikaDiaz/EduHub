"use client";

import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Aditya Pratama",
    role: "Lulus CPNS Kemenkeu 2024",
    avatar: "AP",
    avatarBg: "from-sky-400 to-cyan-500",
    quote:
      "EduHub benar-benar mengubah cara belajarku. Materi videonya jelas, soal-soalnya relevan, dan ujian simulasinya mirip banget sama CPNS beneran. Alhamdulillah lulus di percobaan pertama!",
    stars: 5,
  },
  {
    name: "Sari Dewi Rahayu",
    role: "Lulus CPNS Kemendikbud 2024",
    avatar: "SR",
    avatarBg: "from-purple-400 to-violet-500",
    quote:
      "Awalnya ragu mau investasi, tapi ternyata worth it banget. Progress tracking-nya membantu aku tahu bagian mana yang perlu diperkuat. Sekarang udah jadi PNS!",
    stars: 5,
  },
  {
    name: "Budi Santoso",
    role: "Lulus CPNS BKN 2024",
    avatar: "BS",
    avatarBg: "from-emerald-400 to-teal-500",
    quote:
      "Platform terbaik buat persiapan CPNS! Pembahasan soalnya detail banget, nggak cuma jawaban tapi juga penjelasan konsepnya. Sangat membantu untuk TIU yang biasanya susah.",
    stars: 5,
  },
];

export function TestimonialsSection() {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 bg-amber-100 border border-amber-200 text-amber-700 text-sm font-medium px-4 py-2 rounded-full mb-4">
            ⭐ Testimoni
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
            Kata Mereka yang{" "}
            <span className="bg-gradient-to-r from-sky-500 to-purple-500 bg-clip-text text-transparent">
              Sudah Lolos
            </span>
          </h2>
          <p className="text-lg text-slate-600">
            Ribuan pelajar telah berhasil lolos CPNS bersama EduHub. Ini cerita mereka.
          </p>
        </div>

        {/* Testimonial cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <div
              key={i}
              className="group relative bg-white rounded-3xl p-7 border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2 overflow-hidden"
            >
              {/* Background gradient decoration */}
              <div className={`absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br ${t.avatarBg} opacity-5 group-hover:opacity-10 transition-opacity duration-300`} />

              {/* Quote icon */}
              <div className="relative z-10">
                <Quote className="w-8 h-8 text-sky-200 mb-4 fill-sky-100" />

                {/* Stars */}
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.stars }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>

                {/* Quote */}
                <p className="text-slate-600 text-sm leading-relaxed mb-6 italic">
                  &ldquo;{t.quote}&rdquo;
                </p>

                {/* Avatar & name */}
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${t.avatarBg} flex items-center justify-center text-white font-bold text-sm shadow-md group-hover:scale-110 transition-transform duration-300`}>
                    {t.avatar}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-sm">{t.name}</p>
                    <p className="text-xs text-slate-400">{t.role}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Trust indicators */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-slate-400 text-sm">
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {["🎓", "👨‍💻", "👩‍🏫", "🏆"].map((e, i) => (
                <div key={i} className="w-7 h-7 rounded-full bg-gradient-to-br from-sky-100 to-purple-100 border-2 border-white flex items-center justify-center text-xs">
                  {e}
                </div>
              ))}
            </div>
            <span>10.000+ pengguna aktif</span>
          </div>
          <div className="flex items-center gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
            ))}
            <span>4.9/5 rating</span>
          </div>
        </div>
      </div>
    </section>
  );
}
