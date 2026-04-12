"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "./nav-items";

export function BottomNav() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/dashboard"
      ? pathname === href
      : pathname === href || pathname.startsWith(href + "/");

  return (
    <nav aria-label="Mobile navigation" className="fixed bottom-0 left-0 right-0 z-10 flex border-t bg-white md:hidden">
      {NAV_ITEMS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`flex flex-1 flex-col items-center py-3 text-xs font-medium transition-colors ${
            isActive(item.href) ? "text-brand-sky" : "text-gray-500"
          }`}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
