"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { supabase } from "@/lib/supabaseClient";
import AuthShell, {
  FormError,
  getNextPath,
  inputClass,
  primaryButtonClass,
} from "@/app/components/AuthShell";

export default function EmailLogin() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: pass,
    });

    if (error) {
      setLoading(false);
      if (/confirm/i.test(error.message)) {
        router.push(`/verify-email?email=${encodeURIComponent(email.trim())}`);
        return;
      }
      setErrorMsg(
        /invalid/i.test(error.message)
          ? "That email and password combination doesn't match our records."
          : "We couldn't sign you in right now. Please try again.",
      );
      return;
    }

    // Supabase stores the session; AuthContext picks it up via onAuthStateChange.
    router.replace(getNextPath());
  };

  return (
    <AuthShell
      title="Sign in with email"
      subtitle="Enter the email address and password associated with your account."
      footer={
        <div className="flex flex-col items-center gap-3 text-sm">
          <Link href="/forgot-password" className="text-black/60 hover:text-black">
            Forgot your password?
          </Link>
          <Link href="/signin" className="text-black/60 underline underline-offset-2 hover:text-black">
            ← All sign in options
          </Link>
        </div>
      }
    >
      <form className="flex flex-col" onSubmit={handleLogin}>
        <label htmlFor="email" className="text-xs text-gray-700">
          Your email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
          required
        />

        <label htmlFor="password" className="mt-6 text-xs text-gray-700">
          Password
        </label>
        <div className="relative w-full">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            className={`${inputClass} pr-8`}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-0 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-black"
          >
            {showPassword ? (
              <EyeSlashIcon className="h-5 w-5" />
            ) : (
              <EyeIcon className="h-5 w-5" />
            )}
          </button>
        </div>

        <FormError>{errorMsg}</FormError>

        <button type="submit" disabled={loading} className={`${primaryButtonClass} mt-10`}>
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </AuthShell>
  );
}
