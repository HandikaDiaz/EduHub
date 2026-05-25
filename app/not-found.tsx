import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, BookOpen, Search } from "lucide-react";
import { EduhubLogo } from "@/components/brand/EduhubLogo";

export const metadata: Metadata = {
  title: "Halaman Tidak Ditemukan",
  description: "Halaman yang kamu cari tidak ditemukan di EduHub.",
  robots: { index: false, follow: false },
};

/**
 * 404 — halaman tidak ditemukan.
 * Server component (no client JS). Tone: ramah & memotivasi, gradient sky→purple.
 */
export default function NotFound() {
  return (
    <main className="relative min-h-screen flex items-center justify-center px-4 py-12 overflow-hidden bg-[#F0F9FF]">
      {/* Decorative blobs — match landing */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-gradient-to-br from-sky-200/60 to-purple-200/60 blur-3xl animate-pulse" />
        <div
          className="absolute top-1/2 -left-40 w-80 h-80 rounded-full bg-gradient-to-br from-sky-300/40 to-blue-200/40 blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />
        <div
          className="absolute bottom-0 right-1/4 w-64 h-64 rounded-full bg-gradient-to-br from-purple-200/50 to-pink-200/50 blur-3xl animate-pulse"
          style={{ animationDelay: "2s" }}
        />
      </div>

      <div className="relative z-10 w-full max-w-xl text-center space-y-7">
        {/* Brand logo — small at top untuk konteks branding */}
        <Link href="/" className="inline-block" aria-label="EduHub — beranda">
          <EduhubLogo variant="icon" size={48} className="mx-auto" />
        </Link>

        {/* Big 404 number with gradient */}
        <div className="relative inline-block">
          <div className="text-[120px] sm:text-[160px] font-black leading-none tracking-tighter bg-gradient-to-br from-sky-500 via-sky-600 to-purple-600 bg-clip-text text-transparent select-none">
            404
          </div>
          {/* Floating books decoration */}
          <div className="absolute -top-2 -right-4 text-4xl animate-bounce" style={{ animationDuration: "3s" }}>
            📚
          </div>
          <div
            className="absolute -bottom-2 -left-4 text-3xl animate-bounce"
            style={{ animationDuration: "3.5s", animationDelay: "0.5s" }}
          >
            🎓
          </div>
        </div>

        {/* Headline */}
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
            Hmm, halaman ini kabur ke ujian
          </h1>
          <p className="text-sm sm:text-base text-slate-500 max-w-md mx-auto leading-relaxed">
            Halaman yang kamu cari tidak ditemukan. Tapi tenang — kamu bisa
            balik ke beranda dan lanjut belajar untuk taklukkan CPNS!
          </p>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Link
            href="/"
            className="group inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-sky-500 via-sky-600 to-purple-600 text-white text-sm font-bold shadow-lg shadow-sky-300/40 hover:shadow-xl hover:shadow-purple-300/40 hover:-translate-y-0.5 transition-all duration-200"
          >
            <ArrowLeft className="size-4 group-hover:-translate-x-0.5 transition-transform" />
            Kembali ke Beranda
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl border-2 border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition-all"
          >
            <BookOpen className="size-4" />
            Lanjut Belajar
          </Link>
        </div>

        {/* Helper hint */}
        <div className="pt-4 border-t border-slate-200/70 max-w-md mx-auto">
          <p className="text-xs text-slate-400 inline-flex items-center gap-1.5">
            <Search className="size-3" />
            Salah ketik URL? Cek lagi dari{" "}
            <Link
              href="/"
              className="font-medium text-sky-600 hover:text-sky-700 transition-colors"
            >
              menu utama
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
