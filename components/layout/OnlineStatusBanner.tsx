"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { WifiOff, CheckCircle2 } from "lucide-react";

/**
 * Subscribe ke window online/offline events. `useSyncExternalStore` adalah
 * cara React-resmi untuk integrate dengan browser API yang punya event-based
 * state — tidak melanggar rule "no setState in effect" dan SSR-safe.
 */
const subscribeOnline = (callback: () => void) => {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
};
const getOnlineSnapshot = () => navigator.onLine;
const getServerSnapshot = () => true; // SSR: anggap online (tidak ada banner)

/**
 * Sticky banner di atas halaman saat user offline. Muncul instan begitu
 * koneksi putus, dan berubah jadi "Koneksi pulih" hijau (auto-hide 2 detik)
 * saat sinyal kembali.
 *
 * Mount sekali di root layout.
 */
export function OnlineStatusBanner() {
  const online = useSyncExternalStore(
    subscribeOnline,
    getOnlineSnapshot,
    getServerSnapshot,
  );
  const [showRecovered, setShowRecovered] = useState(false);

  // Track apakah user pernah offline di sesi ini, supaya banner "pulih"
  // tidak muncul saat first mount (yang juga online). Pakai useState dengan
  // updater functional di event handler bawaan useSyncExternalStore.
  const [hasBeenOffline, setHasBeenOffline] = useState(false);

  // Sync side-effect saat status berubah: trigger banner pulih + auto-hide.
  // setState di effect adalah pattern valid untuk derived UI state yang
  // tergantung pada external store transitions (offline→online).
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!online) {
      setHasBeenOffline(true);
      setShowRecovered(false);
      return;
    }
    // Online sekarang. Tunjukkan banner pulih kalau pernah offline.
    setShowRecovered(true);
    const t = window.setTimeout(() => setShowRecovered(false), 2000);
    return () => window.clearTimeout(t);
  }, [online]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Tidak render apa-apa kalau online & belum pernah offline (hindari banner
  // "pulih" muncul saat first mount), atau online & recover-banner sudah lewat.
  if (online && (!hasBeenOffline || !showRecovered)) return null;

  // Banner offline — sticky merah-amber
  if (!online) {
    return (
      <div
        role="alert"
        aria-live="polite"
        className="fixed top-0 inset-x-0 z-[100] bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg"
      >
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-center gap-2 text-sm font-semibold">
          <WifiOff className="size-4 shrink-0" />
          <span>
            Koneksi internet terputus.{" "}
            <span className="font-normal text-white/90 hidden sm:inline">
              Beberapa fitur mungkin tidak tersedia sementara.
            </span>
          </span>
        </div>
      </div>
    );
  }

  // Banner recovered — sticky hijau (otomatis hilang setelah 2 detik)
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-0 inset-x-0 z-[100] bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg animate-in fade-in slide-in-from-top duration-300"
    >
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-center gap-2 text-sm font-semibold">
        <CheckCircle2 className="size-4 shrink-0" />
        <span>Koneksi pulih, kamu sudah online lagi! 🎉</span>
      </div>
    </div>
  );
}
