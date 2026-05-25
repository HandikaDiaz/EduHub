"use client";

import Link from "next/link";
import { Check, Zap, Star } from "lucide-react";

const freeFeatures = [
  "Akses sebagian materi TWK, TIU, TKP",
  "10 latihan soal per hari",
  "Pembahasan terbatas",
  "Dashboard progress dasar",
];

const proFeatures = [
  "Akses PENUH semua materi",
  "Latihan soal tanpa batas",
  "Ujian simulasi CPNS lengkap",
  "Pembahasan soal mendalam",
  "Progress tracking lanjutan",
  "Dukungan instruktur",
];

export function PricingSection() {
  return (
    <section id="harga" className="py-24 bg-[#F0F9FF] scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 bg-purple-100 border border-purple-200 text-purple-700 text-sm font-medium px-4 py-2 rounded-full mb-4">
            💎 Pilihan Paket
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
            Pilihan Paket{" "}
            <span className="bg-gradient-to-r from-sky-500 to-purple-500 bg-clip-text text-transparent">
              Belajar
            </span>
          </h2>
          <p className="text-lg text-slate-600">
            Mulai gratis, upgrade kapan saja. Tidak ada biaya tersembunyi.
          </p>
        </div>

        {/* Pricing cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* FREE */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2 flex flex-col">
            <div className="mb-6">
              <div className="inline-flex items-center gap-2 bg-slate-100 text-slate-600 text-sm font-semibold px-3 py-1.5 rounded-lg mb-4">
                <Zap className="w-4 h-4" />
                Gratis
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-slate-900">Rp 0</span>
                <span className="text-slate-400 text-sm">/selamanya</span>
              </div>
              <p className="text-slate-500 text-sm mt-2">Mulai tanpa biaya apapun</p>
            </div>

            <ul className="space-y-3 mb-8 flex-1">
              {freeFeatures.map((f, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-slate-500" />
                  </div>
                  <span className="text-slate-600 text-sm">{f}</span>
                </li>
              ))}
            </ul>

            <Link
              href="/sign-up"
              className="w-full py-3.5 text-center font-semibold text-slate-700 border-2 border-slate-200 rounded-2xl hover:border-slate-300 hover:bg-slate-50 transition-all duration-200"
            >
              Daftar Gratis
            </Link>
          </div>

          {/* PRO */}
          <div className="relative bg-white rounded-3xl p-8 flex flex-col hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 overflow-hidden">
            {/* Purple gradient border */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-sky-400 via-purple-500 to-violet-600 p-[2px]">
              <div className="absolute inset-[2px] bg-white rounded-[22px]" />
            </div>

            {/* Glow */}
            <div className="absolute -top-10 right-0 w-40 h-40 bg-gradient-to-br from-purple-400/20 to-sky-400/20 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10 flex flex-col h-full">
              {/* Badges */}
              <div className="flex flex-wrap gap-2 mb-4">
                <div className="inline-flex items-center gap-1 bg-gradient-to-r from-purple-500 to-violet-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-md">
                  <Star className="w-3.5 h-3.5 fill-white" />
                  Paling Populer
                </div>
                <div className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 text-xs font-bold px-3 py-1.5 rounded-lg border border-amber-200">
                  🎁 Coba Gratis 3 Hari
                </div>
              </div>

              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black bg-gradient-to-r from-sky-600 to-purple-600 bg-clip-text text-transparent">
                    Rp 199.000
                  </span>
                  <span className="text-slate-400 text-sm">/tahun</span>
                </div>
                <p className="text-slate-500 text-sm mt-2">
                  Hanya{" "}
                  <span className="font-semibold text-purple-600">Rp 16.583/bulan</span>
                </p>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {proFeatures.map((f, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-sky-400 to-purple-500 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-slate-700 text-sm font-medium">{f}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="/sign-up"
                className="w-full py-3.5 text-center font-bold text-white bg-gradient-to-r from-sky-500 via-purple-500 to-violet-600 rounded-2xl hover:opacity-90 hover:shadow-xl hover:shadow-purple-300/40 transition-all duration-200"
              >
                Mulai Gratis 3 Hari →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
