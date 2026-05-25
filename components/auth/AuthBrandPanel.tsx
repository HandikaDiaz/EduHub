"use client";

import {
  Sparkles,
  Trophy,
  Users,
  BookOpen,
  Brain,
  type LucideIcon,
} from "lucide-react";
import { EduhubLogo } from "@/components/brand/EduhubLogo";

interface BrandStat {
  icon: LucideIcon;
  label: string;
  value: string;
  gradient: string;
}

const STATS: BrandStat[] = [
  {
    icon: BookOpen,
    label: "Video Materi",
    value: "500+",
    gradient: "from-sky-400 to-sky-600",
  },
  {
    icon: Brain,
    label: "Soal Latihan",
    value: "10.000+",
    gradient: "from-purple-400 to-violet-600",
  },
  {
    icon: Trophy,
    label: "Peserta Lolos",
    value: "10K+",
    gradient: "from-amber-400 to-orange-500",
  },
];

const TESTIMONIAL = {
  quote:
    "Tiga bulan belajar di EduHub langsung tembus passing grade SKD. Materinya lengkap, soalnya mirip ujian beneran.",
  author: "Rina Wijayanti",
  role: "Lolos CPNS Kemenkeu 2024",
};

export function AuthBrandPanel() {
  return (
    <div className="hidden lg:flex relative overflow-hidden bg-gradient-to-br from-sky-500 via-sky-600 to-purple-600 flex-col min-h-screen text-white">
      {/* Decorative blobs — match HeroSection */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-white/10 blur-3xl animate-pulse" />
        <div
          className="absolute bottom-1/4 -left-40 w-80 h-80 rounded-full bg-purple-400/30 blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />
        <div
          className="absolute top-1/3 right-1/4 w-64 h-64 rounded-full bg-sky-300/20 blur-3xl animate-pulse"
          style={{ animationDelay: "2s" }}
        />

        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              "linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      {/* Top — Logo */}
      <div className="relative z-10 p-12 pb-0">
        <div className="flex items-center gap-2.5">
          <EduhubLogo
            variant="icon"
            size={44}
            className="rounded-xl shadow-lg shadow-purple-900/20 ring-1 ring-white/20"
          />
          <span className="text-xl font-bold tracking-tight">EduHub</span>
        </div>
      </div>

      {/* Middle — Headline + Stats (selalu di tengah vertikal) */}
      <div className="relative z-10 flex-1 flex flex-col justify-center px-12 py-8">
        <div className="space-y-8 max-w-md">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/20 px-3 py-1 rounded-full text-xs font-semibold">
              <Sparkles className="size-3.5" />
              Platform CPNS #1 di Indonesia
            </div>
            <h2 className="text-4xl xl:text-5xl font-black leading-tight">
              Belajar Lebih Pintar,
              <br />
              <span className="text-white/90">Lolos Lebih Cepat.</span>
            </h2>
            <p className="text-white/80 text-base leading-relaxed">
              Bergabung bersama ribuan pejuang CPNS yang sudah meraih cita-cita
              jadi ASN.
            </p>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-3">
            {STATS.map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className="group relative bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-3 hover:bg-white/15 transition-all"
                >
                  <div
                    className={`w-8 h-8 rounded-lg bg-gradient-to-br ${stat.gradient} flex items-center justify-center mb-2 shadow-md`}
                  >
                    <Icon className="size-4 text-white" />
                  </div>
                  <p className="text-lg font-black tracking-tight">
                    {stat.value}
                  </p>
                  <p className="text-[11px] text-white/75 leading-tight">
                    {stat.label}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom — Testimonial (selalu di bawah) */}
      <div className="relative z-10 p-12 pt-0">
        <div className="max-w-md">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5 space-y-3">
            {/* Stars */}
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <span key={i} className="text-amber-300 text-sm">
                  ★
                </span>
              ))}
            </div>
            <p className="text-sm leading-relaxed text-white/90 italic">
              &ldquo;{TESTIMONIAL.quote}&rdquo;
            </p>
            <div className="flex items-center gap-2.5 pt-1">
              <div className="size-8 rounded-full bg-gradient-to-br from-amber-300 to-orange-400 flex items-center justify-center text-xs font-bold text-amber-950">
                {TESTIMONIAL.author
                  .split(" ")
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join("")}
              </div>
              <div>
                <p className="text-sm font-semibold leading-tight">
                  {TESTIMONIAL.author}
                </p>
                <p className="text-[11px] text-white/70 leading-tight inline-flex items-center gap-1">
                  <Users className="size-2.5" />
                  {TESTIMONIAL.role}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}