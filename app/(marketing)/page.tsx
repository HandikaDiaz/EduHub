import type { Metadata } from "next";
import { LandingNavbar } from "@/components/landing/Navbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { StatsSection } from "@/components/landing/StatsSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { PricingSection } from "@/components/landing/PricingSection";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { CTABannerSection } from "@/components/landing/CTABannerSection";
import { Footer } from "@/components/landing/Footer";
import { StructuredData } from "@/components/seo/StructuredData";

// Override default title — landing pakai full title (tanpa "%s | EduHub" template)
export const metadata: Metadata = {
  title: {
    absolute: "EduHub — Belajar Lebih Pintar, Lolos CPNS Lebih Cepat",
  },
  description:
    "Platform persiapan CPNS terlengkap dengan video materi, latihan soal, dan ujian simulasi. Kuasai TWK, TIU, dan TKP dengan ribuan soal terbaru. Mulai gratis, upgrade ke Pro Rp 199.000/tahun.",
  alternates: {
    canonical: "/",
  },
};

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#F0F9FF] font-sans">
      {/* JSON-LD structured data — Organization, WebSite, Course, FAQ */}
      <StructuredData includeCourse includeFaq />

      <LandingNavbar />
      <HeroSection />
      <StatsSection />
      <FeaturesSection />
      <HowItWorksSection />
      <PricingSection />
      <TestimonialsSection />
      <CTABannerSection />
      <Footer />
    </main>
  );
}
