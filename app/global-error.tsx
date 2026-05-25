"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="id">
      <body>
        <div className="min-h-screen flex items-center justify-center bg-[#F0F9FF] px-4">
          <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-100 p-8 text-center space-y-6">
            <div className="inline-flex w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-400 to-pink-500 items-center justify-center mx-auto text-3xl">
              ⚠️
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 mb-2">
                Terjadi Kesalahan
              </h1>
              <p className="text-sm text-slate-500">
                Sistem kami sudah mencatat masalah ini. Tim teknis akan segera
                memeriksa. Silakan coba lagi.
              </p>
              {error.digest && (
                <p className="text-xs text-slate-400 mt-3 font-mono">
                  ID: {error.digest}
                </p>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={reset}
                className="flex-1 px-4 py-3 text-sm font-semibold text-white bg-gradient-to-r from-sky-500 to-sky-600 rounded-xl hover:opacity-90 transition-opacity"
              >
                Coba Lagi
              </button>
              <Link
                href="/"
                className="flex-1 px-4 py-3 text-sm font-semibold text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
              >
                Ke Beranda
              </Link>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
