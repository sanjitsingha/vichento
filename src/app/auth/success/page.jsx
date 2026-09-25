"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Legacy OAuth redirect target — forward to the real callback handler,
// keeping the query string and hash so the session can be read.
export default function OAuthSuccess() {
  const router = useRouter();

  useEffect(() => {
    router.replace(`/auth/callback${window.location.search}${window.location.hash}`);
  }, [router]);

  return null;
}
