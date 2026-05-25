import { type ReactNode } from "react";
import type { Metadata } from "next";

// Auth pages tidak menambahkan value SEO (form sign-in/up). Hindari indeks
// supaya tidak muncul di SERP dan menghabiskan crawl budget.
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
};

export default function AuthLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
