"use client";

import { useState } from "react";
import { useSignIn, useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff, Loader2, ArrowRight, ShieldCheck } from "lucide-react";

type Step = "request" | "verify" | "reset";

export function ForgotPasswordForm() {
  const { signIn, fetchStatus } = useSignIn();
  const { isLoaded } = useAuth(); // ✅ Untuk cek Clerk sudah siap
  const router = useRouter();

  const [step, setStep] = useState<Step>("request");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ Loading state global Clerk
  if (!isLoaded) return null;

  // ✅ Loading state dari fetchStatus
  const isFetching = fetchStatus === "fetching";

  // ---- STEP 1: Request reset code ----
  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error: createError } = await signIn.create({ identifier: email });
      if (createError) throw createError;

      const { error: sendError } = await signIn.resetPasswordEmailCode.sendCode();
      if (sendError) throw sendError;

      setStep("verify");
    } catch (err: any) {
      setError(formatClerkError(err));
    } finally {
      setLoading(false);
    }
  };

  // ---- STEP 2: Verify code ----
  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error } = await signIn.resetPasswordEmailCode.verifyCode({ code });
      if (error) throw error;

      setStep("reset");
    } catch (err: any) {
      setError(formatClerkError(err));
    } finally {
      setLoading(false);
    }
  };

  // ---- STEP 3: Submit new password ----
  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password minimal 8 karakter.");
      return;
    }

    setLoading(true);

    try {
      const { error: submitError } = await signIn.resetPasswordEmailCode.submitPassword({
        password,
        signOutOfOtherSessions: true,
      });
      if (submitError) throw submitError;

      if (signIn.status === "complete") {
        const { error: finalizeError } = await signIn.finalize({
          navigate: async ({ session, decorateUrl }) => {
            if (session?.currentTask) {
              console.log(session.currentTask);
              return;
            }
            const url = decorateUrl("/dashboard");
            if (url.startsWith("http")) {
              window.location.href = url;
            } else {
              router.push(url);
            }
          },
        });
        if (finalizeError) throw finalizeError;
      } else if (signIn.status === "needs_second_factor") {
        setError("Autentikasi 2 faktor diperlukan.");
      } else {
        setError("Gagal mereset password. Silakan coba lagi.");
      }
    } catch (err: any) {
      setError(formatClerkError(err));
    } finally {
      setLoading(false);
    }
  };

  // ---- STEP 3 UI: Reset Password ----
  if (step === "reset") {
    return (
      <div className="space-y-5">
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <div className="size-14 rounded-2xl bg-gradient-to-br from-sky-100 to-purple-100 flex items-center justify-center">
            <ShieldCheck className="size-7 text-sky-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Reset Password</h3>
            <p className="text-sm text-slate-500 mt-1">
              Kami kirim kode 6 digit ke <span className="font-semibold text-slate-700">{email}</span>
            </p>
          </div>
        </div>

        <form onSubmit={handleResetSubmit} className="space-y-4">
          <FormField
            label="Password Baru"
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
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            }
          />

          {error && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 px-3 py-2.5 text-xs text-rose-700 animate-in fade-in slide-in-from-top-1">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || isFetching || password.length < 8}
            className="group w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-gradient-to-r from-sky-500 via-sky-600 to-purple-600 text-white text-sm font-bold shadow-lg shadow-sky-300/40 hover:shadow-xl hover:shadow-purple-300/40 hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:transform-none"
          >
            {loading || isFetching ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Mereset...
              </>
            ) : (
              <>
                Reset & Masuk
                <ArrowRight className="size-4 group-hover:translate-x-0.5 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="flex items-center justify-center text-xs">
          <button
            type="button"
            onClick={() => { setStep("request"); setCode(""); setPassword(""); setError(null); }}
            className="font-medium text-slate-500 hover:text-slate-700 transition-colors"
          >
            ← Kembali ke input email
          </button>
        </div>
      </div>
    );
  }

  // ---- STEP 2 UI: Verify Code ----
  if (step === "verify") {
    return (
      <div className="space-y-5">
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <div className="size-14 rounded-2xl bg-gradient-to-br from-sky-100 to-purple-100 flex items-center justify-center">
            <ShieldCheck className="size-7 text-sky-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Verifikasi Kode</h3>
            <p className="text-sm text-slate-500 mt-1">
              Kami kirim kode 6 digit ke <span className="font-semibold text-slate-700">{email}</span>
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
            <div className="rounded-xl bg-rose-50 border border-rose-200 px-3 py-2.5 text-xs text-rose-700 animate-in fade-in slide-in-from-top-1">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || isFetching || code.length !== 6}
            className="group w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-gradient-to-r from-sky-500 via-sky-600 to-purple-600 text-white text-sm font-bold shadow-lg shadow-sky-300/40 hover:shadow-xl hover:shadow-purple-300/40 hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:transform-none"
          >
            {loading || isFetching ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Memverifikasi...
              </>
            ) : (
              <>
                Verifikasi Kode
                <ArrowRight className="size-4 group-hover:translate-x-0.5 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="flex items-center justify-center text-xs">
          <button
            type="button"
            onClick={() => { setStep("request"); setCode(""); setError(null); }}
            className="font-medium text-slate-500 hover:text-slate-700 transition-colors"
          >
            ← Kembali ke input email
          </button>
        </div>
      </div>
    );
  }

  // ---- STEP 1: Request Form ----
  return (
    <div className="space-y-5">
      <form onSubmit={handleRequestSubmit} className="space-y-4">
        <FormField
          label="Email Terdaftar"
          icon={Mail}
          type="email"
          placeholder="kamu@email.com"
          value={email}
          onChange={setEmail}
          autoComplete="email"
          required
        />

        {error && (
          <div className="rounded-xl bg-rose-50 border border-rose-200 px-3 py-2.5 text-xs text-rose-700 animate-in fade-in slide-in-from-top-1">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || isFetching || !email}
          className="group w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-gradient-to-r from-sky-500 via-sky-600 to-purple-600 text-white text-sm font-bold shadow-lg shadow-sky-300/40 hover:shadow-xl hover:shadow-purple-300/40 hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:transform-none"
        >
          {loading || isFetching ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Memproses...
            </>
          ) : (
            <>
              Kirim Kode Reset
              <ArrowRight className="size-4 group-hover:translate-x-0.5 transition-transform" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}

// ---------------------------------------------------------------------------

function FormField({
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
      <label className="block text-xs font-semibold text-slate-700">{label}</label>
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
          <div className="absolute right-3 top-1/2 -translate-y-1/2">{rightAccessory}</div>
        )}
      </div>
    </div>
  );
}

/** Format ClerkError ke pesan readable. */
function formatClerkError(err: any): string {
  if (err.errors && err.errors.length > 0) {
    const firstErr = err.errors[0];
    if (firstErr.code === "form_identifier_not_found") {
      return "Email tidak terdaftar dalam sistem.";
    }
    return firstErr.longMessage ?? firstErr.message ?? "Terjadi kesalahan.";
  }
  return err.longMessage ?? err.message ?? "Terjadi kesalahan.";
}