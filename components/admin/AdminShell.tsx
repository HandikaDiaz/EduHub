"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { EduhubLogo } from "@/components/brand/EduhubLogo";
import { usePathname } from "next/navigation";
import { useClerk } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  LayoutDashboard,
  BookOpen,
  FileQuestion,
  PenLine,
  Users,
  CreditCard,
  Settings,
  LogOut,
  Menu,
  ArrowLeft,
  Loader2,
  type LucideIcon,
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const ADMIN_NAV: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/materi", label: "Manajemen Materi", icon: BookOpen },
  { href: "/admin/quiz", label: "Manajemen Quiz", icon: FileQuestion },
  { href: "/admin/latihan", label: "Manajemen Latihan", icon: PenLine },
  { href: "/admin/users", label: "Manajemen Users", icon: Users },
  { href: "/admin/transaksi", label: "Transaksi", icon: CreditCard },
  { href: "/admin/pengaturan", label: "Pengaturan", icon: Settings },
];

function NavLinks({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  const isActive = (href: string) =>
    href === "/admin" ? pathname === href : pathname.startsWith(href);

  return (
    <>
      {ADMIN_NAV.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-white/10 text-white"
                : "text-slate-400 hover:bg-white/5 hover:text-slate-200",
            )}
          >
            <Icon className="size-[18px] shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </>
  );
}

export function AdminShell({
  adminName,
  children,
}: {
  adminName: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const { signOut } = useClerk();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleSignOut = async () => {
    setIsLoggingOut(true);
    await signOut({ redirectUrl: "/" });
  };

  const sidebarFooter = (
    <div className="border-t border-slate-700/50 p-4">
      <div className="mb-3 flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-full bg-brand-sky/20 text-sm font-bold text-brand-sky">
          {adminName.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-slate-200">
            {adminName}
          </p>
          <p className="text-[11px] text-slate-500">Administrator</p>
        </div>
      </div>

      {/* Kembali ke dashboard user — admin tetap punya akun belajar */}
      <Button
        variant="ghost"
        className="w-full justify-start gap-2 text-slate-300 hover:bg-white/5 hover:text-brand-sky mb-1"
        render={
          <Link href="/dashboard" onClick={() => setSheetOpen(false)} />
        }
      >
        <ArrowLeft className="size-4" />
        Kembali ke Dashboard
      </Button>

      <Button
        variant="ghost"
        className="w-full justify-start gap-2 text-slate-400 hover:bg-white/5 hover:text-red-400"
        onClick={handleSignOut}
        disabled={isLoggingOut}
      >
        {isLoggingOut ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <LogOut className="size-4" />
        )}
        {isLoggingOut ? "Keluar..." : "Keluar"}
      </Button>
    </div>
  );

  return (
    <div className="flex min-h-screen admin-dark-scroll">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 flex-col bg-[#0F172A] h-screen sticky top-0 shrink-0">
        <div className="p-6 border-b border-slate-700/50">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 group"
            aria-label="EduHub Admin"
          >
            <EduhubLogo
              variant="icon"
              size={32}
              className="brightness-110"
            />
            <span className="text-lg font-bold text-white tracking-tight">
              EduHub{" "}
              <span className="text-brand-sky font-normal text-sm">
                Admin
              </span>
            </span>
          </Link>
        </div>
        <nav
          aria-label="Admin navigation"
          className="flex-1 p-3 space-y-0.5 overflow-y-auto"
        >
          <NavLinks pathname={pathname} />
        </nav>
        {sidebarFooter}
      </aside>

      {/* Main area */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Mobile header */}
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-slate-800 bg-[#0F172A] px-4 md:hidden">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-base font-bold text-white"
            aria-label="EduHub Admin"
          >
            <EduhubLogo variant="icon" size={26} className="brightness-110" />
            EduHub <span className="text-brand-sky text-sm font-normal">Admin</span>
          </Link>
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-slate-300 hover:bg-white/10 hover:text-white"
                />
              }
            >
              <Menu className="size-5" />
            </SheetTrigger>
            <SheetContent
              side="left"
              className="w-72 bg-[#0F172A] border-slate-700/50 p-0 admin-dark-scroll"
              showCloseButton={false}
            >
              <SheetTitle className="sr-only">Admin Navigation</SheetTitle>
              <div className="p-6 border-b border-slate-700/50">
                <span className="inline-flex items-center gap-2 text-lg font-bold text-white">
                  <EduhubLogo
                    variant="icon"
                    size={28}
                    className="brightness-110"
                  />
                  EduHub{" "}
                  <span className="text-brand-sky font-normal text-sm">
                    Admin
                  </span>
                </span>
              </div>
              <nav className="flex-1 p-3 space-y-0.5">
                <NavLinks
                  pathname={pathname}
                  onNavigate={() => setSheetOpen(false)}
                />
              </nav>
              {sidebarFooter}
            </SheetContent>
          </Sheet>
        </header>

        <main className="flex-1 bg-gray-950 text-white p-4 md:p-6 overflow-auto">
          {children}
        </main>
      </div>

      {/* Logout Overlay (Admin Dark Mode) */}
      {isLoggingOut && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-950/70 backdrop-blur-sm">
          <Loader2 className="size-8 animate-spin text-red-500 mb-3" />
          <p className="text-sm font-semibold text-slate-200 animate-pulse">Sedang keluar...</p>
        </div>
      )}
    </div>
  );
}
