import Link from "next/link";
import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/AuthShell";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Lupa Password | EduHub",
  description: "Reset password akun EduHub-mu.",
};

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Lupa Password?"
      subtitle="Masukkan emailmu dan kami akan mengirimkan kode reset."
      footer={
        <>
          Ingat passwordmu?{" "}
          <Link
            href="/sign-in"
            className="font-semibold text-sky-600 hover:text-sky-700 transition-colors"
          >
            Masuk di sini
          </Link>
        </>
      }
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
