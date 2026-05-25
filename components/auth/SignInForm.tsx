"use client";

import { useState } from "react";
import { useSignIn } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, Eye, EyeOff, Loader2, ArrowRight } from "lucide-react";
import { GoogleOAuthButton } from "./GoogleOAuthButton";

export function SignInForm() {
  const { signIn } = useSignIn();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Single-step password sign-in via Clerk Signal API.
      const createRes = await signIn.create({
        identifier: email,
        password,
      });
      if (createRes.error) {
        setError(formatClerkError(createRes.error));
        return;
      }

      // Setelah create dengan password, status mestinya `complete`.
      // Finalize untuk activate session lalu redirect.
      if (signIn.status === "complete") {
        const finRes = await signIn.finalize();
        if (finRes.error) {
          setError(formatClerkError(finRes.error));
          return;
        }
        router.push("/dashboard");
      } else {
        // Jarang terjadi (mis. user butuh 2FA) — beri hint manual.
        setError(
          "Login butuh verifikasi tambahan. Silakan ulangi atau hubungi admin.",
        );
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Login gagal";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Google OAuth */}
      <GoogleOAuthButton mode="sign-in" />

      {/* Divider */}
      <div className="relative flex items-center gap-3">
        <div className="flex-1 h-px bg-slate-200" />
        <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">
          Atau
        </span>
        <div className="flex-1 h-px bg-slate-200" />
      </div>

      {/* Email/password form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField
          label="Email"
          icon={Mail}
          type="email"
          placeholder="kamu@email.com"
          value={email}
          onChange={setEmail}
          autoComplete="email"
          required
        />

        <FormField
          label="Password"
          icon={Lock}
          type={showPassword ? "text" : "password"}
          placeholder="Masukkan password"
          value={password}
          onChange={setPassword}
          autoComplete="current-password"
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

        <div className="flex justify-end">
          <Link
            href="/sign-in/forgot-password"
            className="text-xs font-medium text-sky-600 hover:text-sky-700 transition-colors"
          >
            Lupa password?
          </Link>
        </div>

        {error && (
          <div className="rounded-xl bg-rose-50 border border-rose-200 px-3 py-2.5 text-xs text-rose-700">
            {error}
          </div>
        )}

        {/* Clerk CAPTCHA mount point — wajib untuk sign-in di v7 */}
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
              Masuk
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

/** Format ClerkError ke pesan readable. */
function formatClerkError(err: { message?: string; longMessage?: string }): string {
  return err.longMessage ?? err.message ?? "Terjadi kesalahan.";
}
