"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { WifiOff, RefreshCw, Home, CheckCircle2 } from "lucide-react";
import { EduhubLogo } from "@/components/brand/EduhubLogo";

// Note: client component tidak bisa export metadata. Page-level metadata
// untuk /offline kita set lewat layout — tapi karena offline jarang dilihat
// crawler, cukup judul tab dinamis lewat document.title side-effect.

/**
 * Halaman offline — ditampilkan saat:
 *   1. User navigate manual ke /offline (mis. dari banner)
 *   2. (Future) Service Worker fallback saat fetch gagal
 *
 * Component ini juga listen `online` event — saat koneksi balik, otomatis
 * tunjukkan tombol "Lanjut Belajar" + auto-reload setelah 1 detik kalau user
 * tidak klik manual.
 */
export default function OfflinePage() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    // Initial sync — `navigator.onLine` baru tersedia di client.
    setOnline(navigator.onLine);

    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  // Update title sesuai status biar terlihat di tab browser
  useEffect(() => {
    document.title = online
      ? "Koneksi Pulih | EduHub"
      : "Sedang Offline | EduHub";
  }, [online]);

  const handleRetry = () => window.location.reload();

  return (
    <main className="relative min-h-screen flex items-center justify-center px-4 py-12 overflow-hidden bg-[#F0F9FF]">
      {/* Decorative blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-gradient-to-br from-sky-200/60 to-purple-200/60 blur-3xl animate-pulse" />
        <div
          className="absolute bottom-0 -left-40 w-80 h-80 rounded-full bg-gradient-to-br from-purple-200/50 to-sky-200/50 blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />
      </div>

      <div className="relative z-10 w-full max-w-lg text-center space-y-6">
        {/* Brand logo di atas */}
        <Link href="/" className="inline-block" aria-label="EduHub — beranda">
          <EduhubLogo variant="icon" size={44} className="mx-auto" />
        </Link>

        {/* Icon hero */}
        <div className="relative mx-auto size-24 rounded-3xl bg-gradient-to-br from-sky-400 via-sky-500 to-purple-600 flex items-center justify-center shadow-lg shadow-sky-300/40">
          {online ? (
            <CheckCircle2 className="size-12 text-white" strokeWidth={2.5} />
          ) : (
            <WifiOff className="size-12 text-white" strokeWidth={2.5} />
          )}
          {/* Animated ping ring saat offline */}
          {!online && (
            <span className="absolute inset-0 rounded-3xl bg-sky-400 opacity-30 animate-ping" />
          )}
        </div>

        {/* Headline */}
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
            {online ? "Yes, koneksi pulih!" : "Hmm, sinyal lagi ngambek"}
          </h1>
          <p className="text-sm sm:text-base text-slate-500 max-w-md mx-auto leading-relaxed">
            {online
              ? "Internetmu sudah aktif kembali. Yuk lanjut belajar materi CPNS!"
              : "Sepertinya kamu sedang tidak terhubung internet. Cek wifi atau data kamu, lalu coba lagi."}
          </p>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          {online ? (
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-sky-500 via-sky-600 to-purple-600 text-white text-sm font-bold shadow-lg shadow-sky-300/40 hover:shadow-xl hover:shadow-purple-300/40 hover:-translate-y-0.5 transition-all duration-200"
            >
              <Home className="size-4" />
              Lanjut Belajar
            </Link>
          ) : (
            <button
              onClick={handleRetry}
              className="group inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-sky-500 via-sky-600 to-purple-600 text-white text-sm font-bold shadow-lg shadow-sky-300/40 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
            >
              <RefreshCw className="size-4 group-hover:rotate-180 transition-transform duration-500" />
              Coba Lagi
            </button>
          )}
        </div>

        {/* Tip saat offline */}
        {!online && (
          <div className="pt-4 max-w-md mx-auto">
            <div className="rounded-2xl bg-white/70 backdrop-blur-sm border border-slate-200 px-5 py-4 text-left space-y-2">
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                💡 Tips singkat
              </p>
              <ul className="text-xs text-slate-500 space-y-1 list-disc list-inside">
                <li>Cek mode pesawat di handphone kamu</li>
                <li>Pindah ke tempat dengan sinyal lebih kuat</li>
                <li>Restart router wifi kalau pakai wifi</li>
                <li>Halaman akan auto-reload saat sinyal balik</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
