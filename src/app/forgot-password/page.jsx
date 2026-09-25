"use client";

import React, { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { SUPPORT_EMAIL } from "@/lib/constants";
import AuthShell, {
  FormError,
  inputClass,
  primaryButtonClass,
} from "@/app/components/AuthShell";

const Page = () => {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${appUrl}/reset-password`,
      });

      if (error) throw error;
      setSent(true);
    } catch (error) {
      setError(error.message || "Failed to send password reset email.");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <AuthShell
        title="Check your inbox"
        subtitle={`If an account exists for ${email}, you'll receive a link to reset your password shortly.`}
        footer={
          <Link href="/signin" className="text-sm text-black/60 underline underline-offset-2 hover:text-black">
            Back to sign in
          </Link>
        }
      >
        <button
          onClick={() => setSent(false)}
          className="w-full text-center text-sm text-black/60 hover:text-black"
        >
          Didn&apos;t get it? Try another email
        </button>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Forgot password"
      subtitle="No worries. Enter your email and we'll send you a link to reset your password."
      footer={
        <>
          <Link href="/signin" className="text-sm text-black/60 underline underline-offset-2 hover:text-black">
            Back to sign in
          </Link>
          <p className="mt-6 text-[12px] text-black/50">
            Need urgent help? Write to{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`} className="font-medium text-black underline">
              {SUPPORT_EMAIL}
            </a>
          </p>
        </>
      }
    >
      <form className="flex flex-col" onSubmit={handleSubmit}>
        <label className="text-xs text-gray-700" htmlFor="email">
          Registered email
        </label>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          id="email"
          autoComplete="email"
          className={inputClass}
          type="email"
          required
        />

        <FormError>{error}</FormError>

        <button type="submit" disabled={loading} className={`${primaryButtonClass} mt-8`}>
          {loading ? "Sending…" : "Send reset link"}
        </button>
      </form>
    </AuthShell>
  );
};

export default Page;
