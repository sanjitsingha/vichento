"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { ensureUserProfile } from "@/lib/userUtils";
import { useAuthContext } from "@/context/AuthContext";
import { getNextPath } from "@/app/components/AuthShell";

export default function AuthCallback() {
  const router = useRouter();
  const { refreshProfile } = useAuthContext();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const handleUser = async () => {
      // getSession() waits for supabase-js to finish reading the tokens/code
      // from the URL (OAuth or email-confirmation redirect).
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error || !session?.user) {
        console.error("Auth callback failed:", error);
        setFailed(true);
        return;
      }

      await ensureUserProfile(session.user);
      await refreshProfile();
      router.replace(getNextPath());
    };

    handleUser();
  }, [router, refreshProfile]);

  if (failed) {
    return (
      <div className="flex h-[calc(100vh-64px)] flex-col items-center justify-center px-6 text-center">
        <h1 className="font-creato text-2xl font-bold text-black">
          We couldn&apos;t sign you in
        </h1>
        <p className="mt-2 max-w-sm text-sm text-gray-500">
          The link may have expired or already been used. Please try again.
        </p>
        <Link
          href="/signin"
          className="mt-6 rounded-full bg-black px-6 py-2.5 text-sm text-white hover:bg-gray-800"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-64px)] flex-col items-center justify-center gap-4">
      <Image src="/logo.png" alt="" width={56} height={56} priority className="animate-pulse" />
      <p className="text-sm text-gray-500">Signing you in…</p>
    </div>
  );
}
