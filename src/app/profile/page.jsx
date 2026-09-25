"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/context/AuthContext";
import { supabase } from "@/lib/supabaseClient";

export default function ProfileRedirect() {
  const { user, profile, loading } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/signin?next=/profile");
      return;
    }
    if (profile?.username) {
      router.replace(`/profile/${profile.username}`);
      return;
    }

    // Profile not in context yet — look it up directly.
    supabase
      .from("users")
      .select("username")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => router.replace(`/profile/${data?.username || user.id}`));
  }, [user, profile, loading, router]);

  return (
    <div className="flex h-[calc(100vh-64px)] items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-4">
        <div className="h-16 w-16 rounded-full shimmer" />
        <div className="h-4 w-32 rounded shimmer" />
      </div>
    </div>
  );
}
