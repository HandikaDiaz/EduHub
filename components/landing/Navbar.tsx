"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { EduhubLogo } from "@/components/brand/EduhubLogo";

const navLinks = [
  { href: "#beranda", label: "Beranda" },
  { href: "#materi", label: "Materi" },
  { href: "#harga", label: "Harga" },
];

export function LandingNavbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleScroll = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string,
  ) => {
    if (!href.startsWith("#")) return;
    e.preventDefault();
    setMenuOpen(false);

    const targetId = href.substring(1);
    const elem = document.getElementById(targetId);
    if (!elem) return;

    // Hormati OS setting prefers-reduced-motion → scroll instan tanpa animasi.
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const HEADER_OFFSET = 80;
    const targetY =
      elem.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET;

    if (prefersReduced) {
      window.scrollTo({ top: targetY });
      window.history.pushState(null, "", href);
      return;
    }

    // Custom smooth scroll dengan easing cubic — lebih halus & kontrol durasi.
    const startY = window.scrollY;
    const distance = targetY - startY;
    const DURATION = 800; // ms
    // easeInOutCubic — slow start, cepat tengah, slow end. Natural untuk nav.
    const ease = (t: number) =>
      t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    let startTime: number | null = null;
    const step = (ts: number) => {
      if (startTime === null) startTime = ts;
      const elapsed = ts - startTime;
      const progress = Math.min(elapsed / DURATION, 1);
      window.scrollTo(0, startY + distance * ease(progress));
      if (progress < 1) requestAnimationFrame(step);
      else window.history.pushState(null, "", href);
    };
    requestAnimationFrame(step);
  };
   

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled
          ? "bg-white/95 backdrop-blur-md shadow-sm border-b border-sky-100"
          : "bg-transparent"
        }`}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <a
            href="#beranda"
            onClick={(e) => handleScroll(e, "#beranda")}
            className="flex items-center gap-2 group"
            aria-label="EduHub — kembali ke beranda"
          >
            <EduhubLogo
              variant="icon"
              size={36}
              priority
              className="group-hover:scale-105 transition-transform duration-300"
            />
            <span className="text-xl font-bold bg-gradient-to-r from-sky-500 to-purple-500 bg-clip-text text-transparent">
              EduHub
            </span>
          </a>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => handleScroll(e, link.href)}
                className="text-slate-700 font-medium text-sm hover:text-sky-500 transition-colors duration-200 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-sky-500 after:transition-all after:duration-300 hover:after:w-full"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/sign-in"
              className="px-4 py-2 text-sm font-semibold text-sky-600 border border-sky-300 rounded-lg hover:bg-sky-50 transition-all duration-200"
            >
              Masuk
            </Link>
            <Link
              href="/sign-up"
              className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-sky-500 to-sky-600 rounded-lg hover:from-sky-600 hover:to-sky-700 shadow-md hover:shadow-sky-300 transition-all duration-200 hover:-translate-y-0.5"
            >
              Daftar Gratis
            </Link>
          </div>

          {/* Mobile Hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 rounded-lg text-slate-700 hover:bg-sky-50 transition-colors"
            aria-label="Toggle menu"
          >
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${menuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
            }`}
        >
          <div className="pb-4 space-y-1 bg-white/95 backdrop-blur-md rounded-2xl mb-4 p-4 shadow-lg border border-sky-100">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => handleScroll(e, link.href)}
                className="block px-4 py-3 text-slate-700 font-medium rounded-xl hover:bg-sky-50 hover:text-sky-600 transition-colors duration-200"
              >
                {link.label}
              </a>
            ))}
            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
              <Link
                href="/sign-in"
                onClick={() => setMenuOpen(false)}
                className="px-4 py-3 text-center text-sm font-semibold text-sky-600 border border-sky-300 rounded-xl hover:bg-sky-50 transition-colors"
              >
                Masuk
              </Link>
              <Link
                href="/sign-up"
                onClick={() => setMenuOpen(false)}
                className="px-4 py-3 text-center text-sm font-semibold text-white bg-gradient-to-r from-sky-500 to-sky-600 rounded-xl hover:from-sky-600 hover:to-sky-700 transition-all"
              >
                Daftar Gratis
              </Link>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}
