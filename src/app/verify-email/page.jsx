"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { EnvelopeOpenIcon } from "@heroicons/react/24/outline";
import { supabase } from "@/lib/supabaseClient";
import AuthShell, { primaryButtonClass } from "@/app/components/AuthShell";

export default function VerifyPending() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [cooldown, setCooldown] = useState(0);
  const [email, setEmail] = useState("");
  const timer = useRef(null);

  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get("email");
    if (fromUrl) setEmail(fromUrl);

    supabase.auth.getUser().then(({ data }) => {
      if (!data?.user) return;
      if (!fromUrl) setEmail(data.user.email || "");
      if (data.user.email_confirmed_at) router.replace("/");
    });

    return () => clearInterval(timer.current);
  }, [router]);

  const handleResend = async () => {
    if (cooldown > 0 || !email) return;

    try {
      setLoading(true);
      setMsg(null);

      const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: {
          emailRedirectTo: `${appUrl}/auth/callback`,
        },
      });

      if (error) throw error;

      setMsg({ ok: true, text: "Verification email sent again." });
      setCooldown(30);
      clearInterval(timer.current);
      timer.current = setInterval(() => {
        setCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(timer.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      console.error(err);
      setMsg({ ok: false, text: "Failed to resend email. Please try again shortly." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Check your inbox"
      subtitle="Click the link we sent to finish creating your account."
      redirectIfAuthed={false}
      footer={
        <>
          <p className="text-xs text-black/50">
            Didn&apos;t receive it? Check your spam folder, or resend below.
          </p>
          <Link
            href="/signin"
            className="mt-4 inline-block text-sm text-black/60 underline underline-offset-2 hover:text-black"
          >
            Back to sign in
          </Link>
        </>
      }
    >
      <div className="flex flex-col items-center text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#fdeeea] text-primary">
          <EnvelopeOpenIcon className="size-7" />
        </span>
        <p className="mt-5 text-sm text-black/60">We sent a verification link to</p>
        <p className="mt-1 break-all text-sm font-medium text-black">
          {email || "your email address"}
        </p>

        <button
          onClick={handleResend}
          disabled={loading || cooldown > 0 || !email}
          className={`${primaryButtonClass} mt-8`}
        >
          {loading ? "Sending…" : cooldown > 0 ? `Resend in ${cooldown}s` : "Resend email"}
        </button>

        {msg && (
          <p className={`mt-4 text-sm ${msg.ok ? "text-green-700" : "text-red-600"}`}>
            {msg.text}
          </p>
        )}
      </div>
    </AuthShell>
  );
}
