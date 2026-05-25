import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";
import { BottomNav } from "@/components/layout/BottomNav";
import { UpgradeDialogProvider } from "@/components/upgrade/UpgradeDialogContext";
import Script from "next/script";
import { type ReactNode } from "react";
import type { Metadata } from "next";

// Dashboard auth-required + konten dinamis per user. Tidak boleh diindex
// supaya search engine tidak menampilkan halaman pribadi user.
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
};

const midtransClientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY ?? "";
const midtransScriptSrc = midtransClientKey.startsWith("SB-")
  ? "https://app.sandbox.midtrans.com/snap/snap.js"
  : "https://app.midtrans.com/snap/snap.js";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <UpgradeDialogProvider>
      <Script
        src={midtransScriptSrc}
        data-client-key={midtransClientKey}
        strategy="afterInteractive"
      />
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex flex-1 flex-col min-w-0">
          <Navbar />
          <main className="flex-1 p-6 pb-20 md:pb-6">{children}</main>
          <BottomNav />
        </div>
      </div>
    </UpgradeDialogProvider>
  );
}
