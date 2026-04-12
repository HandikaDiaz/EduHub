import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-brand-sky-bg">
      <h1 className="text-4xl font-bold text-brand-sky mb-4">EduHub</h1>
      <p className="text-gray-600 mb-8 text-center max-w-sm">
        Platform persiapan ujian CPNS terlengkap. Kuasai TWK, TIU, dan TKP
        bersama kami.
      </p>
      <div className="flex gap-4">
        <Link
          href="/sign-up"
          className="rounded-md bg-brand-sky px-6 py-2 text-white font-medium hover:opacity-90 transition-opacity"
        >
          Mulai Gratis
        </Link>
        <Link
          href="/sign-in"
          className="rounded-md border border-brand-sky px-6 py-2 text-brand-sky font-medium hover:bg-white transition-colors"
        >
          Masuk
        </Link>
      </div>
    </div>
  );
}
