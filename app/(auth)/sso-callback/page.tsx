"use client";

import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";

/**
 * Halaman tujuan saat user kembali dari OAuth provider (Google, dll).
 * Clerk akan menyelesaikan session lalu redirect ke `/dashboard` (atau ke
 * sign-up flow jika user baru).
 */
export default function SSOCallbackPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-sky-50 via-white to-purple-50">
      <div className="relative">
        <div className="size-14 rounded-full border-4 border-slate-100" />
        <div className="absolute inset-0 size-14 rounded-full border-4 border-transparent border-t-sky-500 border-r-purple-500 animate-spin" />
        <Loader2 className="absolute inset-0 m-auto size-5 text-sky-500 opacity-0" />
      </div>
      <div className="text-center space-y-1">
        <p className="text-sm font-semibold text-slate-700">
          Menyelesaikan login…
        </p>
        <p className="text-xs text-slate-400">
          Sebentar, kami sedang memverifikasi akun Google-mu.
        </p>
      </div>

      {/* Clerk handler — invisible, akan auto-redirect saat selesai */}
      <AuthenticateWithRedirectCallback
        signInForceRedirectUrl="/dashboard"
        signUpForceRedirectUrl="/dashboard"
      />
    </div>
  );
}
