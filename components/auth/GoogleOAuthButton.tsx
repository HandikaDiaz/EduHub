"use client";

import { useState } from "react";
import { useSignIn, useSignUp } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";
import { captureClientError } from "@/lib/sentry";

interface GoogleOAuthButtonProps {
  /** "sign-in" pakai useSignIn, "sign-up" pakai useSignUp. */
  mode: "sign-in" | "sign-up";
  /** Custom label. Default mengikuti mode. */
  label?: string;
}

/**
 * Tombol OAuth Google — pakai Clerk Signal API (`signIn.sso` / `signUp.sso`).
 * Setelah Google redirect kembali, user mendarat di /sso-callback yang akan
 * `<AuthenticateWithRedirectCallback />` resolve session lalu lempar ke
 * /dashboard.
 */
export function GoogleOAuthButton({ mode, label }: GoogleOAuthButtonProps) {
  const { signIn } = useSignIn();
  const { signUp } = useSignUp();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    setLoading(true);
    setError(null);

    try {
      const driver = mode === "sign-in" ? signIn : signUp;

      // redirectUrl: tujuan akhir setelah callback (dashboard)
      // redirectCallbackUrl: URL halaman SSO callback yang handle Clerk
      const result = await driver.sso({
        strategy: "oauth_google",
        redirectUrl: "/dashboard",
        redirectCallbackUrl: `${window.location.origin}/sso-callback`,
      });

      if (result.error) {
        setError(result.error.message ?? "Gagal login Google");
        captureClientError(result.error, {
          component: "GoogleOAuthButton",
          mode,
        });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Gagal login Google";
      setError(msg);
      captureClientError(err, { component: "GoogleOAuthButton", mode });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-1.5">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
      >
        {loading ? (
          <Loader2 className="size-4 animate-spin text-slate-500" />
        ) : (
          <GoogleLogo />
        )}
        <span>
          {label ??
            (mode === "sign-in" ? "Masuk dengan Google" : "Daftar dengan Google")}
        </span>
      </button>
      {error && <p className="text-xs text-rose-500 text-center">{error}</p>}
    </div>
  );
}

function GoogleLogo() {
  return (
    <svg className="size-4" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M12 5c1.617 0 3.077.554 4.225 1.633l3.155-3.155C17.45 1.553 14.892.5 12 .5 7.392.5 3.397 3.137 1.527 7.075l3.665 2.846C6.067 7.13 8.81 5 12 5z"
      />
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.28 1.5-1.13 2.78-2.41 3.63l3.7 2.87c2.16-2 3.43-4.94 3.43-8.74z"
      />
      <path
        fill="#FBBC05"
        d="M5.19 14.43A7.04 7.04 0 014.84 12c0-.85.13-1.68.36-2.45L1.53 6.7A11.59 11.59 0 00.5 12c0 1.86.45 3.62 1.27 5.18l3.42-2.75z"
      />
      <path
        fill="#34A853"
        d="M12 23.5c3.24 0 5.96-1.07 7.95-2.91l-3.7-2.87c-1.03.7-2.36 1.11-4.25 1.11-3.19 0-5.93-2.13-6.91-5.01l-3.42 2.75C3.4 20.85 7.39 23.5 12 23.5z"
      />
    </svg>
  );
}
