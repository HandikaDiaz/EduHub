"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "./nav-items";
import { EduhubLogo } from "@/components/brand/EduhubLogo";

export function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/dashboard"
      ? pathname === href
      : pathname === href || pathname.startsWith(href + "/");

  return (
    <aside className="hidden md:flex w-64 flex-col border-r bg-white h-screen sticky top-0">
      <div className="p-6 border-b">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 group"
          aria-label="EduHub — ke dashboard"
        >
          <EduhubLogo variant="icon" size={32} />
          <span className="text-xl font-bold text-brand-sky">EduHub</span>
        </Link>
      </div>
      <nav aria-label="Sidebar navigation" className="flex-1 p-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-brand-sky-bg text-brand-sky"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <Icon className="size-[18px] shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
