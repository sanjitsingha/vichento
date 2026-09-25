"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/context/ToastContext";
import AuthShell, {
  FormError,
  inputClass,
  primaryButtonClass,
} from "@/app/components/AuthShell";

export default function ResetPasswordPage() {
  const router = useRouter();
  const toast = useToast();
  const [ready, setReady] = useState(null); // null = checking, true/false
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // The recovery link signs the user in with a temporary session.
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setReady(!!data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) setReady(true);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (password.length < 8) return setError("Use at least 8 characters.");
    if (password !== confirm) return setError("Passwords don't match.");

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) return setError(error.message);

    toast("Password updated");
    router.replace("/");
  };

  if (ready === false) {
    return (
      <AuthShell
        title="Link expired"
        subtitle="This password reset link is invalid or has expired."
        redirectIfAuthed={false}
      >
        <Link href="/forgot-password" className={`${primaryButtonClass} block text-center`}>
          Request a new link
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Set a new password"
      subtitle="Choose a strong password you haven't used before."
      redirectIfAuthed={false}
    >
      <form onSubmit={handleSubmit} className="flex flex-col">
        <label htmlFor="new-password" className="text-xs text-gray-700">
          New password
        </label>
        <input
          id="new-password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClass}
          required
        />
        <label htmlFor="confirm-password" className="mt-6 text-xs text-gray-700">
          Confirm password
        </label>
        <input
          id="confirm-password"
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className={inputClass}
          required
        />
        <FormError>{error}</FormError>
        <button
          type="submit"
          disabled={loading || ready === null}
          className={`${primaryButtonClass} mt-8`}
        >
          {loading ? "Updating…" : "Update password"}
        </button>
      </form>
    </AuthShell>
  );
}
