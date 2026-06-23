"use client";
import { AuthShell } from "@/components/auth/AuthShell";
import { SignUpForm } from "@/components/auth/SignUpForm";
import Link from "next/link";

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
      <SignUpForm/>
    </AuthShell>
  );
}