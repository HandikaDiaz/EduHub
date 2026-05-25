import {
  Flag,
  Brain,
  Users,
  BookOpen,
  Trophy,
  Sparkles,
  Layers,
  type LucideIcon,
} from "lucide-react";

// Map nama icon (string yang tersimpan di Convex `categories.icon`) ke
// komponen Lucide. Fallback `Layers` jika nama tidak dikenal — supaya
// kategori baru dari admin tetap render icon valid alih-alih teks mentah.
const CATEGORY_ICON_MAP: Record<string, LucideIcon> = {
  flag: Flag,
  brain: Brain,
  users: Users,
  book: BookOpen,
  bookopen: BookOpen,
  trophy: Trophy,
  sparkles: Sparkles,
};

export const resolveCategoryIcon = (
  name: string | undefined | null,
): LucideIcon => {
  if (!name) return Layers;
  return CATEGORY_ICON_MAP[name.toLowerCase().trim()] ?? Layers;
};
