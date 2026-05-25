"use client";

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

export function CTABannerSection() {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-sky-500 via-blue-600 to-purple-600" />

      {/* Animated blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-64 h-64 rounded-full bg-white/10 blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full bg-purple-400/20 blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-0 w-40 h-40 rounded-full bg-sky-300/20 blur-2xl animate-pulse" style={{ animationDelay: "2s" }} />
      </div>

      {/* Dot grid */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `radial-gradient(circle, white 1px, transparent 1px)`,
          backgroundSize: "32px 32px",
        }}
      />

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Icon */}
        <div className="inline-flex w-16 h-16 rounded-3xl bg-white/20 backdrop-blur-md border border-white/30 items-center justify-center mb-6 shadow-xl">
          <Sparkles className="w-8 h-8 text-white" />
        </div>

        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight">
          Siap Lolos CPNS{" "}
          <span className="text-amber-300">Tahun Ini?</span>
        </h2>
        <p className="text-lg sm:text-xl text-sky-100 mb-10 max-w-2xl mx-auto leading-relaxed">
          Bergabung bersama 10.000+ pelajar yang sudah mempersiapkan diri dengan EduHub. Mulai gratis, tanpa kartu kredit.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/sign-up"
            className="group inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-bold text-sky-600 bg-white rounded-2xl shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
          >
            Mulai Belajar Sekarang — Gratis!
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Trust text */}
        <p className="text-sky-200 text-sm mt-6">
          ✓ Gratis selamanya &nbsp;•&nbsp; ✓ Tanpa kartu kredit &nbsp;•&nbsp; ✓ Batal kapan saja
        </p>
      </div>
    </section>
  );
}
