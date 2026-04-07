"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleUser = async () => {
      // 1. Get user
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error) {
        console.error(error);
        return;
      }

      if (!user) {
        router.push("/login");
        return;
      }

      // 2. Check if user exists in DB
      const { data: existingUser } = await supabase
        .from("users")
        .select("id")
        .eq("id", user.id)
        .single();

      // 3. If NOT → create user
      if (!existingUser) {
        const name = user.user_metadata.full_name || "User";

        await supabase.from("users").insert([
          {
            id: user.id,
            email: user.email,
            name,
            username: name.toLowerCase().replace(/\s+/g, "") + Math.floor(1000 + Math.random() * 9000),
            avatar: user.user_metadata.avatar_url,
          },
        ]);
      }

      // 4. Redirect
      router.push("/");
    };

    handleUser();
  }, []);

  return <p>Logging you in...</p>;
}