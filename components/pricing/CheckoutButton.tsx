"use client";

import { useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { useAction, useConvexAuth } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { captureClientError } from "@/lib/sentry";

export interface CheckoutButtonProps {
  plan: "free" | "pro";
  amount?: number;
  variant?: "primary" | "secondary";
  /** Override label tombol. Default: "Coba Gratis 3 Hari" (pro) / "Mulai Gratis" (free). */
  label?: string;
  /** Called just before the Snap popup opens — use to close any parent dialog. */
  onBeforeSnap?: () => void;
  /** Called when Midtrans reports a successful or pending payment. */
  onPaymentSuccess?: (result: SnapResult) => void;
  /** Called when the Snap popup is closed by the user (without completing). */
  onSnapClose?: () => void;
}

declare global {
  interface Window {
    snap: {
      pay: (token: string, options: SnapOptions) => void;
    };
  }
}

interface SnapOptions {
  onSuccess?: (result: SnapResult) => void;
  onPending?: (result: SnapResult) => void;
  onError?: (result: SnapResult) => void;
  onClose?: () => void;
}

export interface SnapResult {
  transaction_status: string;
  order_id: string;
  status_code: string;
}

export function CheckoutButton({
  plan,
  amount,
  variant = "primary",
  label,
  onBeforeSnap,
  onPaymentSuccess,
  onSnapClose,
}: CheckoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useConvexAuth();
  const router = useRouter();
  const confirmTransaction = useAction(api.transactions.confirmMyTransaction);

  const handleCheckout = async () => {
    if (!isAuthenticated) {
      router.push("/sign-up");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/midtrans/create-transaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, amount: amount ?? 0 }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Gagal membuat transaksi");
      }

      const data = await response.json();

      // Close parent dialog before Snap opens (it will cover the full screen).
      onBeforeSnap?.();

      if (typeof window !== "undefined" && window.snap) {
        window.snap.pay(data.snapToken, {
          onSuccess: async (result) => {
            // Verifikasi server-to-server ke Midtrans Status API. Tier user
            // hanya naik ke "pro" setelah API confirm capture/settlement.
            // Webhook tetap berjalan paralel untuk redundansi.
            //
            // Beberapa metode pembayaran (CC dengan 3DS, e-wallet) butuh
            // jeda 1-3 detik antara Snap onSuccess dan settlement resmi.
            // Retry 3x dengan delay supaya tier benar-benar terupgrade
            // sebelum dialog "Berhasil" muncul.
            const RETRIES = 3;
            const DELAY_MS = 1500;
            let lastStatus = "unknown";
            let confirmed = false;

            try {
              for (let attempt = 0; attempt < RETRIES; attempt++) {
                const verified = await confirmTransaction({
                  orderId: result.order_id,
                });
                lastStatus = verified.status;
                if (verified.confirmed) {
                  confirmed = true;
                  break;
                }
                if (attempt < RETRIES - 1) {
                  await new Promise((r) => setTimeout(r, DELAY_MS));
                }
              }

              if (confirmed) {
                onPaymentSuccess?.(result);
              } else {
                // Status masih pending/challenge setelah retries — biarkan
                // webhook yang menyelesaikan. User bisa cek manual via /profil.
                setError(
                  `Pembayaran sedang diproses (status: ${lastStatus}). Tier Pro akan aktif otomatis dalam beberapa menit. Cek halaman Profil bila tidak update.`,
                );
                onSnapClose?.();
              }
            } catch (err) {
              captureClientError(err, {
                component: "CheckoutButton",
                phase: "verify",
                orderId: result.order_id,
              });
              setError(
                "Verifikasi pembayaran gagal. Cek halaman profil setelah beberapa saat.",
              );
              onSnapClose?.();
            }
          },
          onPending: () => {
            // Pending = belum lunas (mis. menunggu transfer bank). JANGAN
            // tampilkan dialog "Berhasil". Tutup Snap, biarkan user lanjutkan
            // pembayaran dari halaman profil. Webhook akan update saat lunas.
            setError(
              "Pembayaran belum selesai. Lanjutkan dari halaman profil bila perlu.",
            );
            onSnapClose?.();
          },
          onError: () => {
            setError("Pembayaran gagal. Silakan coba lagi.");
            onSnapClose?.();
          },
          onClose: () => {
            // User menutup popup tanpa menyelesaikan transaksi.
            onSnapClose?.();
          },
        });
      } else {
        // Snap.js not loaded yet — fallback to redirect.
        window.location.href = data.redirectUrl;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan";
      setError(msg);
      captureClientError(err, { component: "CheckoutButton", plan, amount });
    } finally {
      setIsLoading(false);
    }
  };

  const baseStyles =
    "group/btn flex items-center justify-center gap-2 w-full py-4 text-sm font-bold rounded-2xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed";

  const variantStyles = {
    primary:
      "bg-gradient-to-r from-purple-500 via-violet-500 to-purple-600 text-white shadow-lg shadow-purple-300/40 hover:shadow-xl hover:shadow-purple-300/50 hover:-translate-y-0.5",
    secondary:
      "text-sky-600 border-2 border-sky-300 hover:bg-sky-50 hover:border-sky-400",
  };

  return (
    <div className="w-full space-y-1.5">
      <button
        onClick={handleCheckout}
        disabled={isLoading}
        className={`${baseStyles} ${variantStyles[variant]}`}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Memproses...
          </>
        ) : (
          <>
            {label ?? (plan === "pro" ? "Coba Gratis 3 Hari" : "Mulai Gratis")}
            <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
          </>
        )}
      </button>
      {error && (
        <p className="text-xs text-red-500 text-center">{error}</p>
      )}
    </div>
  );
}
