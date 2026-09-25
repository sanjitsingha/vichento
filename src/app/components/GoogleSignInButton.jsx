"use client";
import { useState } from "react";
import { FcGoogle } from "react-icons/fc";

import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/context/ToastContext";
import { getNextPath, optionButtonClass } from "./AuthShell";

export default function GoogleSignInButton({ label = "Continue with Google" }) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    const next = encodeURIComponent(getNextPath());
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${next}`,
      },
    });

    if (error) {
      console.error(error.message);
      toast("Google sign-in is unavailable right now", "error");
      setLoading(false);
    }
  };

  return (
    <button onClick={handleGoogleLogin} disabled={loading} className={optionButtonClass}>
      <FcGoogle size={22} />
      {loading ? "Redirecting…" : label}
    </button>
  );
}
