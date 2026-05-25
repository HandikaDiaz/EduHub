"use client";

import Link from "next/link";
import { type ReactNode } from "react";
import { AuthBrandPanel } from "./AuthBrandPanel";
import { EduhubLogo } from "@/components/brand/EduhubLogo";

interface AuthShellProps {
  /** Konten form (SignInForm / SignUpForm). */
  children: ReactNode;
  /** Heading di atas form, mis. "Selamat Datang Kembali". */
  title: string;
  /** Subtitle pendukung. */
  subtitle: string;
  /** Footer link (opsional) — mis. "Belum punya akun? Daftar". */
  footer?: ReactNode;
}

/**
 * Split layout — form di kiri, brand panel di kanan (lg+).
 * Mobile: brand panel disembunyikan, form full-width.
 */
export function AuthShell({
  children,
  title,
  subtitle,
  footer,
}: AuthShellProps) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_1fr]">
      {/* ---- LEFT — form ---- */}
      <div className="relative flex flex-col px-6 py-10 sm:px-12 lg:px-16 bg-[#F8FAFC]">
        {/* Decorative blobs untuk mobile (panel kanan tidak terlihat) */}
        <div className="lg:hidden absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -right-32 w-72 h-72 rounded-full bg-sky-200/40 blur-3xl" />
          <div className="absolute bottom-0 -left-32 w-72 h-72 rounded-full bg-purple-200/40 blur-3xl" />
        </div>

        {/* Top bar — logo + back to home */}
        <div className="relative z-10 flex items-center justify-between mb-12">
          <Link
            href="/"
            className="flex items-center gap-2 group"
            aria-label="EduHub — beranda"
          >
            <EduhubLogo variant="icon" size={36} />
            <span className="text-lg font-bold bg-gradient-to-r from-sky-500 to-purple-500 bg-clip-text text-transparent">
              EduHub
            </span>
          </Link>
          <Link
            href="/"
            className="text-xs font-medium text-slate-500 hover:text-slate-700 transition-colors"
          >
            ← Kembali ke beranda
          </Link>
        </div>

        {/* Form area — center vertically */}
        <div className="relative z-10 flex flex-1 items-center justify-center">
          <div className="w-full max-w-md space-y-6">
            <div className="space-y-1.5 text-center lg:text-left">
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                {title}
              </h1>
              <p className="text-sm text-slate-500">{subtitle}</p>
            </div>

            {children}

            {footer && (
              <p className="text-center text-sm text-slate-500 pt-4 border-t border-slate-200">
                {footer}
              </p>
            )}
          </div>
        </div>

        {/* Bottom — terms hint */}
        <div className="relative z-10 mt-10 text-center text-[11px] text-slate-400">
          Dengan masuk/mendaftar, kamu menyetujui{" "}
          Syarat Layanan
          dan{" "}
          Kebijakan Privasi
          EduHub.
        </div>
      </div>

      {/* ---- RIGHT — brand panel (hidden on mobile) ---- */}
      <AuthBrandPanel />
    </div>
  );
}
