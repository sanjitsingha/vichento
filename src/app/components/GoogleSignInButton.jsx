"use client";
import { FcGoogle } from "react-icons/fc";

import { supabase } from "@/lib/supabaseClient";

export default function GoogleSignInButton() {
 const handleGoogleLogin = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  if (error) {
    console.error(error.message);
  }
};

  return (
    <button
      onClick={handleGoogleLogin}
      className="border px-4 py-2 cursor-pointer text-black w-[280px] justify-center rounded-full flex items-center gap-2"
    >
      <FcGoogle size={24} />
      Continue with Google
    </button>
  );
}
