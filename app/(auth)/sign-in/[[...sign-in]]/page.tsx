import Link from "next/link";
import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/AuthShell";
import { SignInForm } from "@/components/auth/SignInForm";

export const metadata: Metadata = {
  title: "Masuk | EduHub",
  description: "Masuk ke akun EduHub-mu untuk melanjutkan persiapan CPNS.",
};

export default function SignInPage() {
  return (
    <AuthShell
      title="Selamat Datang Kembali"
      subtitle="Lanjutkan perjalanan belajarmu menuju ASN."
      footer={
        <>
          Belum punya akun?{" "}
          <Link
            href="/sign-up"
            className="font-semibold text-sky-600 hover:text-sky-700 transition-colors"
          >
            Daftar gratis
          </Link>
        </>
      }
    >
      <SignInForm />
    </AuthShell>
  );
}
