"use client";
import { AuthShell } from "@/components/auth/AuthShell";
import { GoogleOAuthButton } from "@/components/auth/GoogleOAuthButton";
import { SignUpForm } from "@/components/auth/SignUpForm";
import { useSignUp } from "@clerk/nextjs";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  User,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Step = "form" | "verify";

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