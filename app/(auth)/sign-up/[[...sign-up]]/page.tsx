import Link from "next/link";
import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/AuthShell";
import { SignUpForm } from "@/components/auth/SignUpForm";

export const metadata: Metadata = {
  title: "Daftar Gratis | EduHub",
  description: "Buat akun EduHub gratis dan mulai persiapan CPNS hari ini.",
};

export default function SignUpPage() {
  return (
    <AuthShell
      title="Mulai Belajar Gratis"
      subtitle="Buat akun untuk akses materi, latihan, dan ujian simulasi."
      footer={
        <>
          Sudah punya akun?{" "}
          <Link
            href="/sign-in"
            className="font-semibold text-sky-600 hover:text-sky-700 transition-colors"
          >
            Masuk di sini
          </Link>
        </>
      }
    >
      <SignUpForm />
    </AuthShell>
  );
}
