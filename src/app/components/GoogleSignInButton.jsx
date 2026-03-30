"use client";
import { FcGoogle } from "react-icons/fc";

import { account } from "@/lib/appwrite";

export default function GoogleSignInButton() {
  const handleGoogleLogin = () => {
    account.createOAuth2Session(
      "google",
      `${window.location.origin}/auth/success`,
      `${window.location.origin}/auth/failure`
    );
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
