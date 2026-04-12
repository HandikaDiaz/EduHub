"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/materi", label: "Materi" },
  { href: "/latihan", label: "Latihan" },
  { href: "/ujian", label: "Ujian Simulasi" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex w-64 flex-col border-r bg-white h-screen sticky top-0">
      <div className="p-6 border-b">
        <Link href="/dashboard" className="text-xl font-bold text-brand-sky">
          EduHub
        </Link>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`block rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              pathname === item.href
                ? "bg-brand-sky-bg text-brand-sky"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
