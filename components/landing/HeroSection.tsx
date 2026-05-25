"use client";

import Link from "next/link";
import { ArrowRight, Play, BookOpen, Brain, Target, TrendingUp, Award, Zap } from "lucide-react";

const floatingCards = [
  { icon: BookOpen, label: "Video Materi", value: "500+", color: "from-sky-400 to-sky-600", delay: "0s" },
  { icon: Brain, label: "Ujian Simulasi", value: "CPNS", color: "from-purple-400 to-purple-600", delay: "0.5s" },
  { icon: Target, label: "Akurasi", value: "98%", color: "from-emerald-400 to-emerald-600", delay: "1s" },
  { icon: TrendingUp, label: "Lulus CPNS", value: "10K+", color: "from-amber-400 to-orange-500", delay: "1.5s" },
];

export function HeroSection() {
  return (
    <section
      id="beranda"
      className="relative min-h-screen flex items-center overflow-hidden bg-[#F0F9FF] pt-16 scroll-mt-20"
    >
      {/* Background gradient blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-gradient-to-br from-sky-200/60 to-purple-200/60 blur-3xl animate-pulse" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 rounded-full bg-gradient-to-br from-sky-300/40 to-blue-200/40 blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 rounded-full bg-gradient-to-br from-purple-200/50 to-pink-200/50 blur-3xl animate-pulse" style={{ animationDelay: "2s" }} />
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(#0EA5E9 1px, transparent 1px), linear-gradient(90deg, #0EA5E9 1px, transparent 1px)`,
            backgroundSize: "50px 50px",
          }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Text Content */}
          <div className="space-y-8 text-center lg:text-left">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-sky-100 border border-sky-200 text-sky-700 text-sm font-medium px-4 py-2 rounded-full">
              <Zap className="w-4 h-4 text-sky-500" />
              Platform CPNS #1 di Indonesia
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight text-slate-900">
              Belajar Lebih{" "}
              <span className="relative">
                <span className="bg-gradient-to-r from-sky-500 to-purple-500 bg-clip-text text-transparent">
                  Pintar
                </span>
                <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 8" fill="none">
                  <path d="M0 6 Q50 0 100 4 Q150 8 200 2" stroke="url(#underline-grad)" strokeWidth="3" strokeLinecap="round" fill="none" />
                  <defs>
                    <linearGradient id="underline-grad" x1="0" y1="0" x2="200" y2="0" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#0EA5E9" />
                      <stop offset="1" stopColor="#A855F7" />
                    </linearGradient>
                  </defs>
                </svg>
              </span>
              ,{" "}
              <br className="hidden sm:block" />
              Lolos Lebih{" "}
              <span className="bg-gradient-to-r from-purple-500 to-sky-500 bg-clip-text text-transparent">
                Cepat
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg text-slate-600 leading-relaxed max-w-xl mx-auto lg:mx-0">
              Platform persiapan CPNS terlengkap dengan video materi, latihan soal,
              dan ujian simulasi. Belajar kapan saja, di mana saja.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link
                href="/sign-up"
                className="group inline-flex items-center justify-center gap-2 px-7 py-4 text-base font-semibold text-white bg-gradient-to-r from-sky-500 to-sky-600 rounded-2xl shadow-lg shadow-sky-300/40 hover:shadow-sky-400/50 hover:-translate-y-1 transition-all duration-300"
              >
                Mulai Gratis
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="#materi"
                className="group inline-flex items-center justify-center gap-2 px-7 py-4 text-base font-semibold text-purple-600 border-2 border-purple-300 rounded-2xl hover:bg-purple-50 hover:border-purple-400 hover:-translate-y-1 transition-all duration-300"
              >
                <Play className="w-5 h-5 fill-purple-500 group-hover:scale-110 transition-transform" />
                Lihat Materi
              </Link>
            </div>

            {/* Social proof */}
            <div className="flex items-center gap-4 justify-center lg:justify-start">
              <div className="flex -space-x-3">
                {["🎓", "📚", "🏆", "⭐"].map((emoji, i) => (
                  <div
                    key={i}
                    className="w-9 h-9 rounded-full bg-gradient-to-br from-sky-100 to-purple-100 border-2 border-white flex items-center justify-center text-sm shadow-sm"
                  >
                    {emoji}
                  </div>
                ))}
              </div>
              <p className="text-sm text-slate-600">
                <span className="font-bold text-slate-900">10.000+</span> pengguna aktif
              </p>
            </div>
          </div>

          {/* Right: 3D Illustration */}
          <div className="relative flex items-center justify-center">
            {/* Main card */}
            <div className="relative w-full max-w-sm mx-auto">
              {/* Rotating ring */}
              <div className="absolute inset-8 rounded-full border-4 border-dashed border-sky-200 animate-[spin_20s_linear_infinite] opacity-60" />
              <div className="absolute inset-16 rounded-full border-2 border-dashed border-purple-200 animate-[spin_15s_linear_infinite_reverse] opacity-60" />

              {/* Central illustration card */}
              <div className="relative z-10 mx-12 my-12 bg-white rounded-3xl shadow-2xl shadow-sky-200/50 p-8 border border-sky-100">
                <div className="text-center space-y-4">
                  <div className="w-20 h-20 mx-auto bg-gradient-to-br from-sky-400 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg rotate-6 hover:rotate-0 transition-transform duration-500">
                    <Award className="w-10 h-10 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-widest font-medium">Target Kamu</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">Lolos CPNS 2025</p>
                  </div>
                  {/* Progress bar */}
                  <div className="space-y-2">
                    {[
                      { label: "TWK", pct: 85, color: "from-sky-400 to-sky-600" },
                      { label: "TIU", pct: 72, color: "from-purple-400 to-purple-600" },
                      { label: "TKP", pct: 91, color: "from-emerald-400 to-emerald-600" },
                    ].map((item) => (
                      <div key={item.label} className="space-y-1">
                        <div className="flex justify-between text-xs text-slate-500">
                          <span className="font-medium">{item.label}</span>
                          <span>{item.pct}%</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full bg-gradient-to-r ${item.color} rounded-full transition-all duration-1000`}
                            style={{ width: `${item.pct}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Floating stat cards */}
              {floatingCards.map((card, i) => {
                const positions = [
                  "absolute -top-4 -left-4",
                  "absolute -top-4 -right-4",
                  "absolute -bottom-4 -left-4",
                  "absolute -bottom-4 -right-4",
                ];
                const Icon = card.icon;
                return (
                  <div
                    key={i}
                    className={`${positions[i]} z-20 bg-white rounded-2xl shadow-lg shadow-slate-200/60 p-3 border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300`}
                    style={{ animation: `float 3s ease-in-out infinite`, animationDelay: card.delay }}
                  >
                    <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center mb-1`}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <p className="text-xs text-slate-400 leading-tight">{card.label}</p>
                    <p className="text-sm font-bold text-slate-800">{card.value}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Wave divider */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 60" fill="none" className="w-full">
          <path d="M0 60 L0 30 Q360 0 720 30 Q1080 60 1440 30 L1440 60 Z" fill="white" />
        </svg>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
      `}</style>
    </section>
  );
}
