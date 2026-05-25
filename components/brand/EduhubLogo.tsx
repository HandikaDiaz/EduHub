import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Brand asset wrapper. Pakai 2 SVG di /public:
 *   - logo-only.svg     → ICON saja (e + play)
 *   - logo-eduhub.svg   → ICON + teks EDUHUB + tagline
 *
 * Pakai variant "icon" di tempat sempit (navbar, sidebar header, mobile bar)
 * dan "full" di hero/footer/brand panel/error pages.
 */

interface EduhubLogoProps {
  /** "icon" untuk e+play saja, "full" untuk versi lengkap dengan teks. */
  variant?: "icon" | "full";
  /** Tinggi dalam px. Lebar auto sesuai aspect ratio SVG. */
  size?: number;
  className?: string;
  /** Override aria-label kalau perlu (mis. tombol balik ke beranda). */
  alt?: string;
  /** Set true jika ini logo utama halaman (LCP image) — preload via priority. */
  priority?: boolean;
}

// Aspect ratio dari source SVG.
// logo-only.svg: kira-kira 1:1 (square — icon saja).
// logo-eduhub.svg: kira-kira 1:1 juga karena teks ada di bawah icon.
// Kalau aspect berubah karena update file, sesuaikan di sini.
const ASPECT = {
  icon: 1, // square
  full: 1, // square (icon di atas, teks di bawah)
} as const;

export function EduhubLogo({
  variant = "icon",
  size = 32,
  className,
  alt,
  priority = false,
}: EduhubLogoProps) {
  const src =
    variant === "icon" ? "/logo-only.svg" : "/logo-eduhub.svg";
  const width = Math.round(size * ASPECT[variant]);
  const ariaLabel =
    alt ?? (variant === "icon" ? "EduHub" : "EduHub — Learn, Connect, Grow");

  return (
    <Image
      src={src}
      alt={ariaLabel}
      width={width}
      height={size}
      priority={priority}
      className={cn("select-none", className)}
    />
  );
}
