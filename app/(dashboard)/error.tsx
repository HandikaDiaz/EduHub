"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error, { tags: { boundary: "dashboard" } });
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-sm border border-slate-100 p-8 text-center space-y-6">
        <div className="inline-flex w-14 h-14 rounded-2xl bg-amber-100 items-center justify-center mx-auto">
          <AlertTriangle className="w-7 h-7 text-amber-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">
            Halaman Tidak Bisa Dimuat
          </h2>
          <p className="text-sm text-slate-500">
            Ada masalah saat memuat data dashboard. Coba refresh halaman atau
            kembali ke beranda.
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
            href="/dashboard"
            className="flex-1 px-4 py-3 text-sm font-semibold text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
          >
            Ke Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
