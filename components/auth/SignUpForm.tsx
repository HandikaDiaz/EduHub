"use client";

import { useState } from "react";
import { useSignUp } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { GoogleOAuthButton } from "./GoogleOAuthButton";

type Step = "form" | "verify";

export function SignUpForm() {
  const { signUp } = useSignUp();
  const router = useRouter();

  const [step, setStep] = useState<Step>("form");

  // Step 1
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Step 2
  const [code, setCode] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ---- Step 1: create signup → kirim email code ----
  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password minimal 8 karakter.");
      return;
    }

    setLoading(true);
    try {
      const trimmed = name.trim();
      const firstName = trimmed.split(/\s+/)[0] ?? "";
      const lastName = trimmed.split(/\s+/).slice(1).join(" ") || undefined;

      const createRes = await signUp.create({
        emailAddress: email,
        password,
        username: name,
        firstName,
        lastName,
      });
      if (createRes.error) {
        setError(formatClerkError(createRes.error));
        return;
      }

      // Kirim email verification code
      const sendRes = await signUp.verifications.sendEmailCode();
      if (sendRes.error) {
        setError(formatClerkError(sendRes.error));
        return;
      }

      setStep("verify");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Gagal mendaftar";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // ---- Step 2: verify code → finalize session ----
  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const verifyRes = await signUp.verifications.verifyEmailCode({ code });
      if (verifyRes.error) {
        setError(formatClerkError(verifyRes.error));
        return;
      }

      if (signUp.status === "complete") {
        const finRes = await signUp.finalize();
        if (finRes.error) {
          setError(formatClerkError(finRes.error));
          return;
        }
        router.push("/dashboard");
      } else {
        setError("Verifikasi belum selesai. Silakan coba lagi.");
      }
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Kode salah / kedaluwarsa.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setError(null);
    try {
      const sendRes = await signUp.verifications.sendEmailCode();
      if (sendRes.error) {
        setError(formatClerkError(sendRes.error));
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Gagal kirim ulang kode";
      setError(msg);
    }
  };

  // ---- STEP 2: verify ----
  if (step === "verify") {
    return (
      <div className="space-y-5">
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <div className="size-14 rounded-2xl bg-gradient-to-br from-sky-100 to-purple-100 flex items-center justify-center">
            <ShieldCheck className="size-7 text-sky-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Verifikasi Email
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              Kami kirim kode 6 digit ke{" "}
              <span className="font-semibold text-slate-700">{email}</span>
            </p>
          </div>
        </div>

        <form onSubmit={handleVerifySubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 text-center">
              Kode Verifikasi
            </label>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="••••••"
              className="w-full text-center text-2xl font-mono font-bold tracking-[0.5em] py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-300 focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 transition-all"
              required
            />
          </div>

          {error && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 px-3 py-2.5 text-xs text-rose-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || code.length !== 6}
            className="group w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-gradient-to-r from-sky-500 via-sky-600 to-purple-600 text-white text-sm font-bold shadow-lg shadow-sky-300/40 hover:shadow-xl hover:shadow-purple-300/40 hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:transform-none"
          >
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Memverifikasi...
              </>
            ) : (
              <>
                Verifikasi & Masuk
                <ArrowRight className="size-4 group-hover:translate-x-0.5 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={() => setStep("form")}
            className="font-medium text-slate-500 hover:text-slate-700 transition-colors"
          >
            ← Ubah email
          </button>
          <button
            type="button"
            onClick={handleResendCode}
            className="font-medium text-sky-600 hover:text-sky-700 transition-colors"
          >
            Kirim ulang kode
          </button>
        </div>
      </div>
    );
  }

  // ---- STEP 1: form ----
  return (
    <div className="space-y-5">
      <GoogleOAuthButton mode="sign-up" />

      <div className="relative flex items-center gap-3">
        <div className="flex-1 h-px bg-slate-200" />
        <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">
          Atau
        </span>
        <div className="flex-1 h-px bg-slate-200" />
      </div>

      <form onSubmit={handleSignUpSubmit} className="space-y-4">
        <SignUpField
          label="Nama Lengkap"
          icon={User}
          type="text"
          placeholder="Nama lengkapmu"
          value={name}
          onChange={setName}
          autoComplete="name"
          required
        />
        <SignUpField
          label="Email"
          icon={Mail}
          type="email"
          placeholder="kamu@email.com"
          value={email}
          onChange={setEmail}
          autoComplete="email"
          required
        />
        <SignUpField
          label="Password"
          icon={Lock}
          type={showPassword ? "text" : "password"}
          placeholder="Minimal 8 karakter"
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
          required
          rightAccessory={
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="text-slate-400 hover:text-slate-600 transition-colors"
              aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
            >
              {showPassword ? (
                <EyeOff className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
            </button>
          }
        />

        {error && (
          <div className="rounded-xl bg-rose-50 border border-rose-200 px-3 py-2.5 text-xs text-rose-700">
            {error}
          </div>
        )}

        {/* Clerk CAPTCHA mount point */}
        <div id="clerk-captcha" />

        <button
          type="submit"
          disabled={loading}
          className="group w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-gradient-to-r from-sky-500 via-sky-600 to-purple-600 text-white text-sm font-bold shadow-lg shadow-sky-300/40 hover:shadow-xl hover:shadow-purple-300/40 hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:transform-none"
        >
          {loading ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Memproses...
            </>
          ) : (
            <>
              Daftar Gratis
              <ArrowRight className="size-4 group-hover:translate-x-0.5 transition-transform" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}

// ---------------------------------------------------------------------------

function SignUpField({
  label,
  icon: Icon,
  type,
  placeholder,
  value,
  onChange,
  autoComplete,
  required,
  rightAccessory,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  type: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
  required?: boolean;
  rightAccessory?: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold text-slate-700">
        {label}
      </label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 transition-all"
        />
        {rightAccessory && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {rightAccessory}
          </div>
        )}
      </div>
    </div>
  );
}

function formatClerkError(err: { message?: string; longMessage?: string }): string {
  return err.longMessage ?? err.message ?? "Terjadi kesalahan.";
}
