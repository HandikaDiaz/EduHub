"use client";

import Link from "next/link";
import { MessageCircle, Camera, PlayCircle, Briefcase } from "lucide-react";
import { EduhubLogo } from "@/components/brand/EduhubLogo";

const footerLinks = [
  {
    title: "Platform",
    links: [
      { label: "Tentang Kami", href: "#" },
      { label: "Materi", href: "#materi" },
      { label: "Harga", href: "#harga" },
      { label: "Kontak", href: "#" },
    ],
  },
  {
    title: "Materi CPNS",
    links: [
      { label: "TWK — Tes Wawasan Kebangsaan", href: "#" },
      { label: "TIU — Tes Intelegensia Umum", href: "#" },
      { label: "TKP — Tes Karakteristik Pribadi", href: "#" },
      { label: "Ujian Simulasi", href: "#" },
    ],
  },
  {
    title: "Dukungan",
    links: [
      { label: "FAQ", href: "#" },
      { label: "Kebijakan Privasi", href: "#" },
      { label: "Syarat & Ketentuan", href: "#" },
      { label: "Pusat Bantuan", href: "#" },
    ],
  },
];

const socials = [
  { icon: MessageCircle, label: "Twitter / X", href: "#" },
  { icon: Camera, label: "Instagram", href: "#" },
  { icon: PlayCircle, label: "YouTube", href: "#" },
  { icon: Briefcase, label: "LinkedIn", href: "#" },
];

export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main footer content */}
        <div className="pt-16 pb-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand column */}
          <div className="space-y-5">
            <Link
              href="#beranda"
              className="flex items-center gap-2 group w-fit"
              aria-label="EduHub — kembali ke beranda"
            >
              <EduhubLogo
                variant="icon"
                size={40}
                className="rounded-xl shadow-md"
              />
              <span className="text-xl font-bold bg-gradient-to-r from-sky-400 to-purple-400 bg-clip-text text-transparent">
                EduHub
              </span>
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed">
              Platform persiapan CPNS terlengkap dan terpercaya di Indonesia. Belajar lebih pintar, lolos lebih cepat.
            </p>
            {/* Social icons */}
            <div className="flex gap-3">
              {socials.map((s) => {
                const Icon = s.icon;
                return (
                  <Link
                    key={s.label}
                    href={s.href}
                    aria-label={s.label}
                    className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-sky-400 hover:border-sky-500 hover:bg-sky-900/30 transition-all duration-200"
                  >
                    <Icon className="w-4 h-4" />
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Link columns */}
          {footerLinks.map((col) => (
            <div key={col.title} className="space-y-4">
              <h4 className="text-white font-semibold text-sm">{col.title}</h4>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-slate-400 text-sm hover:text-sky-400 transition-colors duration-200"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-slate-800 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-slate-500 text-sm">
            © 2025 EduHub. All rights reserved.
          </p>
          <p className="text-slate-600 text-xs">
            Dibuat dengan ❤️ untuk para pejuang CPNS Indonesia
          </p>
        </div>
      </div>
    </footer>
  );
}
