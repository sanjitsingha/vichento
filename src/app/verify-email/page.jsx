"use client";

import { useState, useEffect } from "react";
import { account } from "@/lib/appwrite";
import { useRouter } from "next/navigation";

export default function VerifyPending() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [email, setEmail] = useState("");

  // ✅ Get user email + auto redirect if already verified
  useEffect(() => {
    const checkUser = async () => {
      try {
        const user = await account.get();

        setEmail(user.email);

        // ✅ already verified → redirect
        if (user.emailVerification) {
          router.push("/");
        }
      } catch (err) {
        console.error(err);
      }
    };

    checkUser();
  }, []);

  // ✅ Resend verification email
  const handleResend = async () => {
    if (cooldown > 0) return;

    try {
      setLoading(true);
      setMsg("");

      await account.createVerification(
        "http://localhost:3000/verify-email"
      );

      setMsg("Verification email sent again 📩");

      // ✅ cooldown start (30 sec)
      setCooldown(30);
      const timer = setInterval(() => {
        setCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

    } catch (err) {
      console.error(err);
      setMsg("Failed to resend email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex flex-col items-center justify-center text-center px-6">
      
      <h1 className="text-2xl font-semibold mb-4">
        Verify your email 📩
      </h1>

      <p className="text-sm text-black/60 mb-2 max-w-sm">
        We’ve sent a verification link to:
      </p>

      {/* ✅ show user email */}
      <p className="text-sm font-medium mb-6">
        {email || "your email"}
      </p>

      <p className="text-xs text-black/50 mb-6 max-w-sm">
        Please check your inbox and click the link to continue.
      </p>

      <button
        onClick={handleResend}
        disabled={loading || cooldown > 0}
        className="bg-black text-white px-6 py-2 rounded-full disabled:opacity-60"
      >
        {loading
          ? "Sending..."
          : cooldown > 0
          ? `Wait ${cooldown}s`
          : "Resend Email"}
      </button>

      {msg && (
        <p className="text-sm mt-4 text-green-600">{msg}</p>
      )}

      {/* Optional helper text */}
      <p className="text-xs text-black/40 mt-6">
        Didn’t receive the email? Check spam folder.
      </p>
    </div>
  );
}