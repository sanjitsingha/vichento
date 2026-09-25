import { supabase } from "@/lib/supabaseClient";

export const generateUsername = (name = "") => {
  const cleanName = name.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 20) || "writer";
  const random = Math.floor(1000 + Math.random() * 9000);
  return `${cleanName}${random}`;
};

/**
 * Make sure a `users` row exists for the signed-in auth user. Details come
 * from user_metadata (email sign-up) or the OAuth provider (Google).
 */
export async function ensureUserProfile(user) {
  if (!user) return;

  const { data: existing } = await supabase
    .from("users")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (existing) return;

  const meta = user.user_metadata || {};
  const name = meta.display_name || meta.full_name || meta.name || user.email?.split("@")[0] || "Writer";

  const { error } = await supabase.from("users").insert([
    {
      id: user.id,
      email: user.email,
      name,
      username: meta.username || generateUsername(name),
      avatar: meta.avatar_url || meta.picture || null,
      ...(meta.dob ? { dob: meta.dob } : {}),
      ...(meta.profession ? { profession: meta.profession } : {}),
    },
  ]);

  if (error) console.error("Creating user profile failed:", error);
}
