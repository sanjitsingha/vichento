import { supabase } from "@/lib/supabaseClient";

/** Resolve a storage path or absolute URL to a displayable image URL. */
export function getImageUrl(path, bucket = "article-images") {
  if (!path) return null;
  if (/^(https?:|data:|blob:|\/)/.test(path)) return path;
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

export function stripHtml(html = "") {
  return String(html)
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/** Short plain-text teaser for cards. Prefers the subtitle. */
export function getExcerpt(article, max = 180) {
  const text = article?.meta_description?.trim() || stripHtml(article?.content);
  if (!text) return "";
  return text.length > max ? `${text.slice(0, max).trimEnd()}…` : text;
}

/** Minutes to read at ~225 words per minute. */
export function readingTime(html = "") {
  const words = stripHtml(html).split(" ").filter(Boolean).length;
  return Math.max(1, Math.round(words / 225));
}

export function formatDate(value, withYear) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const sameYear = d.getFullYear() === new Date().getFullYear();
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    ...(withYear || !sameYear ? { year: "numeric" } : {}),
  });
}

export function slugify(text = "") {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 80);
}

/** Normalise an article row (with joined `users`) for the card components. */
export function toCardArticle(article) {
  return {
    ...article,
    author_name: article.users?.name || "Unknown",
    author_username: article.users?.username || article.users?.id || article.author_id,
    author_avatar: article.users?.avatar ? getImageUrl(article.users.avatar) : null,
    thumbnail: getImageUrl(article.cover_image),
  };
}

/** Share a URL with the native sheet, falling back to the clipboard. Returns "shared" | "copied" | null. */
export async function shareLink({ title, url }) {
  try {
    if (navigator.share) {
      await navigator.share({ title, text: title, url });
      return "shared";
    }
    await navigator.clipboard.writeText(url);
    return "copied";
  } catch {
    // User dismissed the share sheet.
    return null;
  }
}
