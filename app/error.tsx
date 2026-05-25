"use client";

import { useEffect } from "react";
import Link from "next/link";
import * as Sentry from "@sentry/nextjs";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { EduhubLogo } from "@/components/brand/EduhubLogo";

/**
 * Root error boundary. Dipanggil saat ada uncaught error di tree app/* yang
 * tidak ditangkap boundary lebih lokal (mis. (dashboard)/error.tsx,
 * (quiz)/error.tsx).
 *
 * Untuk error di root layout itself → fallback ke `app/global-error.tsx`.
 */
export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error, { tags: { boundary: "root" } });
  }, [error]);

  return (
    <main className="relative min-h-screen flex items-center justify-center px-4 py-12 overflow-hidden bg-[#F0F9FF]">
      {/* Decorative blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-gradient-to-br from-rose-200/50 to-purple-200/50 blur-3xl animate-pulse" />
        <div
          className="absolute bottom-0 -left-40 w-80 h-80 rounded-full bg-gradient-to-br from-sky-200/40 to-purple-200/40 blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />
      </div>

      <div className="relative z-10 w-full max-w-lg">
        {/* Brand logo di atas card supaya tetap ada konteks brand */}
        <Link
          href="/"
          className="inline-block mx-auto mb-5 w-full text-center"
          aria-label="EduHub — beranda"
        >
          <EduhubLogo variant="icon" size={48} className="mx-auto" />
        </Link>

        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8 sm:p-10 space-y-6 text-center">
          {/* Icon hero */}
          <div className="relative mx-auto size-20 rounded-2xl bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 flex items-center justify-center shadow-lg shadow-amber-300/40">
            <AlertTriangle className="size-10 text-white" />
            <span className="absolute -top-2 -right-2 text-2xl animate-bounce" style={{ animationDuration: "2.5s" }}>
              😔
            </span>
          </div>

          {/* Headline */}
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
              Aduh, ada yang nyangkut
            </h1>
            <p className="text-sm sm:text-base text-slate-500 leading-relaxed">
              Sistem kami menemukan masalah di sisi server. Tim teknis sudah
              dapat notifikasi otomatis dan akan segera menanganinya.
            </p>
          </div>

          {/* Error digest — buat support kalau user lapor */}
          {error.digest && (
            <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3">
              <p className="text-[11px] uppercase font-semibold text-slate-400 tracking-wider mb-1">
                Kode Referensi
              </p>
              <p className="text-xs font-mono text-slate-700 break-all">
                {error.digest}
              </p>
            </div>
          )}

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={reset}
              className="group flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-sky-500 via-sky-600 to-purple-600 text-white text-sm font-bold shadow-lg shadow-sky-300/40 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
            >
              <RefreshCw className="size-4 group-hover:rotate-180 transition-transform duration-500" />
              Coba Lagi
            </button>
            <Link
              href="/"
              className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border-2 border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition-all"
            >
              <Home className="size-4" />
              Ke Beranda
            </Link>
          </div>
        </div>

        {/* Helper hint */}
        <p className="text-center text-xs text-slate-400 mt-5">
          Kalau masalah berlanjut, sertakan kode referensi saat menghubungi tim
          dukungan.
        </p>
      </div>
    </main>
  );
}
