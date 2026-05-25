import {
  LayoutDashboard,
  BookOpen,
  PenLine,
  ClipboardList,
  BarChart3,
  UserCircle,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/materi", label: "Materi", icon: BookOpen },
  { href: "/latihan", label: "Latihan Soal", icon: PenLine },
  { href: "/ujian", label: "Ujian", icon: ClipboardList },
  { href: "/hasil", label: "Hasil Saya", icon: BarChart3 },
  { href: "/profil", label: "Profil", icon: UserCircle },
];
