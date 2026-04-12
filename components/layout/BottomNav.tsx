"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "Home" },
  { href: "/materi", label: "Materi" },
  { href: "/latihan", label: "Latihan" },
  { href: "/ujian", label: "Ujian" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-10 flex border-t bg-white md:hidden">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`flex flex-1 flex-col items-center py-3 text-xs font-medium transition-colors ${
            pathname === item.href ? "text-brand-sky" : "text-gray-500"
          }`}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
